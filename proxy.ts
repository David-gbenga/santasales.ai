import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps Supabase session cookies fresh on /admin, /account and /auth
 * requests (Server Components can't write cookies). This is only an
 * optimistic gate: every admin page and route still calls requireAdmin(),
 * and account pages call requireCustomer().
 */
export async function proxy(request: NextRequest) {
  // Supabase sends a failed or expired email link back to the Site URL with
  // ?error_code=…; show the sign-in page with a clear message.
  if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("error_code")) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "?error=link-expired";
    return NextResponse.redirect(login);
  }

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  if (!data.user && path.startsWith("/account")) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(login);
  }
  if (!data.user && path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = "";
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/auth/:path*",
    "/account/:path*",
    "/premium",
    // Only the home page with a Supabase auth error, so normal visits skip the proxy.
    { source: "/", has: [{ type: "query", key: "error_code" }] },
  ],
};
