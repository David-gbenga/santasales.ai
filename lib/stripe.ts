import "server-only";
import Stripe from "stripe";
import { requireEnv } from "@/lib/env";

/**
 * Stripe Tax is off: the seller is an individual below the UK VAT
 * threshold (decision 2026-11-09). Turn this on — and configure Stripe Tax
 * in the dashboard — if that changes or you sell to EU consumers.
 */
export const AUTOMATIC_TAX_ENABLED = false;

/** Shown above the pay button: consent to immediate supply of digital content (UK CCRs). */
export const DIGITAL_CONSENT_TEXT =
  "Your download is available as soon as payment completes. By paying, you ask for immediate access and accept that you lose the 14-day right to cancel for digital content.";

let stripe: Stripe | undefined;

export function getStripe(): Stripe {
  stripe ??= new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    appInfo: { name: "giftpost" },
  });
  return stripe;
}

/** Shown above the subscribe button: renewal terms and immediate-access consent. */
export const PREMIUM_CONSENT_TEXT =
  "GiftPost Premium renews automatically every 30 days at £25 until you cancel. Cancel any time in My account; you keep access until the end of the period you've paid for. By subscribing, you ask for immediate access to the service.";
