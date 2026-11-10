import { z } from "zod";

/** Body of POST /api/checkout. Card and lyrics variants arrive in Phases 4–5. */
export const checkoutRequestSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("product"), productId: z.uuid() }),
]);
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

/** Metadata we attach to Checkout Sessions and read back in the webhook. */
export const checkoutMetadataSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("product"), product_id: z.uuid() }),
]);
export type CheckoutMetadata = z.infer<typeof checkoutMetadataSchema>;

export const stripeSessionIdSchema = z
  .string()
  .max(255)
  .regex(/^cs_(test|live)_[A-Za-z0-9]+$/);

export const orderIdSchema = z.uuid();

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
