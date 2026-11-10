import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_REGENERATIONS } from "@/lib/pricing";
import { cardInputSchema, cardTextSchema, type CardInput, type CardText } from "@/lib/validation";

export type CardGeneration = {
  id: string;
  designSlug: string;
  input: CardInput;
  text: CardText | null;
  regenCount: number;
  locked: boolean;
  pngPath: string | null;
  pdfPath: string | null;
  order: { id: string; status: "pending" | "paid" | "refunded"; paidAt: string | null } | null;
};

type Row = {
  id: string;
  kind: string;
  design_id: string | null;
  input: unknown;
  output_text: string | null;
  regen_count: number;
  locked: boolean;
  png_path: string | null;
  pdf_path: string | null;
  orders: { id: string; status: "pending" | "paid" | "refunded"; paid_at: string | null }[];
};

/** Card text is stored as JSON in output_text. */
export function parseStoredText(outputText: string | null): CardText | null {
  if (!outputText) return null;
  try {
    const parsed = cardTextSchema.safeParse(JSON.parse(outputText));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Loads a card generation with its order. The id is unguessable and acts as the buyer's link. */
export async function getCardGeneration(id: string): Promise<CardGeneration | null> {
  const { data, error } = await createAdminClient()
    .from("generations")
    .select(
      "id, kind, design_id, input, output_text, regen_count, locked, png_path, pdf_path, orders(id, status, paid_at)",
    )
    .eq("id", id)
    .maybeSingle<Row>();
  if (error) throw new Error(`Reading generation failed: ${error.message}`);
  if (!data || data.kind !== "card" || !data.design_id) return null;

  const input = cardInputSchema.safeParse(data.input);
  if (!input.success) throw new Error(`Generation ${id} has invalid input`);
  const order = data.orders[0];

  return {
    id: data.id,
    designSlug: data.design_id,
    input: input.data,
    text: parseStoredText(data.output_text),
    regenCount: data.regen_count,
    locked: data.locked,
    pngPath: data.png_path,
    pdfPath: data.pdf_path,
    order: order ? { id: order.id, status: order.status, paidAt: order.paid_at } : null,
  };
}

export function rewritesLeft(regenCount: number): number {
  return Math.max(0, MAX_REGENERATIONS - regenCount);
}
