import "server-only";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAuthClient } from "@/lib/supabase/auth";

export type Customer = {
  id: string;
  email: string;
  fullName: string;
  /** Subscriber features need a confirmed email address. */
  emailConfirmed: boolean;
};

function nameFrom(user: User): string {
  const meta = user.user_metadata as { full_name?: unknown } | null;
  return typeof meta?.full_name === "string" ? meta.full_name.slice(0, 80) : "";
}

/**
 * The signed-in customer, verified with Supabase Auth (getUser checks the
 * token with the server). Null when signed out.
 */
export async function currentCustomer(): Promise<Customer | null> {
  await connection(); // always per request, never prerendered
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) return null;
  const profile = await ensureProfile(user);
  return {
    id: user.id,
    email: user.email,
    fullName: profile.full_name || nameFrom(user),
    emailConfirmed: Boolean(user.email_confirmed_at),
  };
}

/** Same as currentCustomer, but sends signed-out visitors to the sign-in page. */
export async function requireCustomer(next = "/account"): Promise<Customer> {
  const customer = await currentCustomer();
  if (!customer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return customer;
}

/**
 * Creates the profile row on first use (name from sign-up metadata).
 * Written with the service role: customers can't write profiles directly.
 */
export async function ensureProfile(user: User): Promise<{ full_name: string; stripe_customer_id: string | null }> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("profiles")
    .select("full_name, stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Loading profile failed: ${error.message}`);
  if (data) return data;

  const { data: created, error: insertError } = await db
    .from("profiles")
    .upsert({ user_id: user.id, full_name: nameFrom(user) }, { onConflict: "user_id", ignoreDuplicates: true })
    .select("full_name, stripe_customer_id")
    .maybeSingle();
  if (insertError) throw new Error(`Creating profile failed: ${insertError.message}`);
  if (!created) {
    // Another request created it at the same moment.
    const { data: again } = await db.from("profiles").select("full_name, stripe_customer_id").eq("user_id", user.id).single();
    if (again) return again;
  }
  if (created) await logAccountEvent(user.id, "signed_up");
  return created ?? { full_name: nameFrom(user), stripe_customer_id: null };
}

export type AccountEventType =
  | "signed_up"
  | "profile_updated"
  | "subscription_started"
  | "subscription_renewed"
  | "subscription_updated"
  | "payment_failed"
  | "subscription_cancelled"
  | "subscription_resumed"
  | "subscription_ended"
  | "allowance_used";

/** Audit trail. Never throws: a logging failure mustn't break the user's action. */
export async function logAccountEvent(
  userId: string | null,
  type: AccountEventType,
  detail: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await createAdminClient().from("account_events").insert({ user_id: userId, type, detail });
  if (error) console.error("[account] audit log failed", type, error.message);
}
