import "server-only";
import { logAccountEvent, type Customer } from "@/lib/account";
import { PREMIUM_ALLOWANCE, type PremiumKind } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";

/** One allowance item, taken from the member's current billing period. */
export type PremiumClaim = { userId: string; kind: PremiumKind; subscriptionId: string; periodStart: string };

/**
 * Takes one item of a member's allowance, atomically in the database
 * (`entitlement_take`, which also checks the subscription is paid and
 * current). Null for non-members, unconfirmed emails and used-up allowances.
 */
export async function claimPremium(customer: Customer | null, kind: PremiumKind): Promise<PremiumClaim | null> {
  if (!customer?.emailConfirmed) return null;
  const { data, error } = await createAdminClient().rpc("entitlement_take", {
    p_user: customer.id,
    p_kind: kind,
    p_limit: PREMIUM_ALLOWANCE[kind],
  });
  if (error) throw new Error(`Allowance check failed: ${error.message}`);
  const row = (data as { subscription_id: string; period_start: string; used: number }[] | null)?.[0];
  if (!row) return null;
  return { userId: customer.id, kind, subscriptionId: row.subscription_id, periodStart: row.period_start };
}

/** Gives the item back when making it failed. Never throws. */
export async function releasePremium(claim: PremiumClaim): Promise<void> {
  const { error } = await createAdminClient().rpc("entitlement_release", {
    p_subscription: claim.subscriptionId,
    p_period_start: claim.periodStart,
    p_kind: claim.kind,
  });
  if (error) console.error("[premium] releasing allowance failed", error.message);
}

/**
 * A £0 paid order covered by the membership, so the existing rewrite,
 * finishing, download and gift-link code treats the item as bought.
 */
export async function createPremiumOrder(
  claim: PremiumClaim,
  generationId: string,
  orderKind: "card" | "lyrics" | "voice_greeting",
): Promise<void> {
  const { error } = await createAdminClient()
    .from("orders")
    .insert({
      stripe_session_id: `premium:${generationId}`,
      kind: orderKind,
      generation_id: generationId,
      amount_pence: 0,
      currency: "gbp",
      status: "paid",
      paid_at: new Date().toISOString(),
      source: "premium",
      subscription_id: claim.subscriptionId,
    });
  if (error) throw new Error(`Creating premium order failed: ${error.message}`);
  await logAccountEvent(claim.userId, "allowance_used", { kind: claim.kind, generation: generationId });
}

export type Creation = {
  id: string;
  kind: "card" | "lyrics";
  recipientName: string;
  occasion: string | null;
  finished: boolean;
  createdAt: string;
};

/** The member's own cards and songs, newest first (only rows linked to their account). */
export async function getCreations(userId: string, limit = 50): Promise<Creation[]> {
  const { data, error } = await createAdminClient()
    .from("generations")
    .select("id, kind, input, locked, created_at")
    .eq("user_id", userId)
    .in("kind", ["card", "lyrics"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Loading creations failed: ${error.message}`);
  return (data ?? []).map((g) => {
    const input = (g.input ?? {}) as { recipientName?: unknown; occasion?: unknown };
    return {
      id: g.id as string,
      kind: g.kind as "card" | "lyrics",
      recipientName: typeof input.recipientName === "string" ? input.recipientName : "",
      occasion: typeof input.occasion === "string" ? input.occasion : null,
      finished: Boolean(g.locked),
      createdAt: g.created_at as string,
    };
  });
}
