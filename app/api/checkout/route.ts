import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { CARD_PROMPT_VERSION } from "@/lib/ai/prompts/card";
import { LYRICS_PROMPT_VERSION } from "@/lib/ai/prompts/lyrics";
import { getCardDesign } from "@/lib/card-designs";
import { siteUrl } from "@/lib/env";
import { createPendingOrder } from "@/lib/orders";
import { CARD_PRICE_PENCE, CURRENCY, LYRICS_PRICE_PENCE } from "@/lib/pricing";
import { AUTOMATIC_TAX_ENABLED, DIGITAL_CONSENT_TEXT, getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutRequestSchema, type CheckoutRequest } from "@/lib/validation";

type CheckoutResult = { url: string } | { error: string; status: number };

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Settings shared by every Checkout Session. */
function baseSession(): Pick<
  Stripe.Checkout.SessionCreateParams,
  "mode" | "automatic_tax" | "custom_text"
> {
  return {
    mode: "payment",
    automatic_tax: { enabled: AUTOMATIC_TAX_ENABLED },
    custom_text: { submit: { message: DIGITAL_CONSENT_TEXT } },
  };
}

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
    ...baseSession(),
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

/**
 * Pay first: the form inputs are saved as a pending generation, and the
 * generation id travels in the Checkout metadata. Nothing is generated
 * until the webhook marks the order paid.
 */
async function checkoutCard(
  request: Extract<CheckoutRequest, { kind: "card" }>,
  origin: string,
): Promise<CheckoutResult> {
  const design = await getCardDesign(request.designSlug);
  if (!design) {
    return { error: "That card design isn't available any more. Pick another one.", status: 404 };
  }

  const db = createAdminClient();
  const { data: generation, error } = await db
    .from("generations")
    .insert({
      kind: "card",
      design_id: design.slug,
      input: { ...request.input, promptVersion: CARD_PROMPT_VERSION },
    })
    .select("id")
    .single();
  if (error) throw new Error(`Creating generation failed: ${error.message}`);

  const session = await getStripe().checkout.sessions.create({
    ...baseSession(),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: CARD_PRICE_PENCE,
          product_data: {
            name: `Personal Christmas card for ${request.input.recipientName}`,
            description: `${design.name} design. Message written for them, with 3 rewrites included. PNG and PDF download.`,
          },
        },
      },
    ],
    metadata: { kind: "card", generation_id: generation.id },
    success_url: `${origin}/cards/${generation.id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cards`,
  });
  if (!session.url) throw new Error("Stripe returned no checkout URL");

  await createPendingOrder({
    kind: "card",
    generationId: generation.id,
    sessionId: session.id,
    amountPence: CARD_PRICE_PENCE,
    currency: CURRENCY,
  });
  return { url: session.url };
}

/** Pay first, like cards: inputs saved as a pending lyrics generation. */
async function checkoutLyrics(
  request: Extract<CheckoutRequest, { kind: "lyrics" }>,
  origin: string,
): Promise<CheckoutResult> {
  const { data: generation, error } = await createAdminClient()
    .from("generations")
    .insert({
      kind: "lyrics",
      design_id: null,
      input: { ...request.input, promptVersion: LYRICS_PROMPT_VERSION },
    })
    .select("id")
    .single();
  if (error) throw new Error(`Creating generation failed: ${error.message}`);

  const session = await getStripe().checkout.sessions.create({
    ...baseSession(),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: LYRICS_PRICE_PENCE,
          product_data: {
            name: `Personal Christmas song lyrics for ${request.input.recipientName}`,
            description:
              "Original lyrics written for them, with 3 rewrites included. PDF and TXT download.",
          },
        },
      },
    ],
    metadata: { kind: "lyrics", generation_id: generation.id },
    success_url: `${origin}/lyrics/${generation.id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/lyrics`,
  });
  if (!session.url) throw new Error("Stripe returned no checkout URL");

  await createPendingOrder({
    kind: "lyrics",
    generationId: generation.id,
    sessionId: session.id,
    amountPence: LYRICS_PRICE_PENCE,
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
        : data.kind === "card"
          ? await checkoutCard(data, origin)
          : await checkoutLyrics(data, origin);
    if ("error" in result) return errorResponse(result.error, result.status);
    return NextResponse.json({ url: result.url });
  } catch (err) {
    console.error("[checkout] failed", err);
    return errorResponse("Checkout couldn't start. Please try again in a minute.", 500);
  }
}
