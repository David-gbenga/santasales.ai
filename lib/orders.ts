import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutMetadataSchema } from "@/lib/validation";

/** Buyers can fetch a fresh download link for this long after paying (PRD A6). */
export const DOWNLOAD_WINDOW_DAYS = 30;
/** Each signed download link lasts this long (PRD A6). */
export const DOWNLOAD_LINK_TTL_SECONDS = 24 * 60 * 60;

export type OrderStatus = "pending" | "paid" | "refunded";

export type OrderSummary = {
  id: string;
  status: OrderStatus;
  kind: "product" | "card" | "lyrics";
  paid_at: string | null;
  product: { name: string; slug: string } | null;
};

/** Records the order as pending right after the Checkout Session is created. */
export async function createPendingOrder(input: {
  sessionId: string;
  productId: string;
  amountPence: number;
  currency: string;
}) {
  const { error } = await createAdminClient().from("orders").insert({
    stripe_session_id: input.sessionId,
    kind: "product",
    product_id: input.productId,
    amount_pence: input.amountPence,
    currency: input.currency,
    status: "pending",
  });
  if (error) throw new Error(`Creating pending order failed: ${error.message}`);
}

/**
 * Marks an order paid from a verified Stripe Checkout Session.
 * Idempotent: upserts on stripe_session_id, so webhook retries are harmless.
 * Never downgrades a refunded order back to paid.
 */
export async function markOrderPaid(session: Stripe.Checkout.Session, paidAt: Date) {
  const metadata = checkoutMetadataSchema.parse(session.metadata ?? {});
  const db = createAdminClient();

  const { data: existing, error: readError } = await db
    .from("orders")
    .select("status")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (readError) throw new Error(`Reading order failed: ${readError.message}`);
  if (existing?.status === "refunded") return;

  const { error } = await db.from("orders").upsert(
    {
      stripe_session_id: session.id,
      email: session.customer_details?.email ?? null,
      kind: metadata.kind,
      product_id: metadata.product_id,
      amount_pence: session.amount_total ?? 0,
      tax_pence: session.total_details?.amount_tax ?? 0,
      currency: session.currency ?? "gbp",
      status: "paid",
      paid_at: paidAt.toISOString(),
    },
    { onConflict: "stripe_session_id" },
  );
  if (error) throw new Error(`Marking order paid failed: ${error.message}`);
}

export async function getOrderBySessionId(sessionId: string): Promise<OrderSummary | null> {
  const { data, error } = await createAdminClient()
    .from("orders")
    .select("id, status, kind, paid_at, product:products(name, slug)")
    .eq("stripe_session_id", sessionId)
    .maybeSingle<OrderSummary>();
  if (error) throw new Error(`Reading order failed: ${error.message}`);
  return data;
}

export function isWithinDownloadWindow(paidAt: string | null, now = new Date()): boolean {
  if (!paidAt) return false;
  const ageMs = now.getTime() - new Date(paidAt).getTime();
  return ageMs <= DOWNLOAD_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}
