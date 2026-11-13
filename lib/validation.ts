import { z } from "zod";
import {
  GREETING_TEXT_MAX,
  GREETING_VOICE_IDS,
  SONG_STYLE_KEYS,
  VOCAL_KEYS,
} from "@/lib/audio-options";
import { DEFAULT_OCCASION, OCCASION_KEYS } from "@/lib/occasions";

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
    // Older orders have no occasion: they were all Christmas.
    occasion: z.enum(OCCASION_KEYS).default(DEFAULT_OCCASION),
    // Hide the sender from the recipient (card, song sheet, gift page).
    anonymous: z.boolean().default(false),
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
    // Older orders have no occasion: they were all Christmas.
    occasion: z.enum(OCCASION_KEYS).default(DEFAULT_OCCASION),
    // Hide the sender from the recipient (card, song sheet, gift page).
    anonymous: z.boolean().default(false),
    relationship: z
      .union([z.enum(RELATIONSHIPS), z.literal("")])
      .optional()
      .transform((r) => r || undefined),
    style: z.enum(LYRIC_STYLES),
    length: z.enum(LYRIC_LENGTHS),
    details: cleanText(CARD_BRIEF_MAX).optional().default(""),
    // How it's sung (every song comes sung). Defaults keep older orders valid.
    musicStyle: z.enum(SONG_STYLE_KEYS).default("cosy"),
    vocal: z.enum(VOCAL_KEYS).default("female"),
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

// ---------------------------------------------------------------------------
// ElevenLabs add-ons

export const songAudioInputSchema = z.object({
  style: z.enum(SONG_STYLE_KEYS),
  vocal: z.enum(VOCAL_KEYS),
});
export type SongAudioInput = z.infer<typeof songAudioInputSchema>;

export const voiceGreetingInputSchema = z.object({
  voiceId: z.enum(GREETING_VOICE_IDS),
  text: requiredText(GREETING_TEXT_MAX, "Your greeting"),
});
export type VoiceGreetingInput = z.infer<typeof voiceGreetingInputSchema>;

/** Body of POST /api/generate/audio. A retake of a greeting may change its words or voice. */
export const generateAudioRequestSchema = z.object({
  generationId: z.uuid(),
  action: z.enum(["generate", "retake"]),
  greeting: voiceGreetingInputSchema.optional(),
});

/** Body of POST /api/share. orderId is the buyer's key, as for downloads. */
export const shareRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), orderId: z.uuid(), note: cleanText(300).optional() }),
  z.object({ action: z.literal("revoke"), orderId: z.uuid() }),
]);

export const giftTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{22,64}$/);

export const designSlugSchema = z
  .string()
  .max(64)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

// ---------------------------------------------------------------------------
// Checkout

/** Body of POST /api/checkout. Prices are never accepted from the client. */
export const checkoutRequestSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("product"), productId: z.uuid() }),
  // Pay for a card or song that was previewed for free (POST /api/preview).
  z.object({ kind: z.literal("preview"), generationId: z.uuid() }),
  z.object({
    kind: z.literal("song_audio"),
    parentGenerationId: z.uuid(),
    input: songAudioInputSchema,
  }),
  z.object({
    kind: z.literal("voice_greeting"),
    parentGenerationId: z.uuid(),
    input: voiceGreetingInputSchema,
  }),
]);
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

/** Metadata we attach to Checkout Sessions and read back in the webhook. */
export const checkoutMetadataSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("product"), product_id: z.uuid() }),
  z.object({ kind: z.literal("card"), generation_id: z.uuid() }),
  z.object({ kind: z.literal("lyrics"), generation_id: z.uuid() }),
  z.object({ kind: z.literal("song_audio"), generation_id: z.uuid() }),
  z.object({ kind: z.literal("voice_greeting"), generation_id: z.uuid() }),
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
  z.object({
    action: z.literal("finalize"),
    generationId: z.uuid(),
    text: lyricsTextSchema,
    // Optional change of how it is sung, just before recording.
    music: z.object({ musicStyle: z.enum(SONG_STYLE_KEYS), vocal: z.enum(VOCAL_KEYS) }).optional(),
  }),
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


// ---------------------------------------------------------------------------
// Free previews

/** Body of POST /api/preview: start a free preview (written before payment). */
export const previewRequestSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("card"), designSlug: designSlugSchema, input: cardInputSchema }),
  z.object({ kind: z.literal("lyrics"), input: lyricsInputSchema }),
]);

export const previewClipRequestSchema = z.object({ generationId: z.uuid() });

// ---------------------------------------------------------------------------
// Bootcamp sign-ups

export const BOOTCAMP_EXPERIENCE = {
  new: "New to coding",
  some: "I've done some coding",
  developer: "I'm a developer",
} as const;
export type BootcampExperience = keyof typeof BOOTCAMP_EXPERIENCE;

/** Body of POST /api/bootcamp. `website` is a hidden honeypot field: people leave it empty. */
export const bootcampRegistrationSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(320),
  experience: z.enum(Object.keys(BOOTCAMP_EXPERIENCE) as [BootcampExperience, ...BootcampExperience[]]),
  goal: z.string().trim().max(500).optional(),
  consent: z.literal(true),
  website: z.string().max(200).optional(),
});
export type BootcampRegistration = z.infer<typeof bootcampRegistrationSchema>;

// ---------------------------------------------------------------------------
// Customer accounts (GiftPost Premium, docs/SUBSCRIPTIONS.md)
// ---------------------------------------------------------------------------

export const fullNameSchema = z.string().trim().min(1, "Enter your name").max(80, "Use 80 characters or fewer");
export const accountEmailSchema = z.email("Enter a valid email address").max(254);
/** 10+ characters; bcrypt (Supabase) reads at most 72 bytes, so cap there. */
export const newPasswordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .refine((p) => new TextEncoder().encode(p).length <= 72, "Use 72 characters or fewer");

export const signUpSchema = z.object({
  fullName: fullNameSchema,
  email: accountEmailSchema,
  password: newPasswordSchema,
});
export const signInSchema = z.object({
  email: accountEmailSchema,
  password: z.string().min(1, "Enter your password").max(200),
});
/** Only same-site account paths may be used as a post-sign-in destination (no open redirects). */
export const accountNextSchema = z
  .string()
  .regex(/^\/(account|premium|cards|lyrics)(\/[\w-]*)*$/)
  .catch("/account");
