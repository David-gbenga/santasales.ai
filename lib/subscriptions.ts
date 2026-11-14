import "server-only";
import type Stripe from "stripe";
import { logAccountEvent, type AccountEventType, type Customer } from "@/lib/account";
import {
  PREMIUM_ALLOWANCE,
  PREMIUM_ALLOWANCE_WINDOW_DAYS,
  PREMIUM_PLANS,
  planForLookupKey,
  type PremiumKind,
  type PremiumPlan,
} from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/** Our mirror of a Stripe subscription (table `subscriptions`). */
export type SubscriptionRow = {
  id: string;
  user_id: string | null;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: Stripe.Subscription.Status;
  price_id: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  ended_at: string | null;
  created_at: string;
};

/** What the customer sees on their dashboard. */
export type MembershipState = "active" | "cancelling" | "payment_failed" | "expired";

const LIVE_STATUSES = ["trialing", "active", "past_due"] as const;

/**
 * THE access rule (server-side only): a paid, current period. Mirrors
 * `entitlement_take` in the database, which enforces it for generations.
 */
export function hasAccess(sub: SubscriptionRow | null, now = new Date()): boolean {
  return (
    !!sub &&
    (sub.status === "active" || sub.status === "trialing") &&
    new Date(sub.current_period_end) > now
  );
}

export function membershipState(sub: SubscriptionRow, now = new Date()): MembershipState {
  if (hasAccess(sub, now)) return sub.cancel_at_period_end ? "cancelling" : "active";
  if (sub.status === "past_due" || sub.status === "unpaid") return "payment_failed";
  return "expired";
}

/** The account's most relevant subscription: a live one first, otherwise the latest. */
export async function getSubscription(userId: string): Promise<SubscriptionRow | null> {
  const { data, error } = await createAdminClient()
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("current_period_end", { ascending: false })
    .limit(5)
    .returns<SubscriptionRow[]>();
  if (error) throw new Error(`Loading subscription failed: ${error.message}`);
  const rows = data ?? [];
  return rows.find((r) => (LIVE_STATUSES as readonly string[]).includes(r.status)) ?? rows[0] ?? null;
}

export type Allowance = Record<PremiumKind, { used: number; limit: number }> & {
  /** When this allowance window ends (it resets then, or at renewal). */
  resetsAt: string;
};

const WINDOW_MS = PREMIUM_ALLOWANCE_WINDOW_DAYS * 86_400_000;

/**
 * The 30-day allowance window the subscription is in: same arithmetic as
 * `entitlement_take` in the database. A monthly plan has one window per
 * payment; a yearly plan has about twelve.
 */
export function allowanceWindow(sub: Pick<SubscriptionRow, "current_period_start" | "current_period_end">, now = new Date()) {
  const start = new Date(sub.current_period_start).getTime();
  const index = Math.max(0, Math.floor((now.getTime() - start) / WINDOW_MS));
  const windowStart = new Date(start + index * WINDOW_MS);
  const windowEnd = new Date(Math.min(windowStart.getTime() + WINDOW_MS, new Date(sub.current_period_end).getTime()));
  return { start: windowStart.toISOString(), end: windowEnd.toISOString() };
}

/** Which plan a stored subscription is on (by its Stripe price). */
export async function planOf(sub: Pick<SubscriptionRow, "price_id">): Promise<PremiumPlan> {
  const ids = await premiumPriceIds();
  return (Object.keys(ids) as PremiumPlan[]).find((p) => ids[p] === sub.price_id) ?? "monthly";
}

/** Allowance used in the subscription's current 30-day window. */
export async function getAllowance(sub: SubscriptionRow): Promise<Allowance> {
  const window = allowanceWindow(sub);
  const { data, error } = await createAdminClient()
    .from("entitlement_usage")
    .select("kind, count")
    .eq("subscription_id", sub.id)
    .gte("period_start", window.start)
    .lt("period_start", new Date(new Date(window.start).getTime() + 1000).toISOString());
  if (error) throw new Error(`Loading allowance failed: ${error.message}`);
  const used = Object.fromEntries((data ?? []).map((r) => [r.kind, r.count as number]));
  return {
    song: { used: used.song ?? 0, limit: PREMIUM_ALLOWANCE.song },
    card: { used: used.card ?? 0, limit: PREMIUM_ALLOWANCE.card },
    voice_greeting: { used: used.voice_greeting ?? 0, limit: PREMIUM_ALLOWANCE.voice_greeting },
    resetsAt: window.end,
  };
}

