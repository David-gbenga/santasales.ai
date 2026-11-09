import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/env";
import { createPendingOrder } from "@/lib/orders";
import { AUTOMATIC_TAX_ENABLED, DIGITAL_CONSENT_TEXT, getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutRequestSchema } from "@/lib/validation";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Creates a Stripe Checkout Session. The price always comes from the database. */
export async function POST(request: Request) {
  const parsed = checkoutRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return errorResponse("That product couldn't be found. Refresh the page and try again.", 400);

  try {
    const { data: product, error } = await createAdminClient()
      .from("products")
      .select("id, slug, name, description, price_pence, currency, active")
      .eq("id", parsed.data.productId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product || !product.active) {
      return errorResponse(
        "This product isn't available any more. Head back to the shop to see what's in stock.",
        404,
      );
    }

    const origin = siteUrl(request);
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: product.currency,
            unit_amount: product.price_pence,
            product_data: { name: product.name, description: product.description || undefined },
          },
        },
      ],
      metadata: { kind: "product", product_id: product.id },
      automatic_tax: { enabled: AUTOMATIC_TAX_ENABLED },
      custom_text: { submit: { message: DIGITAL_CONSENT_TEXT } },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop/${product.slug}`,
    });
    if (!session.url) throw new Error("Stripe returned no checkout URL");

    await createPendingOrder({
      sessionId: session.id,
      productId: product.id,
      amountPence: product.price_pence,
      currency: product.currency,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] failed", err);
    return errorResponse("Checkout couldn't start. Please try again in a minute.", 500);
  }
}
