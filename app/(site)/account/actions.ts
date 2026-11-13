"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { logAccountEvent } from "@/lib/account";
import { siteUrl } from "@/lib/env";
import { ACCOUNT_LIMITS } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAuthClient } from "@/lib/supabase/auth";
import {
  accountEmailSchema,
  accountNextSchema,
  fullNameSchema,
  newPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation";
import { visitorKeyFromHeaders } from "@/lib/visitor";

/**
 * `values` echoes back what the person typed (never passwords): React resets
 * a form after its action runs, so the fields refill from these.
 */
export type FormState = {
  status: "idle" | "done" | "error";
  message: string;
  values?: { fullName?: string; email?: string };
};

const TOO_MANY = "Too many attempts from here today. Try again tomorrow, or email us for help.";

/** Per-visitor daily limit on account forms (on top of Supabase Auth's own limits). */
async function withinLimit(purpose: keyof typeof ACCOUNT_LIMITS): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("order_email_take", {
    p_key: visitorKeyFromHeaders(await headers(), `account:${purpose}`),
    p_limit: ACCOUNT_LIMITS[purpose],
  });
  if (error) {
    console.error("[account] rate limit check failed", error.message);
    return false;
  }
  return data === true;
}

/** The non-secret fields as typed, capped, for refilling the form. */
function typed(formData: FormData, ...names: ("fullName" | "email")[]): FormState["values"] {
  return Object.fromEntries(names.map((n) => [n, String(formData.get(n) ?? "").slice(0, 254)]));
}

const firstIssue = (issues: { message: string }[]) => issues[0]?.message ?? "Check the form.";

const CHECK_EMAIL =
  "Check your inbox for a link to confirm your email address. It can take a minute; look in spam too.";

/**
 * Registration with name, email and password. Supabase hashes the password
 * and sends the confirmation email. The reply is the same for a new and an
 * existing address, so the form can't be used to find out who has an account.
 */
export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: String(formData.get("email") ?? "").trim(),
    password: formData.get("password"),
  });
  const values = typed(formData, "fullName", "email");
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error.issues), values };
  if (formData.get("terms") !== "on")
    return { status: "error", message: "Tick the box to agree to the terms and privacy notice.", values };
  if (!(await withinLimit("signUp"))) return { status: "error", message: TOO_MANY, values };

  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/account`,
    },
  });
  if (error) {
    console.error("[account] sign-up failed", error.status, error.code);
    if (error.code === "weak_password")
      return { status: "error", message: "Choose a stronger password: longer, and not a common one.", values };
    if (error.status === 429)
      return { status: "error", message: "We're sending a lot of emails right now. Try again in a few minutes.", values };
    return { status: "error", message: "Your account couldn't be created. Try again in a minute.", values };
  }
  // Without email confirmation switched on, Supabase signs the user straight in.
  if (data.session) redirect("/account");
  return { status: "done", message: CHECK_EMAIL };
}

const WRONG_LOGIN = "That email and password don't match an account.";

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: formData.get("password"),
  });
  const values = typed(formData, "email");
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error.issues), values };
  if (!(await withinLimit("signIn"))) return { status: "error", message: TOO_MANY, values };

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      await supabase.auth.resend({
        type: "signup",
        email: parsed.data.email,
        options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=/account` },
      });
      return {
        status: "error",
        message: "Confirm your email address first. We've sent you a new link.",
        values,
      };
    }
    if (error.status === 429)
      return { status: "error", message: "Too many attempts. Wait a few minutes, then try again.", values };
    return { status: "error", message: WRONG_LOGIN, values };
  }
  redirect(accountNextSchema.parse(formData.get("next")));
}

/** Always the same reply, so the form doesn't reveal which emails have accounts. */
export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = accountEmailSchema.safeParse(String(formData.get("email") ?? "").trim());
  const values = typed(formData, "email");
  if (!email.success) return { status: "error", message: "Enter a valid email address.", values };
  if (!(await withinLimit("passwordReset"))) return { status: "error", message: TOO_MANY, values };

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${siteUrl()}/auth/callback?next=/account/password`,
  });
  if (error) console.error("[account] reset email failed", error.status, error.code);
  return {
    status: "done",
    message: "If that address has an account, a link to choose a new password is on its way. It expires in an hour.",
  };
}

/** New password for the signed-in user (also the last step of a reset link). */
export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = newPasswordSchema.safeParse(formData.get("password"));
  if (!password.success) return { status: "error", message: firstIssue(password.error.issues) };
  if (formData.get("confirm") !== formData.get("password"))
    return { status: "error", message: "The two passwords don't match." };

  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { status: "error", message: "Your link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) {
    if (error.code === "same_password")
      return { status: "error", message: "Choose a password you haven't used here before." };
    if (error.code === "weak_password")
      return { status: "error", message: "Choose a stronger password: longer, and not a common one." };
    console.error("[account] password update failed", error.status, error.code);
    return { status: "error", message: "Your password couldn't be changed. Try again in a minute." };
  }
  await logAccountEvent(data.user.id, "profile_updated", { field: "password" });
  redirect("/account?updated=password");
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = fullNameSchema.safeParse(formData.get("fullName"));
  if (!name.success) return { status: "error", message: firstIssue(name.error.issues) };

  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { status: "error", message: "You've been signed out. Sign in again." };

  const { error } = await createAdminClient()
    .from("profiles")
    .upsert({ user_id: data.user.id, full_name: name.data, updated_at: new Date().toISOString() });
  if (error) {
    console.error("[account] profile update failed", error.message);
    return { status: "error", message: "Your name couldn't be saved. Try again in a minute." };
  }
  await logAccountEvent(data.user.id, "profile_updated", { field: "full_name" });
  return { status: "done", message: "Saved." };
}

export async function signOutCustomer() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/");
}
