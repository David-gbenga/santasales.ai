import "server-only";
import { cardLayoutSchema, type CardLayout } from "@/lib/card-designs";
import { OCCASION_KEYS, type Occasion } from "@/lib/occasions";
import { createAdminClient } from "@/lib/supabase/admin";

/** Admin reads: everything, including hidden rows, always fresh (service role). */

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  pricePence: number;
  filePath: string;
  previewImage: string | null;
  active: boolean;
  orderCount: number;
};

export type AdminGalleryItem = {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  isAffiliate: boolean;
  sort: number;
  active: boolean;
};

export type AdminDesign = {
  id: string;
  slug: string;
  name: string;
  backgroundPath: string;
  layout: CardLayout | null;
  occasions: Occasion[];
  sort: number;
  active: boolean;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_pence: number;
  file_path: string;
  preview_image: string | null;
  active: boolean;
  orders?: { count: number }[];
};

const toProduct = (r: ProductRow): AdminProduct => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  description: r.description,
  pricePence: r.price_pence,
  filePath: r.file_path,
  previewImage: r.preview_image,
  active: r.active,
  orderCount: r.orders?.[0]?.count ?? 0,
});

const PRODUCT_COLUMNS =
  "id, slug, name, description, price_pence, file_path, preview_image, active, orders(count)";

export async function listProducts(): Promise<AdminProduct[]> {
  const { data, error } = await createAdminClient()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("active", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<ProductRow[]>();
  if (error) throw new Error(`Listing products failed: ${error.message}`);
  return data.map(toProduct);
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  const { data, error } = await createAdminClient()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .maybeSingle<ProductRow>();
  if (error) throw new Error(`Reading product failed: ${error.message}`);
  return data ? toProduct(data) : null;
}

type GalleryRow = {
  id: string;
  title: string;
  image_url: string;
  target_url: string;
  is_affiliate: boolean;
  sort: number;
  active: boolean;
};

const toGallery = (r: GalleryRow): AdminGalleryItem => ({
  id: r.id,
  title: r.title,
  imageUrl: r.image_url,
  targetUrl: r.target_url,
  isAffiliate: r.is_affiliate,
  sort: r.sort,
  active: r.active,
});

const GALLERY_COLUMNS = "id, title, image_url, target_url, is_affiliate, sort, active";

export async function listGalleryItems(): Promise<AdminGalleryItem[]> {
  const { data, error } = await createAdminClient()
    .from("gallery_items")
    .select(GALLERY_COLUMNS)
    .order("active", { ascending: false })
    .order("sort", { ascending: true })
    .returns<GalleryRow[]>();
  if (error) throw new Error(`Listing gallery failed: ${error.message}`);
  return data.map(toGallery);
}

export async function getGalleryItem(id: string): Promise<AdminGalleryItem | null> {
  const { data, error } = await createAdminClient()
    .from("gallery_items")
    .select(GALLERY_COLUMNS)
    .eq("id", id)
    .maybeSingle<GalleryRow>();
  if (error) throw new Error(`Reading gallery item failed: ${error.message}`);
  return data ? toGallery(data) : null;
}

type DesignRow = {
  id: string;
  slug: string;
  name: string;
  background_path: string;
  layout: unknown;
  occasions: string[] | null;
  sort: number;
  active: boolean;
};

const toDesign = (r: DesignRow): AdminDesign => {
  const layout = cardLayoutSchema.safeParse(r.layout);
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    backgroundPath: r.background_path,
    layout: layout.success ? layout.data : null,
    occasions: (r.occasions ?? []).filter((o): o is Occasion =>
      (OCCASION_KEYS as readonly string[]).includes(o),
    ),
    sort: r.sort,
    active: r.active,
  };
};

const DESIGN_COLUMNS = "id, slug, name, background_path, layout, occasions, sort, active";

export async function listDesigns(): Promise<AdminDesign[]> {
  const { data, error } = await createAdminClient()
    .from("card_designs")
    .select(DESIGN_COLUMNS)
    .order("active", { ascending: false })
    .order("sort", { ascending: true })
    .returns<DesignRow[]>();
  if (error) throw new Error(`Listing designs failed: ${error.message}`);
  return data.map(toDesign);
}

export async function getDesign(id: string): Promise<AdminDesign | null> {
  const { data, error } = await createAdminClient()
    .from("card_designs")
    .select(DESIGN_COLUMNS)
    .eq("id", id)
    .maybeSingle<DesignRow>();
  if (error) throw new Error(`Reading design failed: ${error.message}`);
  return data ? toDesign(data) : null;
}
