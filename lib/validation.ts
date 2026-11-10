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

/** The customer's own description of the card: the main brief when given. */
export const CARD_BRIEF_MAX = 500;
/** Without a relationship, the brief has to say enough to write from. */
const MIN_BRIEF_WITHOUT_RELATIONSHIP = 15;

export const cardInputSchema = z
  .object({
    recipientName: requiredText(40, "Their name"),
    senderName: requiredText(40, "Your name"),
    // Optional: people can say who the recipient is in their own words instead.
    relationship: z
      .union([z.enum(RELATIONSHIPS), z.literal("")])
      .optional()
      .transform((r) => r || undefined),
    tone: z.enum(CARD_TONES),
    details: cleanText(CARD_BRIEF_MAX).optional().default(""),
  })
  .refine((v) => v.relationship || v.details.length >= MIN_BRIEF_WITHOUT_RELATIONSHIP, {
    message: "tell us who they are to you, or describe the card in your own words",
    path: ["relationship"],
  });
export type CardInput = z.infer<typeof cardInputSchema>;

/** The words on a card. Claude writes these; the buyer may edit them before finishing. */
export const cardTextSchema = z.object({
  greeting: requiredText(60, "Greeting"),
  message: requiredText(700, "Message"),
  signOff: requiredText(60, "Sign-off"),
});
export type CardText = z.infer<typeof cardTextSchema>;

// ---------------------------------------------------------------------------
// Lyrics inputs

export const LYRIC_STYLES = ["cheerful", "sentimental", "funny"] as const;
export const LYRIC_LENGTHS = ["short", "standard", "long"] as const;

export const lyricsInputSchema = z
  .object({
    recipientName: requiredText(40, "Their name"),
    senderName: requiredText(40, "Your name"),
    relationship: z
      .union([z.enum(RELATIONSHIPS), z.literal("")])
      .optional()
      .transform((r) => r || undefined),
    style: z.enum(LYRIC_STYLES),
    length: z.enum(LYRIC_LENGTHS),
    details: cleanText(CARD_BRIEF_MAX).optional().default(""),
  })
  .refine((v) => v.relationship || v.details.length >= MIN_BRIEF_WITHOUT_RELATIONSHIP, {
    message: "tell us who they are to you, or describe the song in your own words",
    path: ["relationship"],
  });
export type LyricsInput = z.infer<typeof lyricsInputSchema>;

/**
 * Finished lyrics as the buyer sees and edits them: a title plus the body,
 * with section labels on their own lines, e.g. "[Verse 1]", "[Chorus]".
 */
export const lyricsTextSchema = z.object({
  title: requiredText(80, "Title"),
  // Keep line breaks: only trim the ends and strip control characters.
  body: z
    .string()
    .transform((s) =>
      s
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .replace(/\r\n/g, "\n")
        .trim(),
    )
    .pipe(
      z.string().min(1, "Lyrics are required").max(4000, "keep it to 4000 characters or fewer"),
    ),
});
export type LyricsText = z.infer<typeof lyricsTextSchema>;

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
  z.object({ kind: z.literal("lyrics"), input: lyricsInputSchema }),
]);
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

/** Metadata we attach to Checkout Sessions and read back in the webhook. */
export const checkoutMetadataSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("product"), product_id: z.uuid() }),
  z.object({ kind: z.literal("card"), generation_id: z.uuid() }),
  z.object({ kind: z.literal("lyrics"), generation_id: z.uuid() }),
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

/** Body of POST /api/generate/lyrics. */
export const generateLyricsRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("generate"), generationId: z.uuid() }),
  z.object({ action: z.literal("regenerate"), generationId: z.uuid() }),
  z.object({ action: z.literal("finalize"), generationId: z.uuid(), text: lyricsTextSchema }),
]);
export type GenerateLyricsRequest = z.infer<typeof generateLyricsRequestSchema>;

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
