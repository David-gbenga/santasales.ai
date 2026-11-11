import { NextResponse } from "next/server";
import { AI_KIT } from "@/lib/ai-kit";
import { DOWNLOAD_LINK_TTL_SECONDS, isWithinDownloadWindow } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { orderIdSchema } from "@/lib/validation";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * The free AI Builder Kit that comes with any paid order: checks the order is
 * paid and recent, then redirects to a short-lived signed URL for the PDF.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/kit/[orderId]">) {
  if (!AI_KIT.enabled) return errorResponse("This offer has ended.", 410);
  const parsedId = orderIdSchema.safeParse((await params).orderId);
  if (!parsedId.success) return errorResponse("That link isn't valid.", 400);

  try {
    const db = createAdminClient();
    const { data: order, error } = await db
      .from("orders")
      .select("status, paid_at")
      .eq("id", parsedId.data)
      .maybeSingle<{ status: string; paid_at: string | null }>();
    if (error) throw new Error(error.message);

    if (!order) return errorResponse("We couldn't find that order.", 404);
    if (order.status === "pending")
      return errorResponse("Your payment is still being confirmed. Try again in a few seconds.", 409);
    if (order.status !== "paid")
      return errorResponse("This order was refunded, so the kit is no longer available.", 403);
    if (!isWithinDownloadWindow(order.paid_at))
      return errorResponse("This link expired 30 days after purchase. Contact us if you need help.", 410);

    const { data: signed, error: signError } = await db.storage
      .from(AI_KIT.bucket)
      .createSignedUrl(AI_KIT.path, DOWNLOAD_LINK_TTL_SECONDS, { download: AI_KIT.filename });
    if (signError || !signed) throw new Error(signError?.message ?? "No signed URL returned");

    return NextResponse.redirect(signed.signedUrl, 303);
  } catch (err) {
    console.error("[kit] failed", err);
    return errorResponse("The download couldn't start. Please try again in a minute.", 500);
  }
}
