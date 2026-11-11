import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bootcampRegistrationSchema } from "@/lib/validation";
import { visitorKey } from "@/lib/visitor";

/** Sign-ups allowed per visitor per day. */
const SIGNUPS_PER_VISITOR_PER_DAY = 5;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Registers someone for the free AI engineering bootcamp. Signing up twice
 * with the same email is treated as success, so the response never reveals
 * whether an address is already on the list.
 */
export async function POST(request: Request) {
  const parsed = bootcampRegistrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("Check the form: name, a valid email, your experience and the consent box are needed.", 400);
  }
  const { name, email, experience, goal, website } = parsed.data;
  if (website) return NextResponse.json({ ok: true }); // bot filled the honeypot; pretend it worked

  try {
    const db = createAdminClient();
    // Reuses the generic per-key daily counter from the order-emails migration.
    const { data: allowed, error: limitError } = await db.rpc("order_email_take", {
      p_key: visitorKey(request, "bootcamp"),
      p_limit: SIGNUPS_PER_VISITOR_PER_DAY,
    });
    if (limitError) throw new Error(limitError.message);
    if (allowed !== true) return errorResponse("Too many sign-ups from here today. Try again tomorrow.", 429);

    const { error } = await db
      .from("bootcamp_registrations")
      .insert({ name, email, experience, goal: goal || null });
    // 23505 = already registered (unique email): fine, same answer.
    if (error && error.code !== "23505") throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[bootcamp] sign-up failed", err);
    return errorResponse("Something went wrong on our side. Try again in a minute.", 500);
  }
}
