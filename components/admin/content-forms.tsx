"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { saveDesign, saveGalleryItem, saveProduct } from "@/app/admin/content-actions";
import { Checkbox, Field, SaveBar, UploadField, inputClass } from "@/components/admin/form-parts";
import { CardPreview } from "@/components/ui/card-preview";
import {
  IMAGE_TYPES,
  PRODUCT_FILE_TYPES,
  slugify,
  type FormState,
} from "@/lib/admin/content-schemas";
import { OCCASIONS, OCCASION_KEYS, type Occasion } from "@/lib/occasions";

const initial: FormState = { status: "idle", message: "" };

/**
 * Submits through the action without React’s automatic form reset, so a
 * validation error doesn’t wipe what the admin typed.
 */
function submitWith(action: (data: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  };
}
const imageAccept = Object.keys(IMAGE_TYPES).join(",");
const productAccept = Object.keys(PRODUCT_FILE_TYPES).join(",");

/** Name field that fills in the slug until the slug is edited by hand. */
function useSlug(initialSlug: string) {
  const [slug, setSlug] = useState(initialSlug);
  const [touched, setTouched] = useState(Boolean(initialSlug));
  return {
    slug,
    onName: (name: string) => {
      if (!touched) setSlug(slugify(name));
    },
    onSlug: (value: string) => {
      setTouched(true);
      setSlug(value);
    },
  };
}

// ---------------------------------------------------------------------------

export type ProductFormValues = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  filePath: string;
  previewImage: string | null;
  active: boolean;
};

export function ProductForm({ values }: { values: ProductFormValues }) {
  const [state, action, pending] = useActionState(saveProduct, initial);
  const [uploading, setUploading] = useState(0);
  const slug = useSlug(values.slug);
  const e = state.fieldErrors ?? {};
  const busy = (b: boolean) => setUploading((n) => n + (b ? 1 : -1));

  return (
    <form onSubmit={submitWith(action)} className="mt-8 max-w-3xl space-y-6">
      <input type="hidden" name="id" value={values.id} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Name" error={e.name}>
          {(p) => (
            <input {...p} name="name" required maxLength={120} defaultValue={values.name} onChange={(ev) => slug.onName(ev.target.value)} className={inputClass} />
          )}
        </Field>
        <Field label="Price (£)" hint="e.g. 3.50" error={e.price}>
          {(p) => (
            <input {...p} name="price" required inputMode="decimal" defaultValue={values.price} placeholder="2.99" className={inputClass} />
          )}
        </Field>
      </div>
      <Field label="Web address" hint={`giftpost.com/shop/${slug.slug || "…"}`} error={e.slug}>
        {(p) => (
          <input {...p} name="slug" required maxLength={64} value={slug.slug} onChange={(ev) => slug.onSlug(ev.target.value)} spellCheck={false} className={inputClass} />
        )}
      </Field>
      <Field label="Description" error={e.description}>
        {(p) => <textarea {...p} name="description" rows={5} maxLength={4000} defaultValue={values.description} className={inputClass} />}
      </Field>
      <UploadField
        name="filePath"
        purpose="product-file"
        label="File people buy"
        hint="PDF, ZIP, image, MP3 or EPUB, up to 100 MB. Private: buyers get a 24-hour link after paying."
        accept={productAccept}
        initialValue={values.filePath}
        initialPreview={null}
        error={e.filePath}
        onBusyChange={busy}
      />
      <UploadField
        name="previewPath"
        purpose="product-image"
        label="Preview image"
        hint="PNG, JPEG or WebP up to 5 MB, ideally 800×1000. Shown in the shop: don't use the paid file itself."
        accept={imageAccept}
        initialValue={values.previewImage ?? ""}
        initialPreview={values.previewImage}
        error={e.previewPath}
        onBusyChange={busy}
      />
      <Checkbox name="active" label="Show in the shop" defaultChecked={values.active} />
      <SaveBar state={state} label="Save product" uploading={uploading > 0} pending={pending} />
    </form>
  );
}

