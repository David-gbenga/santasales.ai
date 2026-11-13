import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { logAccountEvent } from "@/lib/account";
import { requireEnv } from "@/lib/env";
import { sendThankYouForSession } from "@/lib/order-emails";
import { markOrderPaid, markOrderRefunded } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";
import { sendSubscriptionNotice } from "@/lib/subscription-emails";
import {
  eventAlreadyHandled,
  invoiceSubscriptionId,
  logSubscriptionChange,
  markEventHandled,
  syncSubscription,
} from "@/lib/subscriptions";

const SUBSCRIPTION_EVENTS = new Set<Stripe.Event.Type>([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

/**
 * GiftPost Premium events. Each is handled once (stripe_events), and the
 * subscription is re-read from Stripe rather than trusted from the payload.
 */
async function handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
  if (await eventAlreadyHandled(event.id)) return;

  let subscriptionId: string | null = null;
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    subscriptionId = typeof session.subscription === "string" ? session.subscription : (session.subscription?.id ?? null);
  } else if (event.type.startsWith("customer.subscription.")) {
    subscriptionId = (event.data.object as Stripe.Subscription).id;
  } else if (event.type.startsWith("invoice.")) {
    subscriptionId = invoiceSubscriptionId(event.data.object as Stripe.Invoice);
  }

  if (subscriptionId) {
    const result = await syncSubscription(subscriptionId);
    if (result) {
      const change = await logSubscriptionChange(result);
      if (event.type === "invoice.payment_failed") {
        await logAccountEvent(result.row.user_id, "payment_failed", { subscription: subscriptionId });
        await sendSubscriptionNotice(result.row, "payment_failed");
      } else if (change === "subscription_ended") {
        await sendSubscriptionNotice(result.row, "ended");
      }
    }
  }
  await markEventHandled(event);
}

/**
 * Stripe webhook: the ONLY place an order becomes paid (or refunded). The signature is
 * verified against the raw body before anything is trusted.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      requireEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch (err) {
    // Message only: the error object carries the whole payload, customer emails included.
    console.error("[stripe-webhook] signature check failed", err instanceof Error ? err.message.slice(0, 200) : "unknown");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        if (session.mode === "subscription") {
          await handleSubscriptionEvent(event);
          break;
        }
        // Delayed payment methods complete first with payment_status "unpaid";
        // they're marked paid when async_payment_succeeded arrives.
        if (session.payment_status === "paid") {
          await markOrderPaid(session, new Date(event.created * 1000));
          // Once per order; never throws, so email trouble can't fail the webhook.
          await sendThankYouForSession(session.id);
        }
        break;
      }
      case "charge.refunded": {
        // Only a full refund withdraws the order; partial refunds keep access.
        const charge = event.data.object;
        const paymentIntent =
          typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (charge.refunded && paymentIntent) {
          const matched = await markOrderRefunded(paymentIntent);
          if (!matched) console.warn("[stripe-webhook] refund for an unknown payment", paymentIntent);
        }
        break;
      }
      default:
        if (SUBSCRIPTION_EVENTS.has(event.type)) {
          await handleSubscriptionEvent(event);
          break;
        }
        // Other events are acknowledged and ignored.
        break;
    }
  } catch (err) {
    // 500 makes Stripe retry; markOrderPaid and the subscription sync are idempotent.
    console.error(`[stripe-webhook] handling ${event.type} ${event.id} failed`, err);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
