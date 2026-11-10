"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { currentAdmin } from "@/lib/admin-auth";
import {
  IMAGE_MAX_BYTES,
  IMAGE_TYPES,
  PRODUCT_FILE_MAX_BYTES,
  PRODUCT_FILE_TYPES,
  UPLOAD_TARGETS,
  designFormSchema,
  galleryFormSchema,
  productFormSchema,
  uploadRequestSchema,
  uploadedPathPattern,
  type FormState,
  type UploadRequest,
} from "@/lib/admin/content-schemas";
import { getDesign, getGalleryItem, getProduct } from "@/lib/admin/content";
import { mediaUrl } from "@/lib/media";
import { createAdminClient } from "@/lib/supabase/admin";

/*
 * Content management for /admin (PRD F6). Every action re-checks the admin:
 * server actions are public endpoints, whatever page renders them.
 */

export type UploadTicket =
  | { ok: true; signedUrl: string; path: string; publicUrl: string | null }
  | { ok: false; error: string };

const NOT_ADMIN = "Your admin session has ended. Sign in again.";

/** "My Guide (final).PDF" → "my-guide-final.pdf" */
function safeFilename(name: string, extension: string): string {
  const base = name
    .replace(/\.[^.]*$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "file"}.${extension}`;
}

/**
 * Step 1 of an upload: checks type and size, picks the storage path and
 * returns a short-lived signed upload URL. The browser then PUTs the file
 * straight to Supabase Storage, so big product files never pass through a
 * Vercel function (4.5 MB body limit).
 */
export async function requestUpload(raw: UploadRequest): Promise<UploadTicket> {
  if (!(await currentAdmin())) return { ok: false, error: NOT_ADMIN };
  const parsed = uploadRequestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "That file couldn't be checked. Try again." };
  const { purpose, filename, contentType, size } = parsed.data;

  const isProductFile = purpose === "product-file";
  const types: Record<string, string> = isProductFile ? PRODUCT_FILE_TYPES : IMAGE_TYPES;
  const extension = types[contentType];
  if (!extension) {
    return {
      ok: false,
      error: isProductFile
        ? "Use a PDF, ZIP, PNG, JPEG, WebP, MP3 or EPUB file."
        : "Use a PNG, JPEG or WebP image (SVG isn't allowed in the public bucket).",
    };
  }
  const max = isProductFile ? PRODUCT_FILE_MAX_BYTES : IMAGE_MAX_BYTES;
  if (size > max) {
    return { ok: false, error: `That file is too big. The limit is ${Math.round(max / 1024 / 1024)} MB.` };
  }

  const { bucket, folder } = UPLOAD_TARGETS[purpose];
  const id = randomUUID();
  const path = isProductFile
    ? `${folder}/${id}/${safeFilename(filename, extension)}`
    : `${folder}/${id}.${extension}`;

  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[admin upload] signing failed", error);
    return { ok: false, error: "The upload couldn't start. Try again in a minute." };
  }
  return { ok: true, signedUrl: data.signedUrl, path, publicUrl: bucket === "media" ? mediaUrl(path) : null };
}

/** Field errors keyed by form field name, for the form to show next to each input. */
function fieldErrors(error: z.ZodError): FormState {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return { status: "error", message: "Check the highlighted fields.", fieldErrors: errors };
}

function dbError(error: { code?: string; message: string }, what: string): FormState {
  if (error.code === "23505") {
    return {
      status: "error",
      message: "That slug is already used. Pick another.",
      fieldErrors: { slug: "already used" },
    };
  }
  console.error(`[admin] saving ${what} failed`, error);
  return { status: "error", message: `The ${what} couldn't be saved. Try again in a minute.` };
}

/**
 * A stored file reference from the form: unchanged from what's saved, or a
 * path this module's upload action produced. Anything else is refused, so
 * the form can't point a product at an arbitrary file.
 */
function acceptPath(value: string, current: string | null, pattern: RegExp): string | null | false {
  if (!value) return null;
  if (current !== null && value === current) return current;
  return pattern.test(value) ? value : false;
}

