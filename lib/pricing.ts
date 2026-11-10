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
