import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";

/** Public product fields. file_path is deliberately absent: anon can't read it. */
export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_pence: number;
  currency: string;
  preview_image: string | null;
};

const PRODUCT_COLUMNS = "id, slug, name, description, price_pence, currency, preview_image";

export async function getActiveProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Loading products failed: ${error.message}`);
  return data;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw new Error(`Loading product ${slug} failed: ${error.message}`);
  return data;
}
