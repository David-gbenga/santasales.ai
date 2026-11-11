/**
 * The free Giftpost AI Builder Kit, included with every paid order (offer
 * started 2026-11-11). Set `enabled` to false to end the offer: emails stop
 * mentioning it and /api/kit links stop working.
 *
 * The PDF lives in the private products bucket; its source is
 * marketing/ai-kit/kit.html (re-upload with scripts/upload-ai-kit.mjs).
 */
export const AI_KIT = {
  enabled: true,
  bucket: "products",
  path: "bonus/giftpost-ai-builder-kit.pdf",
  filename: "giftpost-ai-builder-kit.pdf",
  title: "Free bonus: the Giftpost AI Builder Kit",
} as const;
