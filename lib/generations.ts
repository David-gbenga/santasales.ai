import "server-only";
import type { z } from "zod";
import { MAX_REGENERATIONS } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  cardInputSchema,
  cardTextSchema,
  lyricsInputSchema,
  lyricsTextSchema,
  type CardInput,
  type CardText,
  type LyricsInput,
  type LyricsText,
} from "@/lib/validation";

type OrderInfo = { id: string; status: "pending" | "paid" | "refunded"; paidAt: string | null };

/** A paid-first AI generation (card or lyrics) with its order. */
export type Generation<Input, Text> = {
  id: string;
  designSlug: string | null;
  input: Input;
  text: Text | null;
  regenCount: number;
  /** Free re-rolls used before paying (max FREE_PREVIEW_REROLLS). */
  freeRerolls: number;
  locked: boolean;
  pngPath: string | null;
  pdfPath: string | null;
  /** Short sung preview clip (songs only). */
  previewAudioPath: string | null;
  order: OrderInfo | null;
};
export type CardGeneration = Generation<CardInput, CardText> & { designSlug: string };
export type LyricsGeneration = Generation<LyricsInput, LyricsText>;

type Row = {
  id: string;
  kind: string;
  design_id: string | null;
  input: unknown;
  output_text: string | null;
  regen_count: number;
  free_rerolls: number;
  locked: boolean;
  png_path: string | null;
  pdf_path: string | null;
  preview_audio_path: string | null;
  orders: { id: string; status: OrderInfo["status"]; paid_at: string | null }[];
};

/** Generated text is stored as JSON in output_text. */
function parseStored<T>(outputText: string | null, schema: z.ZodType<T>): T | null {
  if (!outputText) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(outputText));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function loadGeneration<Input, Text>(
  id: string,
  kind: "card" | "lyrics",
  inputSchema: z.ZodType<Input>,
  textSchema: z.ZodType<Text>,
): Promise<Generation<Input, Text> | null> {
  const { data, error } = await createAdminClient()
    .from("generations")
    .select(
      "id, kind, design_id, input, output_text, regen_count, free_rerolls, locked, png_path, pdf_path, preview_audio_path, orders(id, status, paid_at)",
    )
    .eq("id", id)
    .maybeSingle<Row>();
  if (error) throw new Error(`Reading generation failed: ${error.message}`);
  if (!data || data.kind !== kind) return null;

  const input = inputSchema.safeParse(data.input);
  if (!input.success) throw new Error(`Generation ${id} has invalid input`);
  const order = data.orders.find((o) => o.status === "paid") ?? data.orders[0];

  return {
    id: data.id,
    designSlug: data.design_id,
    input: input.data,
    text: parseStored(data.output_text, textSchema),
    regenCount: data.regen_count,
    freeRerolls: data.free_rerolls,
    locked: data.locked,
    pngPath: data.png_path,
    pdfPath: data.pdf_path,
    previewAudioPath: data.preview_audio_path,
    order: order ? { id: order.id, status: order.status, paidAt: order.paid_at } : null,
  };
}

/** Loads a card generation. The id is unguessable and acts as the buyer's link. */
export async function getCardGeneration(id: string): Promise<CardGeneration | null> {
  const g = await loadGeneration(id, "card", cardInputSchema, cardTextSchema);
  return g && g.designSlug ? { ...g, designSlug: g.designSlug } : null;
}

export function getLyricsGeneration(id: string): Promise<LyricsGeneration | null> {
  return loadGeneration(id, "lyrics", lyricsInputSchema, lyricsTextSchema);
}

export function rewritesLeft(regenCount: number): number {
  return Math.max(0, MAX_REGENERATIONS - regenCount);
}

// ---------------------------------------------------------------------------
// Steps shared by the card and lyrics routes. Each one is a single
// conditional UPDATE so concurrent requests can't double-spend.

/** Saves the first draft only if none exists. Returns false if another request won. */
export async function saveFirstDraft(id: string, text: unknown): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("generations")
    .update({ output_text: JSON.stringify(text) })
    .eq("id", id)
    .is("output_text", null)
    .select("id");
  if (error) throw new Error(`Saving draft failed: ${error.message}`);
  return data.length > 0;
}

/** Claims one rewrite by bumping regen_count from its current value. False if someone else did. */
export async function claimRewrite(id: string, currentCount: number): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("generations")
    .update({ regen_count: currentCount + 1 })
    .eq("id", id)
    .eq("regen_count", currentCount)
    .eq("locked", false)
    .select("id");
  if (error) throw new Error(`Claiming rewrite failed: ${error.message}`);
  return data.length > 0;
}

/** Gives a claimed rewrite back after a failure, so the buyer doesn't lose it. */
export async function releaseRewrite(id: string, claimedCount: number): Promise<void> {
  await createAdminClient()
    .from("generations")
    .update({ regen_count: claimedCount - 1 })
    .eq("id", id)
    .eq("regen_count", claimedCount);
}

export async function saveDraft(id: string, text: unknown): Promise<void> {
  const { error } = await createAdminClient()
    .from("generations")
    .update({ output_text: JSON.stringify(text) })
    .eq("id", id);
  if (error) throw new Error(`Saving draft failed: ${error.message}`);
}

/** Uploads finished files to the private "generated" bucket. */
export async function uploadGenerated(
  files: { path: string; body: Buffer; contentType: string }[],
) {
  const db = createAdminClient();
  for (const file of files) {
    const { error } = await db.storage
      .from("generated")
      .upload(file.path, file.body, { contentType: file.contentType, upsert: true });
    if (error) throw new Error(`Uploading ${file.path} failed: ${error.message}`);
  }
}

/** Stores the final text and file paths and locks the generation. False if already locked. */
export async function lockGeneration(
  id: string,
  text: unknown,
  paths: { png?: string; pdf: string },
): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("generations")
    .update({
      output_text: JSON.stringify(text),
      png_path: paths.png ?? null,
      pdf_path: paths.pdf,
      locked: true,
    })
    .eq("id", id)
    .eq("locked", false)
    .select("id");
  if (error) throw new Error(`Locking generation failed: ${error.message}`);
  return data.length > 0;
}

/** Claims the free pre-payment re-roll. False if it was already used. */
export async function claimFreeReroll(id: string): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("generations")
    .update({ free_rerolls: 1 })
    .eq("id", id)
    .eq("free_rerolls", 0)
    .eq("locked", false)
    .select("id");
  if (error) throw new Error(`Claiming free re-roll failed: ${error.message}`);
  return data.length > 0;
}

export async function releaseFreeReroll(id: string): Promise<void> {
  await createAdminClient().from("generations").update({ free_rerolls: 0 }).eq("id", id).eq("free_rerolls", 1);
}

export async function savePreviewAudio(id: string, path: string): Promise<void> {
  const { error } = await createAdminClient()
    .from("generations")
    .update({ preview_audio_path: path })
    .eq("id", id);
  if (error) throw new Error(`Saving preview clip failed: ${error.message}`);
}
