import "server-only";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/auth";

/** Emails allowed into /admin, from ADMIN_EMAILS (comma-separated). */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email) && adminEmails().includes(email!.trim().toLowerCase());
}

export type AdminUser = { id: string; email: string };

/**
 * The signed-in admin, verified with Supabase Auth (getUser checks the
 * token with the server, unlike getSession). Redirects to sign-in when
 * signed out, and to a "not allowed" page for anyone not on the list.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) redirect("/admin/login");
  if (!isAdminEmail(user.email)) redirect("/admin/login?error=not-allowed");
  return { id: user.id, email: user.email };
}

/** Same check for Route Handlers and Server Actions: returns null instead of redirecting. */
export async function currentAdmin(): Promise<AdminUser | null> {
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  return user?.email && isAdminEmail(user.email) ? { id: user.id, email: user.email } : null;
}
