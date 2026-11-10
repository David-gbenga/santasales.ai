import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { AiOutputError, AiRefusalError, generateStructured } from "@/lib/ai/claude";
import { buildCardPrompt, cardOutputSchema, checkCardOutput } from "@/lib/ai/prompts/card";
import { getCardDesign } from "@/lib/card-designs";
import { cardPdfFromPng, renderCardPng } from "@/lib/card-render";
import { getCardGeneration, rewritesLeft, type CardGeneration } from "@/lib/generations";
import { MAX_REGENERATIONS } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCardRequestSchema, type CardText } from "@/lib/validation";

// Claude plus rendering can take a while; give the function room on Vercel.
export const maxDuration = 60;

type Reply = { text: CardText; rewritesLeft: number; locked: boolean };

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function reply(generation: CardGeneration, text: CardText, overrides: Partial<Reply> = {}) {
  return NextResponse.json({
    text,
    rewritesLeft: rewritesLeft(generation.regenCount),
    locked: generation.locked,
    ...overrides,
  } satisfies Reply);
}

async function writeCardText(generation: CardGeneration, previous: CardText[]): Promise<CardText> {
  return generateStructured({
    prompt: buildCardPrompt(generation.input, previous),
    schema: cardOutputSchema,
    check: checkCardOutput,
    maxTokens: 4000,
    effort: "low",
  });
}

/** First draft. Idempotent: a repeat call (e.g. page refresh) returns the stored draft for free. */
async function handleGenerate(generation: CardGeneration) {
  if (generation.text) return reply(generation, generation.text);

  const text = await writeCardText(generation, []);
  const db = createAdminClient();
  const { data: saved, error } = await db
    .from("generations")
    .update({ output_text: JSON.stringify(text) })
    .eq("id", generation.id)
    .is("output_text", null)
    .select("id");
  if (error) throw new Error(`Saving draft failed: ${error.message}`);

  if (saved.length === 0) {
    // Another request saved a draft first; return that one so the buyer sees one version.
    const latest = await getCardGeneration(generation.id);
    if (latest?.text) return reply(latest, latest.text);
  }
  return reply(generation, text);
}

/** Rewrite. The slot is claimed atomically before calling Claude, so retries can't exceed the limit. */
async function handleRegenerate(generation: CardGeneration) {
  if (!generation.text) return errorResponse("Your first version is still being written.", 409);
  if (generation.regenCount >= MAX_REGENERATIONS) {
    return errorResponse(
      `You've used all ${MAX_REGENERATIONS} rewrites. Edit the words yourself, then create your card.`,
      409,
    );
  }

  const db = createAdminClient();
  const claimed = generation.regenCount + 1;
  const { data: claim, error: claimError } = await db
    .from("generations")
    .update({ regen_count: claimed })
    .eq("id", generation.id)
    .eq("regen_count", generation.regenCount)
    .eq("locked", false)
    .select("id");
  if (claimError) throw new Error(`Claiming rewrite failed: ${claimError.message}`);
  if (claim.length === 0) {
    return errorResponse("Another rewrite is already in progress. Wait a moment and refresh.", 409);
  }

  let text: CardText;
  try {
    text = await writeCardText(generation, [generation.text]);
  } catch (err) {
    // Give the rewrite back: the buyer shouldn't lose one to an error.
    await db
      .from("generations")
      .update({ regen_count: generation.regenCount })
      .eq("id", generation.id)
      .eq("regen_count", claimed);
    throw err;
  }

  const { error } = await db
    .from("generations")
    .update({ output_text: JSON.stringify(text) })
    .eq("id", generation.id);
  if (error) throw new Error(`Saving rewrite failed: ${error.message}`);
  return reply({ ...generation, regenCount: claimed }, text);
}

/** Renders the final PNG + PDF from the (possibly edited) words and locks the card. */
async function handleFinalize(generation: CardGeneration, text: CardText) {
  const design = await getCardDesign(generation.designSlug, { includeInactive: true });
  if (!design) throw new Error(`Design ${generation.designSlug} missing or inactive`);

  const png = await renderCardPng(design, text, generation.input.senderName);
  const pdf = await cardPdfFromPng(png, `Christmas card for ${generation.input.recipientName}`);

  const db = createAdminClient();
  const base = `cards/${generation.id}`;
  for (const [path, body, type] of [
    [`${base}/card.png`, png, "image/png"],
    [`${base}/card.pdf`, pdf, "application/pdf"],
  ] as const) {
    const { error } = await db.storage
      .from("generated")
      .upload(path, body, { contentType: type, upsert: true });
    if (error) throw new Error(`Uploading ${path} failed: ${error.message}`);
  }

  const { data: locked, error } = await db
    .from("generations")
    .update({
      output_text: JSON.stringify(text),
      png_path: `${base}/card.png`,
      pdf_path: `${base}/card.pdf`,
      locked: true,
    })
    .eq("id", generation.id)
    .eq("locked", false)
    .select("id");
  if (error) throw new Error(`Locking card failed: ${error.message}`);
  if (locked.length === 0)
    return errorResponse("This card is already finished. Download it below.", 409);

  return reply(generation, text, { locked: true });
}

export async function POST(request: Request) {
  const parsed = generateCardRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const message =
      parsed.error.issues.some((i) => i.path[0] === "text") && issue
        ? `Check your wording: ${issue.message}.`
        : "That request didn't make sense. Refresh the page and try again.";
    return errorResponse(message, 400);
  }
  const body = parsed.data;

  try {
    const generation = await getCardGeneration(body.generationId);
    if (!generation) return errorResponse("We couldn't find that card.", 404);
    if (generation.order?.status === "refunded") {
      return errorResponse("This order was refunded, so the card is no longer available.", 403);
    }
    if (generation.order?.status !== "paid") {
      return errorResponse(
        "Your payment is still being confirmed. This page will update in a few seconds.",
        409,
      );
    }
    if (generation.locked) {
      return errorResponse("This card is finished. Download it below.", 409);
    }

    switch (body.action) {
      case "generate":
        return await handleGenerate(generation);
      case "regenerate":
        return await handleRegenerate(generation);
      case "finalize":
        return await handleFinalize(generation, body.text);
    }
  } catch (err) {
    if (err instanceof AiRefusalError) {
      console.warn("[generate/card] refused", body.generationId, err.message);
      return errorResponse(
        "We couldn't write a message from those details. Try a rewrite, or contact us and we'll sort it out.",
        422,
      );
    }
    if (err instanceof AiOutputError || err instanceof Anthropic.APIError) {
      console.error("[generate/card] AI failed", body.generationId, err);
      return errorResponse(
        "Our writer is busy right now. Wait a few seconds and try again; you won't lose a rewrite.",
        503,
      );
    }
    console.error("[generate/card] failed", body.generationId, err);
    return errorResponse("Something went wrong on our side. Try again in a minute.", 500);
  }
}
