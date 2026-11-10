import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";

export type GalleryItem = {
  id: string;
  title: string;
  image_url: string;
  target_url: string;
  is_affiliate: boolean;
};

export async function getActiveGalleryItems(): Promise<GalleryItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("gallery");

  const { data, error } = await createPublicClient()
    .from("gallery_items")
    .select("id, title, image_url, target_url, is_affiliate")
    .eq("active", true)
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Loading gallery failed: ${error.message}`);
  return data;
}

/** "www.amazon.co.uk" → "amazon.co.uk", for "Opens on …" labels. */
export function storeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "the store";
  }
}