let cachedPriceIds: Record<PremiumPlan, string> | undefined;

/** Both Premium prices, found by lookup key (created by scripts/stripe-premium-price.mjs). */
export async function premiumPriceIds(): Promise<Record<PremiumPlan, string>> {
  if (cachedPriceIds) return cachedPriceIds;
  const plans = Object.keys(PREMIUM_PLANS) as PremiumPlan[];
  const prices = await getStripe().prices.list({
    lookup_keys: plans.map((p) => PREMIUM_PLANS[p].lookupKey),
    active: true,
    limit: 10,
  });
  const ids = {} as Record<PremiumPlan, string>;
  for (const plan of plans) {
    const price = prices.data.find((x) => x.lookup_key === PREMIUM_PLANS[plan].lookupKey);
    if (!price) throw new Error(`No active Stripe price with lookup key ${PREMIUM_PLANS[plan].lookupKey}`);
    ids[plan] = price.id;
  }
  cachedPriceIds = ids;
  return ids;
}

/** The Stripe price for one plan. */
export async function premiumPriceId(plan: PremiumPlan = "monthly"): Promise<string> {
  return (await premiumPriceIds())[plan];
}

let cachedPortalConfig: string | undefined;

/** The Customer Portal configuration made by scripts/stripe-premium-price.mjs. */
export async function portalConfigurationId(): Promise<string | undefined> {
  if (cachedPortalConfig) return cachedPortalConfig;
  const configs = await getStripe().billingPortal.configurations.list({ active: true, limit: 100 });
  cachedPortalConfig = configs.data.find((c) => c.metadata?.giftpost === "premium")?.id;
  return cachedPortalConfig;
}

/**
 * The account's Stripe Customer, created once and stored on the profile so
 * repeat subscriptions never make duplicate customers.
 */
export async function stripeCustomerFor(customer: Customer): Promise<string> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", customer.id)
    .single();
  if (error) throw new Error(`Loading profile failed: ${error.message}`);
  if (data.stripe_customer_id) return data.stripe_customer_id;

  const created = await getStripe().customers.create(
    {
      email: customer.email,
      name: customer.fullName || undefined,
      metadata: { user_id: customer.id },
    },
    { idempotencyKey: `customer-${customer.id}` },
  );
  // Only set it if still empty, so two racing requests keep one customer.
  const { data: saved } = await db
    .from("profiles")
    .update({ stripe_customer_id: created.id, updated_at: new Date().toISOString() })
    .eq("user_id", customer.id)
    .is("stripe_customer_id", null)
    .select("stripe_customer_id")
    .maybeSingle();
  if (saved?.stripe_customer_id) return saved.stripe_customer_id;
  const { data: again } = await db.from("profiles").select("stripe_customer_id").eq("user_id", customer.id).single();
  return again?.stripe_customer_id ?? created.id;
}

const iso = (seconds: number | null | undefined) => (seconds ? new Date(seconds * 1000).toISOString() : null);

/** Finds which account a Stripe subscription belongs to. */
async function userIdFor(sub: Stripe.Subscription): Promise<string | null> {
  const fromMeta = sub.metadata?.user_id;
  if (fromMeta && /^[0-9a-f-]{36}$/i.test(fromMeta)) return fromMeta;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const { data } = await createAdminClient()
    .from("profiles")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}

export type SyncResult = { row: SubscriptionRow; previous: SubscriptionRow | null } | null;

/**
 * Re-reads the subscription from Stripe and stores its current state.
 * Always fetching (rather than trusting the event payload) means events
 * that arrive late, twice or out of order can't leave stale data.
 */
