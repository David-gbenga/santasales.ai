/**
 * Server-side prices for the AI products, in pence. Checkout always uses
 * these (or the products table) — never a price sent by the browser.
 */
export const CARD_PRICE_PENCE = 299;
export const LYRICS_PRICE_PENCE = 199;
export const CURRENCY = "gbp";

/** Rewrites included with each card or lyrics order (PRD A4). */
export const MAX_REGENERATIONS = 3;

/** ElevenLabs add-ons (decision 2026-11-10). Placeholder prices; change here. */
export const SONG_AUDIO_PRICE_PENCE = 399;
export const VOICE_GREETING_PRICE_PENCE = 149;
/** A sung version costs real music credits: first take plus one retake. */
export const SONG_AUDIO_MAX_TAKES = 2;
/** Voice greetings are cheap: allow re-recording with edited words. */
export const VOICE_GREETING_MAX_TAKES = 3;
