import { z } from "zod";

/** Trims, collapses whitespace and strips control characters from free text. */
const cleanText = (max: number) =>
  z
    .string()
    .transform((s) =>
      s
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .replace(/[ \t]+/g, " ")
        .trim(),
    )
    .pipe(z.string().max(max, `keep it to ${max} characters or fewer`));

const requiredText = (max: number, label: string) =>
  cleanText(max).pipe(z.string().min(1, `${label} is required`));

// ---------------------------------------------------------------------------
// Card inputs

export const RELATIONSHIPS = [
  "partner",
  "parent",
  "grandparent",
  "child",
  "grandchild",
  "sibling",
  "friend",
  "colleague",
  "teacher",
  "neighbour",
  "other",
] as const;

export const CARD_TONES = ["warm", "heartfelt", "funny", "traditional"] as const;

export const cardInputSchema = z.object({
  recipientName: requiredText(40, "Their name"),
  senderName: requiredText(40, "Your name"),
  relationship: z.enum(RELATIONSHIPS),
  tone: z.enum(CARD_TONES),
  details: cleanText(300).optional().default(""),
});
export type CardInput = z.infer<typeof cardInputSchema>;

/** The words on a card. Claude writes these; the buyer may edit them before finishing. */
export const cardTextSchema = z.object({
  greeting: requiredText(60, "Greeting"),
  message: requiredText(700, "Message"),
  signOff: requiredText(60, "Sign-off"),
});
export type CardText = z.infer<typeof cardTextSchema>;

export const designSlugSchema = z
  .string()
  .max(64)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

// ---------------------------------------------------------------------------
// Checkout

/** Body of POST /api/checkout. Prices are never accepted from the client. */
export const checkoutRequestSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("product"), productId: z.uuid() }),
  z.object({ kind: z.literal("card"), designSlug: designSlugSchema, input: cardInputSchema }),
]);
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

/** Metadata we attach to Checkout Sessions and read back in the webhook. */
export const checkoutMetadataSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("product"), product_id: z.uuid() }),
  z.object({ kind: z.literal("card"), generation_id: z.uuid() }),
]);
export type CheckoutMetadata = z.infer<typeof checkoutMetadataSchema>;

export const stripeSessionIdSchema = z
  .string()
  .max(255)
  .regex(/^cs_(test|live)_[A-Za-z0-9]+$/);

export const orderIdSchema = z.uuid();

// ---------------------------------------------------------------------------
// Card generation

/** Body of POST /api/generate/card. */
export const generateCardRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("generate"), generationId: z.uuid() }),
  z.object({ action: z.literal("regenerate"), generationId: z.uuid() }),
  z.object({ action: z.literal("finalize"), generationId: z.uuid(), text: cardTextSchema }),
]);
export type GenerateCardRequest = z.infer<typeof generateCardRequestSchema>;

// ---------------------------------------------------------------------------
// Analytics

export const EVENT_TYPES = ["page_view", "gallery_click", "cta_click", "checkout_start"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Body of POST /api/track. Limits match the events table's check constraints. */
export const trackEventSchema = z.object({
  type: z.enum(EVENT_TYPES),
  path: z.string().startsWith("/").max(512),
  refId: z.string().max(128).optional(),
  referrer: z.string().max(1024).optional(),
});
export type TrackEvent = z.infer<typeof trackEventSchema>;
