import { NextResponse } from "next/server";
import { z } from "zod";
import { DOWNLOAD_LINK_TTL_SECONDS, isWithinDownloadWindow } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { orderIdSchema } from "@/lib/validation";

type OrderWithFiles = {
  status: string;
  kind: "product" | "card" | "lyrics";
  paid_at: string | null;
  product: { slug: string; file_path: string } | null;
  generation: { locked: boolean; png_path: string | null; pdf_path: string | null } | null;
};

/** ?format=png|pdf picks the card file; ?view=1 shows it inline instead of downloading. */
const querySchema = z.object({
  format: z.enum(["png", "pdf"]).default("pdf"),
  view: z.enum(["1"]).optional(),
});

type FileRef = { bucket: string; path: string; filename: string };

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function fileForOrder(order: OrderWithFiles, format: "png" | "pdf"): FileRef | string {
  if (order.kind === "product") {
    if (!order.product) return "This order has no file to download.";
    const extension = order.product.file_path.split(".").pop() ?? "pdf";
    return {
      bucket: "products",
      path: order.product.file_path,
      filename: `${order.product.slug}.${extension}`,
    };
  }
  if (order.kind === "card") {
    const path = format === "png" ? order.generation?.png_path : order.generation?.pdf_path;
    if (!order.generation?.locked || !path) {
      return "Your card isn't finished yet. Go back to the card page and press Create my card.";
    }
    return { bucket: "generated", path, filename: `christmas-card.${format}` };
  }
  return "This order has no file to download yet.";
}

/** Checks the order is paid, then redirects to a short-lived signed URL for the file. */
export async function GET(request: Request, { params }: RouteContext<"/api/download/[orderId]">) {
  const parsedId = orderIdSchema.safeParse((await params).orderId);
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsedId.success || !query.success)
    return errorResponse("That download link isn't valid.", 400);

  try {
    const db = createAdminClient();
    const { data: order, error } = await db
      .from("orders")
      .select(
        "status, kind, paid_at, product:products(slug, file_path), generation:generations(locked, png_path, pdf_path)",
      )
      .eq("id", parsedId.data)
      .maybeSingle<OrderWithFiles>();
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

    const file = fileForOrder(order, query.data.format);
    if (typeof file === "string") return errorResponse(file, 404);

    const { data: signed, error: signError } = await db.storage
      .from(file.bucket)
      .createSignedUrl(
        file.path,
        DOWNLOAD_LINK_TTL_SECONDS,
        query.data.view ? undefined : { download: file.filename },
      );
    if (signError || !signed) throw new Error(signError?.message ?? "No signed URL returned");

    return NextResponse.redirect(signed.signedUrl, 303);
  } catch (err) {
    console.error("[download] failed", err);
    return errorResponse("The download couldn't start. Please try again in a minute.", 500);
  }
}
