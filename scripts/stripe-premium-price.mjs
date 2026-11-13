// One-off, idempotent Stripe setup for GiftPost Premium (docs/SUBSCRIPTIONS.md).
// Creates, in whichever mode STRIPE_SECRET_KEY is for:
//   - the "GiftPost Premium" product and a £25 GBP price renewing every 30 days,
//     found by lookup key `giftpost_premium_30d` (the app never uses a price ID);
//   - a Customer Portal configuration (update card, invoices, cancel at period end).
// Run again safely: existing objects are reused.
//
//   node scripts/stripe-premium-price.mjs            (reads .env)
//   node scripts/stripe-premium-price.mjs .env.live  (a file holding the live key)
import { readFileSync } from "node:fs";
import Stripe from "stripe";

const envFile = process.argv[2] ?? ".env";
const env = Object.fromEntries(
  readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]),
);
const key = env.STRIPE_SECRET_KEY;
if (!key) throw new Error(`STRIPE_SECRET_KEY missing from ${envFile}`);
const site = (env.NEXT_PUBLIC_SITE_URL || "https://www.giftpost.co.uk").replace(/\/$/, "");
const stripe = new Stripe(key);
const mode = key.startsWith("sk_live_") ? "LIVE" : "test";

const LOOKUP_KEY = "giftpost_premium_30d"; // keep in step with lib/pricing.ts

const existing = await stripe.prices.list({ lookup_keys: [LOOKUP_KEY], active: true, expand: ["data.product"] });
let price = existing.data[0];
if (price) {
  console.log(`[${mode}] price exists: ${price.id}`);
} else {
  const product = await stripe.products.create({
    name: "GiftPost Premium",
    description:
      "Each 30 days: 15 personal songs, 30 personal cards and 10 voice greetings. Renews automatically; cancel any time.",
    metadata: { giftpost: "premium" },
  });
  price = await stripe.prices.create({
    product: product.id,
    currency: "gbp",
    unit_amount: 2500,
    recurring: { interval: "day", interval_count: 30 },
    lookup_key: LOOKUP_KEY,
    nickname: "£25 every 30 days",
    tax_behavior: "unspecified",
  });
  console.log(`[${mode}] created product ${product.id} and price ${price.id}`);
}

const configs = await stripe.billingPortal.configurations.list({ active: true, limit: 100 });
const portal = configs.data.find((c) => c.metadata?.giftpost === "premium");
if (portal) {
  console.log(`[${mode}] portal configuration exists: ${portal.id}`);
} else {
  const created = await stripe.billingPortal.configurations.create({
    name: "GiftPost Premium",
    metadata: { giftpost: "premium" },
    business_profile: {
      headline: "Manage your GiftPost Premium membership",
      privacy_policy_url: `${site}/privacy`,
      terms_of_service_url: `${site}/terms`,
    },
    default_return_url: `${site}/account`,
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      customer_update: { enabled: false },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        proration_behavior: "none",
        cancellation_reason: {
          enabled: true,
          options: ["too_expensive", "unused", "missing_features", "other"],
        },
      },
      subscription_update: { enabled: false },
    },
  });
  console.log(`[${mode}] created portal configuration ${created.id}`);
}