// ---------------------------------------------------------------------------

export type GalleryFormValues = {
  id: string;
  title: string;
  targetUrl: string;
  imageUrl: string;
  isAffiliate: boolean;
  sort: number;
  active: boolean;
};

export function GalleryForm({ values }: { values: GalleryFormValues }) {
  const [state, action, pending] = useActionState(saveGalleryItem, initial);
  const [uploading, setUploading] = useState(0);
  const e = state.fieldErrors ?? {};

  return (
    <form onSubmit={submitWith(action)} className="mt-8 max-w-3xl space-y-6">
      <input type="hidden" name="id" value={values.id} />
      <Field label="Title" error={e.title}>
        {(p) => <input {...p} name="title" required maxLength={160} defaultValue={values.title} className={inputClass} />}
      </Field>
      <Field label="Link to the shop" hint="The product page on the other shop, starting https://" error={e.targetUrl}>
        {(p) => (
          <input {...p} name="targetUrl" type="url" required maxLength={2048} defaultValue={values.targetUrl} placeholder="https://…" className={inputClass} />
        )}
      </Field>
      <UploadField
        name="imageUrl"
        purpose="gallery-image"
        label="Image"
        hint="Upload a PNG, JPEG or WebP (up to 5 MB) you own or the shop's programme allows."
        accept={imageAccept}
        initialValue={values.imageUrl}
        initialPreview={values.imageUrl || null}
        error={e.imageUrl}
        allowUrl
        onBusyChange={(b) => setUploading((n) => n + (b ? 1 : -1))}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Order" hint="Lower numbers show first" error={e.sort}>
          {(p) => <input {...p} name="sort" type="number" step={1} defaultValue={values.sort} className={inputClass} />}
        </Field>
      </div>
      <Checkbox name="isAffiliate" label="Affiliate link (we may earn a commission)" defaultChecked={values.isAffiliate} />
      <Checkbox name="active" label="Show in the gallery" defaultChecked={values.active} />
      <SaveBar state={state} label="Save gallery item" uploading={uploading > 0} pending={pending} />
    </form>
  );
}

// ---------------------------------------------------------------------------

export type DesignFormValues = {
  id: string;
  name: string;
  slug: string;
  backgroundPath: string;
  backgroundUrl: string | null;
  occasions: Occasion[];
  x: number;
  y: number;
  width: number;
  height: number;
  align: "left" | "center" | "right";
  font: "serif" | "sans";
  color: string;
  accentColor: string;
  sort: number;
  active: boolean;
};

const SAMPLE = {
  greeting: "Dear Sam,",
  message:
    "Wishing you a wonderful day full of the people and things you love most. Here’s to a brilliant year ahead, with plenty of laughs along the way.",
  signOff: "With love,",
};

