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

export async function signOut() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
