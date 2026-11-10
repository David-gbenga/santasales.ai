import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GiftExtras } from "@/components/gift/gift-extras";
import { CardStudio } from "@/components/ui/card-studio";
import { WaitForPayment } from "@/components/ui/wait-for-payment";
import { getCardDesign } from "@/lib/card-designs";
import { formatPrice } from "@/lib/format";
import { getCardGeneration, rewritesLeft } from "@/lib/generations";
import { mediaUrl } from "@/lib/media";
import { CARD_PRICE_PENCE, FREE_PREVIEW_REROLLS } from "@/lib/pricing";
import { orderIdSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Your card",
  robots: { index: false },
};

export default function CardStudioPage({ params, searchParams }: PageProps<"/cards/[generationId]">) {
  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <Suspense
          fallback={<h1 className="font-display text-4xl sm:text-5xl">Opening your card…</h1>}
        >
          <Studio params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Studio({
  params,
  searchParams,
}: Pick<PageProps<"/cards/[generationId]">, "params" | "searchParams">) {
  const id = orderIdSchema.safeParse((await params).generationId);
  if (!id.success) notFound();

  const generation = await getCardGeneration(id.data);
  if (!generation) notFound();
  const state = studioState(generation.order, (await searchParams).session_id);

  const recipient = generation.input.recipientName;

  if (state === "confirming") {
    return (
      <>
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">
          Confirming your payment…
        </h1>
        <WaitForPayment />
      </>
    );
  }
  if (state === "refunded") {
    return (
      <>
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">This order was refunded</h1>
        <p className="mt-4 text-lg text-ink-muted">The card is no longer available.</p>
      </>
    );
  }

  const design = await getCardDesign(generation.designSlug, { includeInactive: true });
  if (!design) notFound();

  const paidOrderId = state === "paid" ? (generation.order?.id ?? null) : null;

  const studio = (
    <CardStudio
      generationId={generation.id}
      orderId={paidOrderId}
      paid={paidOrderId !== null}
      priceLabel={formatPrice(CARD_PRICE_PENCE)}
      initialFreeRerollsLeft={Math.max(0, FREE_PREVIEW_REROLLS - generation.freeRerolls)}
      recipientName={recipient}
      senderName={generation.input.senderName}
      design={{
        name: design.name,
        imageUrl: mediaUrl(design.backgroundPath),
        layout: design.layout,
      }}
      initialText={generation.text}
      initialRewritesLeft={rewritesLeft(generation.regenCount)}
      initialLocked={generation.locked}
    />
  );

  // Once the card is finished: send it, and optionally add a voice greeting.
  return generation.locked && paidOrderId ? (
    <>
      {studio}
      <GiftExtras
        generationId={generation.id}
        orderId={paidOrderId}
        kind="card"
        recipientName={recipient}
        senderName={generation.input.senderName}
        defaultGreeting={`Merry Christmas, ${recipient}! I hope you love your card. Lots of love, ${generation.input.senderName}.`}
      />
    </>
  ) : (
    studio
  );
}

/**
 * What the studio shows. Payment state comes only from the order the Stripe
 * webhook marks paid. A pending order with a session_id means the buyer has
 * just come back from Checkout; without one it's an abandoned checkout, so the
 * free preview carries on.
 */
function studioState(
  order: { status: "pending" | "paid" | "refunded" } | null,
  sessionId: string | string[] | undefined,
): "preview" | "confirming" | "paid" | "refunded" {
  if (order?.status === "paid") return "paid";
  if (order?.status === "refunded") return "refunded";
  if (order?.status === "pending" && typeof sessionId === "string") return "confirming";
  return "preview";
}
