import "server-only";
import { createHmac } from "node:crypto";
import { requireEnv } from "@/lib/env";
import { PREVIEW_LIMITS } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Keyed hash of the visitor's IP that changes daily: enough to rate-limit,
 * useless to identify anyone. No raw IPs are stored.
 */
export function visitorKey(request: Request, purpose: string): string {
  return visitorKeyFromHeaders(request.headers, purpose);
}

/** visitorKey for Server Actions, which get headers() rather than a Request. */
export function visitorKeyFromHeaders(headers: Headers, purpose: string): string {
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown";
  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", requireEnv("SUPABASE_SERVICE_ROLE_KEY"))
    .update(`${purpose}:${day}:${ip}`)
    .digest("hex");
}

/** Counts one free preview; false once the visitor or the whole site is over today's limit. */
export async function takePreview(request: Request): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("preview_take", {
    p_key: visitorKey(request, "preview"),
    p_visitor_limit: PREVIEW_LIMITS.visitorPerDay,
    p_global_limit: PREVIEW_LIMITS.globalPerDay,
  });
  if (error) throw new Error(`Preview limit check failed: ${error.message}`);
  return data === true;
}
