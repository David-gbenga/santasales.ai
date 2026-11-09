import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { requireEnv } from "@/lib/env";
import { markOrderPaid } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe webhook: the ONLY place an order becomes paid. The signature is
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
    console.error("[stripe-webhook] signature check failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        // Delayed payment methods complete first with payment_status "unpaid";
        // they're marked paid when async_payment_succeeded arrives.
        if (session.payment_status === "paid") {
          await markOrderPaid(session, new Date(event.created * 1000));
        }
        break;
      }
      default:
        // Other events are acknowledged and ignored.
        break;
    }
  } catch (err) {
    // 500 makes Stripe retry; markOrderPaid is idempotent, so retries are safe.
    console.error(`[stripe-webhook] handling ${event.type} ${event.id} failed`, err);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