export async function syncSubscription(subscriptionId: string): Promise<SyncResult> {
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const item = sub.items.data.find((i) => planForLookupKey(i.price.lookup_key)) ?? sub.items.data[0];
  if (!item || !planForLookupKey(item.price.lookup_key)) {
    console.warn("[subscriptions] ignoring a subscription that isn't Premium", sub.id);
    return null;
  }

  const db = createAdminClient();
  const { data: previous } = await db
    .from("subscriptions")
    .select("*")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle<SubscriptionRow>();

  const row = {
    user_id: previous?.user_id ?? (await userIdFor(sub)),
    stripe_subscription_id: sub.id,
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    status: sub.status,
    price_id: item.price.id,
    current_period_start: iso(item.current_period_start)!,
    current_period_end: iso(item.current_period_end)!,
    cancel_at_period_end: sub.cancel_at_period_end || Boolean(sub.cancel_at),
    canceled_at: iso(sub.canceled_at),
    ended_at: iso(sub.ended_at),
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error } = await db
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id" })
    .select("*")
    .single<SubscriptionRow>();
  if (error?.code === "23505") {
    // A second live subscription for the same account (e.g. two checkout tabs).
    // Keep the first; cancel this one so the customer isn't billed twice.
    console.error("[subscriptions] duplicate live subscription; cancelling it — refund its first payment in Stripe", sub.id);
    await stripe.subscriptions.cancel(sub.id, { invoice_now: false, prorate: false });
    await logAccountEvent(row.user_id, "subscription_ended", { subscription: sub.id, reason: "duplicate" });
    return null;
  }
  if (error) throw new Error(`Saving subscription failed: ${error.message}`);
  return { row: saved, previous: previous ?? null };
}

/** Audit-log what changed between two states of the same subscription. */
export async function logSubscriptionChange(result: NonNullable<SyncResult>): Promise<AccountEventType | null> {
  const { row, previous } = result;
  let type: AccountEventType | null = null;
  if (!previous) type = "subscription_started";
  else if (row.status === "canceled" && previous.status !== "canceled") type = "subscription_ended";
  else if (row.cancel_at_period_end && !previous.cancel_at_period_end) type = "subscription_cancelled";
  else if (!row.cancel_at_period_end && previous.cancel_at_period_end) type = "subscription_resumed";
  else if (row.current_period_start !== previous.current_period_start) type = "subscription_renewed";
  else if (row.status !== previous.status) type = "subscription_updated";
  if (type) {
    await logAccountEvent(row.user_id, type, {
      subscription: row.stripe_subscription_id,
      status: row.status,
      period_end: row.current_period_end,
    });
  }
  return type;
}

/** Webhook idempotency: true when this Stripe event was already handled. */
export async function eventAlreadyHandled(eventId: string): Promise<boolean> {
  const { data } = await createAdminClient().from("stripe_events").select("event_id").eq("event_id", eventId).maybeSingle();
  return Boolean(data);
}

/** Marks a Stripe event as handled (only after it succeeded, so failures are retried). */
export async function markEventHandled(event: Stripe.Event): Promise<void> {
  const { error } = await createAdminClient()
    .from("stripe_events")
    .upsert({ event_id: event.id, type: event.type }, { onConflict: "event_id", ignoreDuplicates: true });
  if (error) throw new Error(`Recording event failed: ${error.message}`);
}

/** The subscription an invoice was for, if any. */
export function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

/** Records a paid membership invoice for the admin revenue figures. Idempotent. */
export async function recordSubscriptionPayment(invoice: Stripe.Invoice, row: SubscriptionRow | null): Promise<void> {
  if (!invoice.amount_paid) return;
  const { error } = await createAdminClient()
    .from("subscription_payments")
    .upsert(
      {
        stripe_invoice_id: invoice.id,
        subscription_id: row?.id ?? null,
        amount_pence: invoice.amount_paid,
        currency: invoice.currency,
        billing_reason: invoice.billing_reason,
        livemode: invoice.livemode,
        paid_at: iso(invoice.status_transitions?.paid_at ?? invoice.created)!,
      },
      { onConflict: "stripe_invoice_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(`Recording subscription payment failed: ${error.message}`);
}

/**
 * Marks a refunded membership payment (full refunds only, as for orders).
 * Returns false when the payment wasn't a membership invoice.
 */
export async function markSubscriptionPaymentRefunded(paymentIntentId: string): Promise<boolean> {
  const payments = await getStripe().invoicePayments.list({
    payment: { type: "payment_intent", payment_intent: paymentIntentId },
    limit: 1,
  });
  const invoice = payments.data[0]?.invoice;
  const invoiceId = typeof invoice === "string" ? invoice : invoice?.id;
  if (!invoiceId) return false;
  const { data, error } = await createAdminClient()
    .from("subscription_payments")
    .update({ refunded_at: new Date().toISOString() })
    .eq("stripe_invoice_id", invoiceId)
    .is("refunded_at", null)
    .select("stripe_invoice_id");
  if (error) throw new Error(`Marking subscription payment refunded failed: ${error.message}`);
  return (data ?? []).length > 0;
}