export function DesignForm({ values }: { values: DesignFormValues }) {
  const [state, action, pending] = useActionState(saveDesign, initial);
  const [uploading, setUploading] = useState(0);
  const [background, setBackground] = useState(values.backgroundUrl);
  const [layout, setLayout] = useState({
    x: values.x,
    y: values.y,
    width: values.width,
    height: values.height,
    align: values.align,
    font: values.font,
    color: values.color,
    accentColor: values.accentColor,
  });
  const slug = useSlug(values.slug);
  const e = state.fieldErrors ?? {};
  const num = (key: "x" | "y" | "width" | "height") => (ev: React.ChangeEvent<HTMLInputElement>) =>
    setLayout((l) => ({ ...l, [key]: Number(ev.target.value) || 0 }));

  return (
    <form onSubmit={submitWith(action)} className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-6">
        <input type="hidden" name="id" value={values.id} />
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Name" error={e.name}>
            {(p) => (
              <input {...p} name="name" required maxLength={80} defaultValue={values.name} onChange={(ev) => slug.onName(ev.target.value)} className={inputClass} />
            )}
          </Field>
          <Field label="Short code" hint="Used in links and orders" error={e.slug}>
            {(p) => (
              <input {...p} name="slug" required maxLength={64} value={slug.slug} onChange={(ev) => slug.onSlug(ev.target.value)} spellCheck={false} className={inputClass} />
            )}
          </Field>
        </div>

        <UploadField
          name="backgroundPath"
          purpose="design-image"
          label="Background image"
          hint="1500×2100 pixels (5×7 in at 300 dpi), PNG, JPEG or WebP up to 5 MB. Leave a calm area for the message."
          accept={imageAccept}
          initialValue={values.backgroundPath}
          initialPreview={values.backgroundUrl}
          error={e.backgroundPath}
          onChange={(_, url) => setBackground(url)}
          onBusyChange={(b) => setUploading((n) => n + (b ? 1 : -1))}
        />

        <fieldset>
          <legend className="font-medium">Occasions</legend>
          <p className="mt-1 text-sm text-ink-muted">Tick none for a design that suits every occasion.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {OCCASION_KEYS.map((key) => (
              <label key={key} className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" name="occasions" value={key} defaultChecked={values.occasions.includes(key)} className="size-5 accent-ink" />
                {OCCASIONS[key].label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-medium">Where the message goes</legend>
          <p className="mt-1 text-sm text-ink-muted">In card pixels: the card is 1500 wide and 2100 tall. The preview updates as you type.</p>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(["x", "y", "width", "height"] as const).map((key) => (
              <Field key={key} label={{ x: "From left", y: "From top", width: "Width", height: "Height" }[key]} error={e[key]}>
                {(p) => (
                  <input {...p} name={key} type="number" min={0} max={key === "y" || key === "height" ? 2100 : 1500} step={10} value={layout[key]} onChange={num(key)} className={inputClass} />
                )}
              </Field>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Text alignment">
            {(p) => (
              <select {...p} name="align" value={layout.align} onChange={(ev) => setLayout((l) => ({ ...l, align: ev.target.value as typeof l.align }))} className={inputClass}>
                <option value="center">Centre</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            )}
          </Field>
          <Field label="Lettering">
            {(p) => (
              <select {...p} name="font" value={layout.font} onChange={(ev) => setLayout((l) => ({ ...l, font: ev.target.value as typeof l.font }))} className={inputClass}>
                <option value="serif">Elegant (serif)</option>
                <option value="sans">Modern (sans)</option>
              </select>
            )}
          </Field>
          <Field label="Text colour" error={e.color}>
            {(p) => <input {...p} name="color" type="color" value={layout.color} onChange={(ev) => setLayout((l) => ({ ...l, color: ev.target.value }))} className="mt-2 block h-12 w-24 cursor-pointer rounded-md border border-ink/25" />}
          </Field>
          <Field label="Accent colour" hint="Greeting and sender's name" error={e.accentColor}>
            {(p) => <input {...p} name="accentColor" type="color" value={layout.accentColor} onChange={(ev) => setLayout((l) => ({ ...l, accentColor: ev.target.value }))} className="mt-2 block h-12 w-24 cursor-pointer rounded-md border border-ink/25" />}
          </Field>
          <Field label="Order" hint="Lower numbers show first" error={e.sort}>
            {(p) => <input {...p} name="sort" type="number" step={1} defaultValue={values.sort} className={inputClass} />}
          </Field>
        </div>

        <Checkbox name="active" label="Offer this design" defaultChecked={values.active} />
        <SaveBar state={state} label="Save design" uploading={uploading > 0} pending={pending} />
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="font-medium">Preview with sample words</p>
        <div className="mt-3" style={{ containerType: "inline-size" }}>
          {background ? (
            <CardPreview design={{ imageUrl: background, layout: { text: layout, ...layout } }} text={SAMPLE} senderName="Alex" />
          ) : (
            <div className="grid aspect-[5/7] place-items-center rounded-lg border border-dashed border-ink/30 p-6 text-center text-ink-muted">
              Upload a background to see the preview.
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
