import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getAddonsFor } from "@/lib/addons";
import { siteUrl } from "@/lib/env";
import { OCCASIONS, toOccasion } from "@/lib/occasions";
import { createPendingOrder } from "@/lib/orders";
import {
  CARD_PRICE_PENCE,
  CURRENCY,
  VOICE_GREETING_PRICE_PENCE,
  songPricePence,
  type SongLength,
} from "@/lib/pricing";
import { AUTOMATIC_TAX_ENABLED, DIGITAL_CONSENT_TEXT, getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutRequestSchema, type CheckoutRequest } from "@/lib/validation";

type CheckoutResult = { url: string } | { error: string; status: number };

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Settings shared by every Checkout Session. */
/**
 * Settings shared by every Checkout Session. `description` names what was
 * bought (e.g. "Family Quiz Night"). It becomes the PaymentIntent and charge
 * description that Stripe reports show. Keep it free of personal data such
 * as recipient names.
 */
function baseSession(description: string): Pick<
  Stripe.Checkout.SessionCreateParams,
  "mode" | "automatic_tax" | "custom_text" | "payment_intent_data"
> {
  return {
    mode: "payment",
    automatic_tax: { enabled: AUTOMATIC_TAX_ENABLED },
    custom_text: { submit: { message: DIGITAL_CONSENT_TEXT } },
    payment_intent_data: { description: description.slice(0, 500) },
  };
}

/** "Personal birthday card", "Personal song", without a double space for "just because". */
const personalLabel = (adjective: string, noun: string) =>
  `Personal ${adjective} ${noun}`.replace(/s+/g, " ");

