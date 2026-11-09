import "server-only";

/**
 * Reads a required server environment variable. Throws a clear message
 * (logged server-side only) instead of failing later with "undefined".
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new Error(
      `Missing environment variable ${name}. Set it in .env.local (or .env) and in Vercel.`,
    );
  return value;
}

/** Absolute site origin for links sent to Stripe, without a trailing slash. */
export function siteUrl(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (request) return new URL(request.url).origin;
  return "http://localhost:3000";
}