// ---------------------------------------------------------------------------
// Products

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await currentAdmin())) return { status: "error", message: NOT_ADMIN };
  const parsed = productFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const form = parsed.data;

  const existing = form.id ? await getProduct(form.id) : null;
  if (form.id && !existing) return { status: "error", message: "That product no longer exists." };

  const filePath = acceptPath(form.filePath, existing?.filePath ?? null, uploadedPathPattern["product-file"]);
  if (!filePath) {
    return { status: "error", message: "Upload the file people buy.", fieldErrors: { filePath: "required" } };
  }
  // Preview images are stored as full public URLs (older rows may hold site-relative ones).
  let previewImage: string | null;
  if (!form.previewPath) previewImage = null;
  else if (form.previewPath === existing?.previewImage) previewImage = existing.previewImage;
  else if (uploadedPathPattern["product-image"].test(form.previewPath)) previewImage = mediaUrl(form.previewPath);
  else return { status: "error", message: "Upload the preview image again.", fieldErrors: { previewPath: "invalid" } };

  const row = {
    slug: form.slug,
    name: form.name,
    description: form.description,
    price_pence: form.price,
    file_path: filePath,
    preview_image: previewImage,
    active: form.active,
  };
  const db = createAdminClient().from("products");
  const { error } = form.id ? await db.update(row).eq("id", form.id) : await db.insert(row);
  if (error) return dbError(error, "product");

  updateTag("products");
  redirect(`/admin/products?saved=${encodeURIComponent(form.name)}`);
}

// ---------------------------------------------------------------------------
// Gallery

export async function saveGalleryItem(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await currentAdmin())) return { status: "error", message: NOT_ADMIN };
  const parsed = galleryFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const form = parsed.data;

  const existing = form.id ? await getGalleryItem(form.id) : null;
  if (form.id && !existing) return { status: "error", message: "That gallery item no longer exists." };

  // An uploaded image (media path), the saved one, or an https image link from an affiliate programme.
  let imageUrl: string;
  if (form.imageUrl && form.imageUrl === existing?.imageUrl) imageUrl = existing.imageUrl;
  else if (uploadedPathPattern["gallery-image"].test(form.imageUrl)) imageUrl = mediaUrl(form.imageUrl);
  else if (/^https:\/\/[^\s]+$/.test(form.imageUrl)) imageUrl = form.imageUrl;
  else {
    return {
      status: "error",
      message: "Upload an image, or paste an https:// image link.",
      fieldErrors: { imageUrl: "required" },
    };
  }

  const row = {
    title: form.title,
    image_url: imageUrl,
    target_url: form.targetUrl,
    is_affiliate: form.isAffiliate,
    sort: form.sort,
    active: form.active,
  };
  const db = createAdminClient().from("gallery_items");
  const { error } = form.id ? await db.update(row).eq("id", form.id) : await db.insert(row);
  if (error) return dbError(error, "gallery item");

  updateTag("gallery");
  redirect(`/admin/gallery?saved=${encodeURIComponent(form.title)}`);
}

// ---------------------------------------------------------------------------
// Card designs

export async function saveDesign(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await currentAdmin())) return { status: "error", message: NOT_ADMIN };
  const parsed = designFormSchema.safeParse({
    ...Object.fromEntries(formData),
    occasions: formData.getAll("occasions"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);
  const form = parsed.data;

  const existing = form.id ? await getDesign(form.id) : null;
  if (form.id && !existing) return { status: "error", message: "That design no longer exists." };

  const backgroundPath = acceptPath(
    form.backgroundPath,
    existing?.backgroundPath ?? null,
    uploadedPathPattern["design-image"],
  );
  if (!backgroundPath) {
    return { status: "error", message: "Upload a background image.", fieldErrors: { backgroundPath: "required" } };
  }
  if (form.x + form.width > 1500 || form.y + form.height > 2100) {
    return {
      status: "error",
      message: "The text box runs off the card. Make it smaller or move it.",
      fieldErrors: { width: "too wide", height: "too tall" },
    };
  }

  const row = {
    slug: form.slug,
    name: form.name,
    background_path: backgroundPath,
    layout: {
      text: { x: form.x, y: form.y, width: form.width, height: form.height },
      align: form.align,
      font: form.font,
      color: form.color,
      accentColor: form.accentColor,
    },
    occasions: form.occasions,
    sort: form.sort,
    active: form.active,
  };
  const db = createAdminClient().from("card_designs");
  const { error } = form.id ? await db.update(row).eq("id", form.id) : await db.insert(row);
  if (error) return dbError(error, "card design");

  updateTag("card-designs");
  redirect(`/admin/designs?saved=${encodeURIComponent(form.name)}`);
}