async function checkoutProduct(productId: string, origin: string): Promise<CheckoutResult> {
  const { data: product, error } = await createAdminClient()
    .from("products")
    .select("id, slug, name, description, price_pence, currency, active")
    .eq("id", productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!product || !product.active) {
    return {
      error: "This product isn't available any more. Head back to the shop to see what's in stock.",
      status: 404,
    };
  }

  const session = await getStripe().checkout.sessions.create({
    ...baseSession(product.name),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: product.currency,
          unit_amount: product.price_pence,
          product_data: { name: product.name, description: product.description || undefined },
        },
      },
    ],
    metadata: { kind: "product", product_id: product.id },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop/${product.slug}`,
  });
  if (!session.url) throw new Error("Stripe returned no checkout URL");

  await createPendingOrder({
    kind: "product",
    productId: product.id,
    sessionId: session.id,
    amountPence: product.price_pence,
    currency: product.currency,
  });
  return { url: session.url };
}

const SONG_LENGTH_NOTE: Record<SongLength, string> = {
  short: "about 40 seconds",
  standard: "about 1 to 1½ minutes",
  long: "about 2 minutes",
};

/**
 * Checkout for a song: one price covers the lyrics and the sung recording
 * (decision 2026-11-10), stepped by length.
 */
async function songSession(
  generationId: string,
  input: { recipientName: string; length: SongLength; occasion?: unknown },
  origin: string,
  cancelPath: string,
): Promise<CheckoutResult> {
  const price = songPricePence(input.length);
  const session = await getStripe().checkout.sessions.create({
    ...baseSession(`${personalLabel(OCCASIONS[toOccasion(input.occasion)].adjective, "song")} (${input.length})`),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: price,
          product_data: {
            name: `Personal ${OCCASIONS[toOccasion(input.occasion)].adjective} song for ${input.recipientName}`.replace("  ", " "),
            description: `Original lyrics, recorded as a full sung song (${SONG_LENGTH_NOTE[input.length]}). 3 rewrites included. MP3, PDF and text downloads.`,
          },
        },
      },
    ],
    metadata: { kind: "lyrics", generation_id: generationId },
    success_url: `${origin}/lyrics/${generationId}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${cancelPath}`,
  });
  if (!session.url) throw new Error("Stripe returned no checkout URL");

  await createPendingOrder({
    kind: "lyrics",
    generationId,
    sessionId: session.id,
    amountPence: price,
    currency: CURRENCY,
  });
  return { url: session.url };
}

type PreviewRow = {
  id: string;
  kind: string;
  locked: boolean;
  output_text: string | null;
  input: { recipientName?: string; length?: SongLength; occasion?: unknown } | null;
  orders: { status: string }[];
};

/**
 * Pay for a card or song the buyer has already previewed for free. An
 * abandoned earlier checkout for the same item is replaced, not duplicated.
 */
async function checkoutPreview(generationId: string, origin: string): Promise<CheckoutResult> {
  const db = createAdminClient();
  const { data: g, error } = await db
    .from("generations")
    .select("id, kind, locked, output_text, input, orders(status)")
    .eq("id", generationId)
    .maybeSingle<PreviewRow>();
  if (error) throw new Error(error.message);
  if (!g || (g.kind !== "card" && g.kind !== "lyrics")) {
    return { error: "We couldn't find that preview. Start a new one.", status: 404 };
  }
  if (g.orders.some((o) => o.status === "paid")) {
    return { error: "You've already paid for this. Refresh the page.", status: 409 };
  }
  if (!g.output_text) return { error: "Your preview is still being written.", status: 409 };

  const { error: deleteError } = await db
    .from("orders")
    .delete()
    .eq("generation_id", g.id)
    .eq("status", "pending");
  if (deleteError) throw new Error(`Replacing old checkout failed: ${deleteError.message}`);

  const recipientName = g.input?.recipientName ?? "them";
  const studioPath = `/${g.kind === "card" ? "cards" : "lyrics"}/${g.id}`;
  if (g.kind === "lyrics") {
    return songSession(
      g.id,
      { recipientName, length: g.input?.length ?? "standard", occasion: g.input?.occasion },
      origin,
      studioPath,
    );
  }

  const session = await getStripe().checkout.sessions.create({
    ...baseSession(personalLabel(OCCASIONS[toOccasion(g.input?.occasion)].adjective, "card")),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: CARD_PRICE_PENCE,
          product_data: {
            name: `Personal ${OCCASIONS[toOccasion(g.input?.occasion)].adjective} card for ${recipientName}`.replace("  ", " "),
            description: "The card you previewed, with 3 more rewrites, editing, and print-ready PNG and PDF downloads.",
          },
        },
      },
    ],
    metadata: { kind: "card", generation_id: g.id },
    success_url: `${origin}${studioPath}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${studioPath}`,
  });
  if (!session.url) throw new Error("Stripe returned no checkout URL");
  await createPendingOrder({
    kind: "card",
    generationId: g.id,
    sessionId: session.id,
    amountPence: CARD_PRICE_PENCE,
    currency: CURRENCY,
  });
  return { url: session.url };
}

type ParentRow = {
  id: string;
  kind: string;
  locked: boolean;
  input: { recipientName?: string } | null;
  orders: { status: string }[];
};

/**
 * ElevenLabs add-ons attach to a finished, paid card or song. A sung version
 * needs lyrics; a voice greeting works with either. One paid add-on of each
 * kind per item.
 */
async function checkoutAddon(
  request: Extract<CheckoutRequest, { kind: "song_audio" | "voice_greeting" }>,
  origin: string,
): Promise<CheckoutResult> {
  const db = createAdminClient();
  const { data: parent, error } = await db
    .from("generations")
    .select("id, kind, locked, input, orders(status)")
    .eq("id", request.parentGenerationId)
    .maybeSingle<ParentRow>();
  if (error) throw new Error(error.message);

  const allowedParents = request.kind === "song_audio" ? ["lyrics"] : ["card", "lyrics"];
  if (!parent || !allowedParents.includes(parent.kind) || parent.orders[0]?.status !== "paid") {
    return { error: "We couldn't find that order.", status: 404 };
  }
  if (!parent.locked) {
    return {
      error: `Finish your ${parent.kind === "card" ? "card" : "song"} first, then add this.`,
      status: 409,
    };
  }

  if (request.kind === "song_audio") {
    return { error: "Every song now comes sung. Save your song to record it.", status: 409 };
  }

  const existing = await getAddonsFor(parent.id);
  if (existing[request.kind]?.order?.status === "paid") {
    return { error: "You've already added this. Scroll down to play it.", status: 409 };
  }

  const { data: addon, error: insertError } = await db
    .from("generations")
    .insert({ kind: request.kind, parent_id: parent.id, input: request.input })
    .select("id")
    .single();
  if (insertError) throw new Error(`Creating add-on failed: ${insertError.message}`);

  const recipient = parent.input?.recipientName ?? "them";
  const price = VOICE_GREETING_PRICE_PENCE;
  const studio = `${origin}/${parent.kind === "card" ? "cards" : "lyrics"}/${parent.id}`;

  const session = await getStripe().checkout.sessions.create({
    ...baseSession("Voice greeting"),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: price,
          product_data: {
            name: `Voice greeting for ${recipient}`,
            description:
              "Your words read aloud in the voice you chose, with re-recordings. MP3 download.",
          },
        },
      },
    ],
    metadata: { kind: request.kind, generation_id: addon.id },
    success_url: `${studio}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: studio,
  });
  if (!session.url) throw new Error("Stripe returned no checkout URL");

  await createPendingOrder({
    kind: request.kind,
    generationId: addon.id,
    sessionId: session.id,
    amountPence: price,
    currency: CURRENCY,
  });
  return { url: session.url };
}

/** Creates a Stripe Checkout Session. Prices always come from the server, never the request. */
export async function POST(request: Request) {
  const parsed = checkoutRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const message =
      issue?.path[0] === "input"
        ? `Check the form: ${issue.message}.`
        : "That item couldn't be found. Refresh the page and try again.";
    return errorResponse(message, 400);
  }

  try {
    const origin = siteUrl(request);
    const data = parsed.data;
    const result =
      data.kind === "product"
        ? await checkoutProduct(data.productId, origin)
        : data.kind === "preview"
              ? await checkoutPreview(data.generationId, origin)
              : await checkoutAddon(data, origin);
    if ("error" in result) return errorResponse(result.error, result.status);
    return NextResponse.json({ url: result.url });
  } catch (err) {
    console.error("[checkout] failed", err);
    return errorResponse("Checkout couldn't start. Please try again in a minute.", 500);
  }
}
