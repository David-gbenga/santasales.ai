/**
 * Server-side prices for the AI products, in pence. Checkout always uses
 * these (or the products table) — never a price sent by the browser.
 */
export const CARD_PRICE_PENCE = 299;
export const LYRICS_PRICE_PENCE = 199;
export const CURRENCY = "gbp";

/** Rewrites included with each card or lyrics order (PRD A4). */
export const MAX_REGENERATIONS = 3;
