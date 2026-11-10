import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireEnv } from "@/lib/env";

/**
 * Cookie-aware anon client for admin sign-in (magic link). Server
 * Components can't write cookies, so writes there are ignored; proxy.ts
 * refreshes the session on every /admin request instead.
 */
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
          } catch {
            // Called from a Server Component: proxy.ts keeps the session fresh.
          }
        },
      },
    },
  );
}
