/**
 * Server-side prices, in pence. Checkout always uses these (or the products
 * table), never a price sent by the browser.
 */
export const CARD_PRICE_PENCE = 299;
export const CURRENCY = "gbp";

/**
 * Songs: one price covers the written lyrics AND the sung recording
 * (decision 2026-11-10), stepped by length.
 */
export const SONG_PRICE_BY_LENGTH = { short: 299, standard: 349, long: 399 } as const;
export type SongLength = keyof typeof SONG_PRICE_BY_LENGTH;
export function songPricePence(length: SongLength): number {
  return SONG_PRICE_BY_LENGTH[length];
}
/** Lowest song price, for "from £x" labels. */
export const LYRICS_PRICE_PENCE = SONG_PRICE_BY_LENGTH.short;

/** Rewrites included after paying for a card or song (PRD A4). */
export const MAX_REGENERATIONS = 3;
/** Free re-rolls of a preview before paying (decision 2026-11-10). */
export const FREE_PREVIEW_REROLLS = 1;
/** Free previews per visitor per day, and for everyone together (cost backstop). */
export const PREVIEW_LIMITS = { visitorPerDay: 5, globalPerDay: 400 } as const;

/** Voice greeting add-on (placeholder price). */
export const VOICE_GREETING_PRICE_PENCE = 149;
/** The sung recording that comes with a song: first take plus one retake. */
export const SONG_AUDIO_MAX_TAKES = 2;
/** Voice greetings are cheap: allow re-recording with edited words. */
export const VOICE_GREETING_MAX_TAKES = 3;

/** Unpaid previews (and their sample clips) are deleted after this many days (privacy notice). */
export const PREVIEW_RETENTION_DAYS = 30;
/** Cookie-free site statistics are deleted after this many days (privacy notice). */
export const EVENT_RETENTION_DAYS = 730;

/** GiftPost Premium (docs/SUBSCRIPTIONS.md): £25, renewing every 30 days. */
export const PREMIUM_PRICE_PENCE = 2500;
export const PREMIUM_INTERVAL_DAYS = 30;
/** Stripe Price lookup key; the Price itself is created by scripts/stripe-premium-price.mjs. */
export const PREMIUM_PRICE_LOOKUP_KEY = "giftpost_premium_30d";
/** Allowance per billing period (Option B, owner's decision 2026-11-13). Unused items don't roll over. */
export const PREMIUM_ALLOWANCE = { song: 15, card: 30, voice_greeting: 10 } as const;
export type PremiumKind = keyof typeof PREMIUM_ALLOWANCE;
/** Daily per-visitor limits on account forms, on top of Supabase Auth's own limits. */
export const ACCOUNT_LIMITS = { signUp: 5, signIn: 30, passwordReset: 5 } as const;
