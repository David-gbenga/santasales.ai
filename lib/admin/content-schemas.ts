import { z } from "zod";
import { OCCASION_KEYS } from "@/lib/occasions";

/**
 * Rules for admin uploads and content forms (PRD F6 content management).
 * Shared by the server actions and, for limits and accepted types, the forms.
 */

export const IMAGE_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // media bucket limit

/** What a sellable product file may be. The products bucket itself accepts any type. */
export const PRODUCT_FILE_TYPES = {
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "audio/mpeg": "mp3",
  "application/epub+zip": "epub",
} as const;
export const PRODUCT_FILE_MAX_BYTES = 100 * 1024 * 1024; // products bucket limit

export const UPLOAD_PURPOSES = ["product-file", "product-image", "gallery-image", "design-image"] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

export const uploadRequestSchema = z.object({
  purpose: z.enum(UPLOAD_PURPOSES),
  filename: z.string().min(1).max(200),
  contentType: z.string().max(100),
  size: z.number().int().positive(),
});
export type UploadRequest = z.infer<typeof uploadRequestSchema>;

/** Where each kind of upload lives. Paths are generated server-side, never taken from the form. */
export const UPLOAD_TARGETS: Record<UploadPurpose, { bucket: "media" | "products"; folder: string }> = {
  "product-file": { bucket: "products", folder: "files" },
  "product-image": { bucket: "media", folder: "products" },
  "gallery-image": { bucket: "media", folder: "gallery" },
  "design-image": { bucket: "media", folder: "card-designs" },
};

/** Paths the upload action can produce, e.g. "gallery/2f1c….webp" or "files/2f1c…/guide.pdf". */
export const uploadedPathPattern: Record<UploadPurpose, RegExp> = {
  "product-file": /^files\/[0-9a-f-]{36}\/[a-z0-9][a-z0-9._-]{0,99}$/,
  "product-image": /^products\/[0-9a-f-]{36}\.(png|jpg|webp)$/,
  "gallery-image": /^gallery\/[0-9a-f-]{36}\.(png|jpg|webp)$/,
  "design-image": /^card-designs\/[0-9a-f-]{36}\.(png|jpg|webp)$/,
};

/** "Snowfall wallpapers!" → "snowfall-wallpapers". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
}

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "use lowercase letters, numbers and single hyphens")
  .max(64);

const checkbox = z.preprocess((v) => v === "on" || v === "true", z.boolean());
const text = (max: number) => z.string().trim().max(max, `keep it to ${max} characters or fewer`);

/** "£2.99", "2.5", "3" → pence. Stripe's minimum GBP charge is 30p. */
const pricePence = z
  .string()
  .trim()
  .transform((v) => v.replace(/^£/, ""))
  .refine((v) => /^\d{1,4}(\.\d{1,2})?$/.test(v), "enter a price like 2.99")
  .transform((v) => Math.round(Number(v) * 100))
  .refine((p) => p >= 30, "the minimum price is £0.30");

const sortOrder = z.coerce.number().int().min(-10000).max(10000);

export const productFormSchema = z.object({
  id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  name: text(120).min(1, "name is required"),
  slug,
  description: text(4000),
  price: pricePence,
  filePath: z.string().max(300),
  previewPath: z.string().max(2048),
  active: checkbox,
});

export const galleryFormSchema = z.object({
  id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  title: text(160).min(1, "title is required"),
  targetUrl: z
    .url({ protocol: /^https$/, message: "use a full https:// link" })
    .max(2048),
  imageUrl: z.string().trim().max(2048),
  isAffiliate: checkbox,
  sort: sortOrder,
  active: checkbox,
});

const coord = (max: number) => z.coerce.number().int().min(0).max(max);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "use a colour like #13233f");

export const designFormSchema = z.object({
  id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  name: text(80).min(1, "name is required"),
  slug,
  backgroundPath: z.string().max(512),
  occasions: z.array(z.enum(OCCASION_KEYS)).max(20),
  x: coord(1500),
  y: coord(2100),
  width: coord(1500).pipe(z.number().min(200, "make the text box at least 200 wide")),
  height: coord(2100).pipe(z.number().min(200, "make the text box at least 200 tall")),
  align: z.enum(["left", "center", "right"]),
  font: z.enum(["serif", "sans"]),
  color: hex,
  accentColor: hex,
  sort: sortOrder,
  active: checkbox,
});

/** Result of a content form submission. */
export type FormState = {
  status: "idle" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};
