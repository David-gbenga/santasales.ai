"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdminEmail } from "@/lib/admin-auth";
import { siteUrl } from "@/lib/env";
import { createAuthClient } from "@/lib/supabase/auth";

export type SignInState = { status: "idle" | "sent" | "error"; message: string };

const SENT =
  "If that address can manage this shop, a sign-in link is on its way. It works once and expires in an hour.";

/**
 * Sends a magic link, but only to allowlisted addresses. The reply is the
 * same either way, so the form can't be used to discover admin emails.
 */
export async function sendMagicLink(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = z
    .email()
    .max(254)
    .safeParse(String(formData.get("email") ?? "").trim());
  if (!email.success) return { status: "error", message: "Enter a valid email address." };

  if (isAdminEmail(email.data)) {
    const supabase = await createAuthClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.data,
      options: {
        emailRedirectTo: `${siteUrl()}/auth/callback?next=/admin`,
        shouldCreateUser: true,
      },
    });
    if (error) {
      console.error("[admin] magic link failed", error.message);
      return {
        status: "error",
        message:
          error.status === 429
            ? "Too many sign-in emails. Wait a minute, then try again."
            : "The sign-in email couldn't be sent. Try again in a minute.",
      };
    }
  }
  return { status: "sent", message: SENT };
}

const WRONG_PASSWORD = "That email and password don’t match an admin account.";

/**
 * Email and password sign-in for allowlisted admins (no email to wait for).
 * The password is set in the Supabase dashboard, never by this app. One
 * message covers every failure so the form can’t reveal admin emails.
 */
export async function signInWithPassword(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = z
    .object({ email: z.email().max(254), password: z.string().min(1).max(200) })
    .safeParse({
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    });
  if (!parsed.success) return { status: "error", message: "Enter your email and password." };
  if (!isAdminEmail(parsed.data.email)) return { status: "error", message: WRONG_PASSWORD };

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.status === 429)
      return { status: "error", message: "Too many attempts. Wait a few minutes, then try again." };
    return { status: "error", message: WRONG_PASSWORD };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
