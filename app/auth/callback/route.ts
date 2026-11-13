import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-auth";
import { ensureProfile } from "@/lib/account";
import { createAuthClient } from "@/lib/supabase/auth";
import { accountNextSchema } from "@/lib/validation";

/**
 * Only known same-site paths are allowed as a destination (no open
 * redirects): /admin pages for admins, account pages for customers.
 */
function safeNext(next: string | null): string {
  if (next && /^\/admin(\/[\w/-]*)?$/.test(next)) return next;
  return accountNextSchema.parse(next);
}

/**
 * Where the magic link lands. Supports both Supabase link styles:
 * `?code=` (PKCE) and `?token_hash=&type=` (email template / generated links).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(url.searchParams.get("next"));
  const forAdmin = next.startsWith("/admin");
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`${forAdmin ? "/admin/login" : "/login"}?error=${reason}`, url.origin));

  const supabase = await createAuthClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing code") };
  if (error) return fail("link-expired");

  const { data } = await supabase.auth.getUser();
  if (!data.user) return fail("link-expired");
  if (!forAdmin) {
    // Customer: confirmation or password-reset link.
    await ensureProfile(data.user).catch((err) => console.error("[auth] profile setup failed", err));
    return NextResponse.redirect(new URL(next, url.origin));
  }
  if (!isAdminEmail(data.user.email)) {
    await supabase.auth.signOut();
    return fail("not-allowed");
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
