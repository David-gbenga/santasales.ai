import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GiftExtras } from "@/components/gift/gift-extras";
import { LyricsStudio } from "@/components/ui/lyrics-studio";
import { WaitForPayment } from "@/components/ui/wait-for-payment";
import { formatPrice } from "@/lib/format";
import { getLyricsGeneration, rewritesLeft } from "@/lib/generations";
import { FREE_PREVIEW_REROLLS, songPricePence } from "@/lib/pricing";
import { orderIdSchema } from "@/lib/validation";
import { creditLine, defaultGreeting } from "@/lib/occasions";

export const metadata: Metadata = {
  title: "Your song",
  robots: { index: false },
};

export default function LyricsStudioPage({ params, searchParams }: PageProps<"/lyrics/[generationId]">) {
  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <Suspense
          fallback={<h1 className="font-display text-4xl sm:text-5xl">Opening your song…</h1>}
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
}: Pick<PageProps<"/lyrics/[generationId]">, "params" | "searchParams">) {
  const id = orderIdSchema.safeParse((await params).generationId);
  if (!id.success) notFound();

  const generation = await getLyricsGeneration(id.data);
  if (!generation) notFound();
  const state = studioState(generation.order, (await searchParams).session_id);

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
        <p className="mt-4 text-lg text-ink-muted">The song is no longer available.</p>
      </>
    );
  }

  const paidOrderId = state === "paid" ? (generation.order?.id ?? null) : null;

  const studio = (
    <LyricsStudio
      generationId={generation.id}
      orderId={paidOrderId}
      paid={paidOrderId !== null}
      priceLabel={formatPrice(songPricePence(generation.input.length))}
      musicStyle={generation.input.musicStyle}
      vocal={generation.input.vocal}
      initialFreeRerollsLeft={Math.max(0, FREE_PREVIEW_REROLLS - generation.freeRerolls)}
      recipientName={generation.input.recipientName}
      senderName={generation.input.senderName}
      credit={creditLine("song", generation.input)}
      initialText={generation.text}
      initialRewritesLeft={rewritesLeft(generation.regenCount)}
      initialLocked={generation.locked}
    />
  );

  // Once the song is saved: send it, have it sung, add a voice greeting.
  return generation.locked && paidOrderId ? (
    <>
      {studio}
      <GiftExtras
        generationId={generation.id}
        orderId={paidOrderId}
        kind="lyrics"
        recipientName={generation.input.recipientName}
        senderName={generation.input.senderName}
        anonymous={generation.input.anonymous}
        occasion={generation.input.occasion}
        defaultGreeting={defaultGreeting("song", generation.input)}
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
