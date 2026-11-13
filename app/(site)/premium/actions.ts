"use server";

import { redirect } from "next/navigation";
import { currentCustomer } from "@/lib/account";
import { siteUrl } from "@/lib/env";
import { getStripe, PREMIUM_CONSENT_TEXT } from "@/lib/stripe";
import {
  getSubscription,
  portalConfigurationId,
  premiumPriceId,
  stripeCustomerFor,
} from "@/lib/subscriptions";

/**
 * Starts the £25 / 30-day subscription in Stripe Checkout. Nothing is
 * activated here: the subscription only counts once the verified Stripe
 * webhook has stored it.
 */
export async function startSubscription(): Promise<void> {
  const customer = await currentCustomer();
  if (!customer) redirect("/login?next=/premium");
  if (!customer.emailConfirmed) redirect("/premium?error=confirm-email");

  const existing = await getSubscription(customer.id);
  if (existing && ["active", "trialing", "past_due"].includes(existing.status)) {
    // Already subscribed (or a payment to fix): manage it instead of paying twice.
    redirect("/account");
  }

  let url: string | null;
  try {
    const stripe = getStripe();
    const stripeCustomer = await stripeCustomerFor(customer);
    // Close any earlier unfinished checkout, so two tabs can't start two subscriptions.
    const open = await stripe.checkout.sessions.list({ customer: stripeCustomer, status: "open", limit: 10 });
    await Promise.all(
      open.data.filter((s) => s.mode === "subscription").map((s) => stripe.checkout.sessions.expire(s.id)),
    );

    const origin = siteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomer,
      client_reference_id: customer.id,
      line_items: [{ price: await premiumPriceId(), quantity: 1 }],
      subscription_data: { metadata: { user_id: customer.id }, description: "GiftPost Premium" },
      metadata: { kind: "premium", user_id: customer.id },
      custom_text: { submit: { message: PREMIUM_CONSENT_TEXT } },
      success_url: `${origin}/account?subscribed=1`,
      cancel_url: `${origin}/premium`,
    });
    url = session.url;
  } catch (err) {
    console.error("[premium] checkout failed", err);
    redirect("/premium?error=checkout");
  }
  if (!url) redirect("/premium?error=checkout");
  redirect(url);
}

/** Opens the Stripe Customer Portal: update card, see invoices, cancel. */
export async function openBillingPortal(): Promise<void> {
  const customer = await currentCustomer();
  if (!customer) redirect("/login?next=/account");

  const sub = await getSubscription(customer.id);
  if (!sub) redirect("/premium");

  let url: string;
  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      configuration: await portalConfigurationId(),
      return_url: `${siteUrl()}/account`,
    });
    url = session.url;
  } catch (err) {
    console.error("[premium] portal failed", err);
    redirect("/account?error=portal");
  }
  redirect(url);
}
