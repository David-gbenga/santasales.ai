// One-off, idempotent Stripe setup for GiftPost Premium (docs/SUBSCRIPTIONS.md).
// Creates, in whichever mode STRIPE_SECRET_KEY is for:
//   - the monthly (£25 every 30 days, `giftpost_premium_30d`) and yearly
//     (£225 a year, `giftpost_premium_yearly`) products and prices, found by
//     lookup key (the app never uses a price ID);
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

// Keep in step with PREMIUM_PLANS in lib/pricing.ts.
const PLANS = [
  {
    lookupKey: "giftpost_premium_30d",
    productName: "GiftPost Premium",
    description:
      "Each 30 days: 15 personal songs, 30 personal cards and 10 voice greetings. Renews automatically; cancel any time.",
    unitAmount: 2500,
    recurring: { interval: "day", interval_count: 30 },
    nickname: "£25 every 30 days",
  },
  {
    lookupKey: "giftpost_premium_yearly",
    productName: "Giftpost premium yearly subscription", // owner's wording, shown in Checkout
    description:
      "£225 a year. Every 30 days: 15 personal songs, 30 personal cards and 10 voice greetings. Renews yearly; cancel any time.",
    unitAmount: 22500,
    recurring: { interval: "year", interval_count: 1 },
    nickname: "£225 a year",
  },
];

for (const plan of PLANS) {
  const existing = await stripe.prices.list({ lookup_keys: [plan.lookupKey], active: true });
  if (existing.data[0]) {
    console.log(`[${mode}] ${plan.nickname}: price exists: ${existing.data[0].id}`);
    continue;
  }
  const product = await stripe.products.create({
    name: plan.productName,
    description: plan.description,
    metadata: { giftpost: "premium" },
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "gbp",
    unit_amount: plan.unitAmount,
    recurring: plan.recurring,
    lookup_key: plan.lookupKey,
    nickname: plan.nickname,
    tax_behavior: "unspecified",
  });
  console.log(`[${mode}] ${plan.nickname}: created product ${product.id} and price ${price.id}`);
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
