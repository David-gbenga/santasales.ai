import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";
import { trackEventSchema } from "@/lib/validation";

const MAX_BODY_BYTES = 4096;

/** Keeps only the referring site's origin: no paths or query strings (they can hold personal data). */
function referrerOrigin(referrer: string | undefined, siteHost: string): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (url.host === siteHost) return null; // internal navigation isn't a referral
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Logs a cookie-free analytics event. Uses the anon key: RLS lets the public
 * insert events and nothing else. Accepts sendBeacon bodies (any content type).
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Event too large" }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Event must be JSON" }, { status: 400 });
  }

  const parsed = trackEventSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const { type, path, refId, referrer } = parsed.data;
  const { error } = await createPublicClient()
    .from("events")
    .insert({
      type,
      path: path.split("?")[0], // drop query strings, e.g. Stripe session ids
      ref_id: refId ?? null,
      referrer: referrerOrigin(referrer, new URL(request.url).host),
    });

  if (error) {
    console.error("[track] insert failed", error.message);
    return NextResponse.json({ error: "Event not saved" }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
