import { NextResponse } from "next/server";
import { DOWNLOAD_LINK_TTL_SECONDS, isWithinDownloadWindow } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { orderIdSchema } from "@/lib/validation";

type OrderWithFile = {
  status: string;
  kind: string;
  paid_at: string | null;
  product: { slug: string; file_path: string } | null;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Checks the order is paid, then redirects to a short-lived signed URL for the file. */
export async function GET(_request: Request, { params }: RouteContext<"/api/download/[orderId]">) {
  const parsedId = orderIdSchema.safeParse((await params).orderId);
  if (!parsedId.success) return errorResponse("That download link isn't valid.", 400);

  try {
    const db = createAdminClient();
    const { data: order, error } = await db
      .from("orders")
      .select("status, kind, paid_at, product:products(slug, file_path)")
      .eq("id", parsedId.data)
      .maybeSingle<OrderWithFile>();
    if (error) throw new Error(error.message);

    if (!order) return errorResponse("We couldn't find that order.", 404);
    if (order.status === "pending") {
      return errorResponse(
        "Your payment is still being confirmed. Go back and refresh in a few seconds.",
        409,
      );
    }
    if (order.status !== "paid")
      return errorResponse("This order was refunded, so the download is no longer available.", 403);
    if (!isWithinDownloadWindow(order.paid_at)) {
      return errorResponse(
        "Download links for this order expired 30 days after purchase. Contact us if you need help.",
        410,
      );
    }
    if (order.kind !== "product" || !order.product)
      return errorResponse("This order has no file to download.", 404);

    const extension = order.product.file_path.split(".").pop() ?? "pdf";
    const { data: signed, error: signError } = await db.storage
      .from("products")
      .createSignedUrl(order.product.file_path, DOWNLOAD_LINK_TTL_SECONDS, {
        download: `${order.product.slug}.${extension}`,
      });
    if (signError || !signed) throw new Error(signError?.message ?? "No signed URL returned");

    return NextResponse.redirect(signed.signedUrl, 303);
  } catch (err) {
    console.error("[download] failed", err);
    return errorResponse("The download couldn't start. Please try again in a minute.", 500);
  }
}
