import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

let publicClient: SupabaseClient | undefined;

/**
 * Anon-key client with no cookies, for public data (active products,
 * gallery items). RLS limits it to what any visitor may see, and because it
 * doesn't read cookies its results can be cached with "use cache".
 *
 * The cookie-aware @supabase/ssr client for admin sign-in arrives in Phase 6.
 */
export function createPublicClient(): SupabaseClient {
  publicClient ??= createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return publicClient;
}
