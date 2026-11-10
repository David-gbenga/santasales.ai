import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { OCCASION_KEYS, type Occasion } from "@/lib/occasions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/server";

/** Card canvas size: 5×7 in at 300 dpi. Layout coordinates use this space. */
export const CARD_SIZE = { width: 1500, height: 2100 } as const;

const hexColour = z.string().regex(/^#[0-9a-fA-F]{6}$/);

/** Shape of card_designs.layout. Validated on read so a bad row can't break rendering. */
export const cardLayoutSchema = z.object({
  text: z.object({
    x: z.number().min(0).max(CARD_SIZE.width),
    y: z.number().min(0).max(CARD_SIZE.height),
    width: z.number().min(200).max(CARD_SIZE.width),
    height: z.number().min(200).max(CARD_SIZE.height),
  }),
  align: z.enum(["left", "center", "right"]).default("center"),
  font: z.enum(["serif", "sans"]).default("serif"),
  color: hexColour,
  accentColor: hexColour.optional(),
});
export type CardLayout = z.infer<typeof cardLayoutSchema>;

export type CardDesign = {
  slug: string;
  name: string;
  backgroundPath: string;
  layout: CardLayout;
  /** Occasions this design suits; empty means every occasion. */
  occasions: Occasion[];
};

type CardDesignRow = {
  slug: string;
  name: string;
  background_path: string;
  layout: unknown;
  occasions: string[] | null;
};

const isOccasion = (o: string): o is Occasion => (OCCASION_KEYS as readonly string[]).includes(o);

/** Whether a design can be used for an occasion. */
export function designSuits(design: { occasions: Occasion[] }, occasion: Occasion): boolean {
  return design.occasions.length === 0 || design.occasions.includes(occasion);
}

function toDesign(row: CardDesignRow): CardDesign | null {
  const layout = cardLayoutSchema.safeParse(row.layout);
  if (!layout.success) {
    console.error(`[card-designs] ${row.slug} has an invalid layout`, layout.error.message);
    return null;
  }
  return {
    slug: row.slug,
    name: row.name,
    backgroundPath: row.background_path,
    layout: layout.data,
    occasions: (row.occasions ?? []).filter(isOccasion),
  };
}

/** Active designs in display order. Cached for about a minute. */
export async function getActiveCardDesigns(): Promise<CardDesign[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("card-designs");

  const { data, error } = await createPublicClient()
    .from("card_designs")
    .select("slug, name, background_path, layout, occasions")
    .eq("active", true)
    .order("sort", { ascending: true });
  if (error) throw new Error(`Loading card designs failed: ${error.message}`);
  return data.map(toDesign).filter((d): d is CardDesign => d !== null);
}

/**
 * One design by slug, read fresh. New purchases need an active design;
 * an existing order keeps working even if its design is later hidden
 * (`includeInactive`, read with the service role).
 */
export async function getCardDesign(
  slug: string,
  { includeInactive = false } = {},
): Promise<CardDesign | null> {
  let query = (includeInactive ? createAdminClient() : createPublicClient())
    .from("card_designs")
    .select("slug, name, background_path, layout, occasions")
    .eq("slug", slug);
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query.maybeSingle<CardDesignRow>();
  if (error) throw new Error(`Loading card design ${slug} failed: ${error.message}`);
  return data ? toDesign(data) : null;
}
