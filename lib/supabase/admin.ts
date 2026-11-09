import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

let admin: SupabaseClient | undefined;

/**
 * Service-role client: bypasses RLS. Server routes only — never import
 * this from a client component. Used for orders, generations and files.
 */
export function createAdminClient(): SupabaseClient {
  admin ??= createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  return admin;
}
