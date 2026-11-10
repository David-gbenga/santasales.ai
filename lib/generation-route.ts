import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { AiOutputError, AiRefusalError } from "@/lib/ai/claude";
import {
  claimFreeReroll,
  claimRewrite,
  lockGeneration,
  releaseFreeReroll,
  releaseRewrite,
  rewritesLeft,
  saveDraft,
  saveFirstDraft,
  type Generation,
} from "@/lib/generations";
import { FREE_PREVIEW_REROLLS, MAX_REGENERATIONS } from "@/lib/pricing";

type Action<Text> =
  | { action: "generate"; generationId: string }
  | { action: "regenerate"; generationId: string }
  | { action: "finalize"; generationId: string; text: Text };

type GenerationRouteConfig<Input, Text, G extends Generation<Input, Text>, Req extends Action<Text>> = {
  /** Used in log lines, e.g. "card". */
  label: string;
  /** What the buyer calls it, e.g. "card" or "song". */
  noun: string;
  /** The finishing button's wording, e.g. "create your card". */
  finishPhrase: string;
  requestSchema: z.ZodType<Req>;
  load: (id: string) => Promise<G | null>;
  /** Calls Claude. `previous` holds the current draft on a rewrite. */
  write: (generation: G, previous: Text[]) => Promise<Text>;
  /** Renders and uploads the final files; returns their storage paths. Gets the full request. */
  render: (generation: G, text: Text, request: Extract<Req, { action: "finalize" }>) => Promise<{ pdf: string; png?: string }>;
};

/** Paid: `rewritesLeft` counts paid rewrites. Unpaid preview: `freeRerollsLeft` counts the free re-roll. */
type Reply<Text> = { text: Text; rewritesLeft: number; freeRerollsLeft: number; locked: boolean; paid: boolean };

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST handler shared by /api/generate/card and /api/generate/lyrics.
 *
 * Before payment (free preview, decision 2026-11-10): the first draft and
 * one free re-roll. After payment: CLAUDE.md's rules (order paid,
 * regen_count < 3, not locked) for rewrites, editing and finishing.
 */
export function createGenerationRoute<Input, Text, G extends Generation<Input, Text>, Req extends Action<Text>>(
  config: GenerationRouteConfig<Input, Text, G, Req>,
) {
  const { noun, label } = config;
  const isPaid = (g: G) => g.order?.status === "paid";

  function reply(generation: G, text: Text, overrides: Partial<Reply<Text>> = {}) {
    const body: Reply<Text> = {
      text,
      rewritesLeft: rewritesLeft(generation.regenCount),
      freeRerollsLeft: Math.max(0, FREE_PREVIEW_REROLLS - generation.freeRerolls),
      locked: generation.locked,
      paid: isPaid(generation),
      ...overrides,
    };
    return NextResponse.json(body);
  }

  /** First draft (also the free preview). Idempotent: a refresh returns the stored draft for free. */
  async function handleGenerate(generation: G) {
    if (generation.text) return reply(generation, generation.text);
    const text = await config.write(generation, []);
    if (!(await saveFirstDraft(generation.id, text))) {
      // Another request saved a draft first; return that one so the buyer sees one version.
      const latest = await config.load(generation.id);
      if (latest?.text) return reply(latest, latest.text);
    }
    return reply(generation, text);
  }

  /** The one free re-roll before paying, claimed atomically and given back on failure. */
  async function handleFreeReroll(generation: G) {
    if (!generation.text) return errorResponse("Your preview is still being written.", 409);
    if (generation.freeRerolls >= FREE_PREVIEW_REROLLS || !(await claimFreeReroll(generation.id))) {
      return errorResponse(
        `You've used your free re-roll. Pay to unlock ${MAX_REGENERATIONS} more rewrites and editing.`,
        402,
      );
    }
    let text: Text;
    try {
      text = await config.write(generation, [generation.text]);
    } catch (err) {
      await releaseFreeReroll(generation.id);
      throw err;
    }
    await saveDraft(generation.id, text);
    return reply({ ...generation, freeRerolls: generation.freeRerolls + 1 }, text);
  }

  /** Paid rewrite. The slot is claimed atomically before calling Claude, so retries can't exceed the limit. */
  async function handleRegenerate(generation: G) {
    if (!generation.text) return errorResponse("Your first version is still being written.", 409);
    if (generation.regenCount >= MAX_REGENERATIONS) {
      return errorResponse(
        `You've used all ${MAX_REGENERATIONS} rewrites. Edit the words yourself, then ${config.finishPhrase}.`,
        409,
      );
    }
    if (!(await claimRewrite(generation.id, generation.regenCount))) {
      return errorResponse("Another rewrite is already in progress. Wait a moment and refresh.", 409);
    }
    const claimed = generation.regenCount + 1;

    let text: Text;
    try {
      text = await config.write(generation, [generation.text]);
    } catch (err) {
      await releaseRewrite(generation.id, claimed); // the buyer shouldn't lose a rewrite to an error
      throw err;
    }
    await saveDraft(generation.id, text);
    return reply({ ...generation, regenCount: claimed }, text);
  }

  /** Renders the final files from the (possibly edited) words and locks the generation. */
  async function handleFinalize(generation: G, text: Text, request: Extract<Req, { action: "finalize" }>) {
    const paths = await config.render(generation, text, request);
    if (!(await lockGeneration(generation.id, text, paths))) {
      return errorResponse(`This ${noun} is already finished. Download it below.`, 409);
    }
    return reply(generation, text, { locked: true });
  }

  return async function POST(request: Request) {
    const parsed = config.requestSchema.safeParse(await request.json().catch(() => null));
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
      const generation = await config.load(body.generationId);
      if (!generation) return errorResponse(`We couldn't find that ${noun}.`, 404);
      if (generation.order?.status === "refunded") {
        return errorResponse(`This order was refunded, so the ${noun} is no longer available.`, 403);
      }
      if (generation.locked) return errorResponse(`This ${noun} is finished. Download it below.`, 409);

      if (!isPaid(generation)) {
        // Free preview: first draft and one re-roll only.
        if (body.action === "generate") return await handleGenerate(generation);
        if (body.action === "regenerate") return await handleFreeReroll(generation);
        return errorResponse(`Pay to unlock editing and downloads for your ${noun}.`, 402);
      }

      switch (body.action) {
        case "generate":
          return await handleGenerate(generation);
        case "regenerate":
          return await handleRegenerate(generation);
        case "finalize":
          return await handleFinalize(generation, body.text as Text, body as Extract<Req, { action: "finalize" }>);
      }
    } catch (err) {
      if (err instanceof AiRefusalError) {
        console.warn(`[generate/${label}] refused`, body.generationId, err.message);
        return errorResponse(
          `We couldn't write your ${noun} from those details. Try a rewrite, or contact us and we'll sort it out.`,
          422,
        );
      }
      if (err instanceof AiOutputError || err instanceof Anthropic.APIError) {
        console.error(`[generate/${label}] AI failed`, body.generationId, err);
        return errorResponse(
          "Our writer is busy right now. Wait a few seconds and try again; you won't lose a rewrite.",
          503,
        );
      }
      console.error(`[generate/${label}] failed`, body.generationId, err);
      return errorResponse("Something went wrong on our side. Try again in a minute.", 500);
    }
  };
}
