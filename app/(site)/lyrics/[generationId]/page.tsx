import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LyricsStudio } from "@/components/ui/lyrics-studio";
import { WaitForPayment } from "@/components/ui/wait-for-payment";
import { getLyricsGeneration, rewritesLeft } from "@/lib/generations";
import { orderIdSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Your song",
  robots: { index: false },
};

export default function LyricsStudioPage({ params }: PageProps<"/lyrics/[generationId]">) {
  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <Suspense
          fallback={<h1 className="font-display text-4xl sm:text-5xl">Opening your song…</h1>}
        >
          <Studio params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function Studio({ params }: Pick<PageProps<"/lyrics/[generationId]">, "params">) {
  const id = orderIdSchema.safeParse((await params).generationId);
  if (!id.success) notFound();

  const generation = await getLyricsGeneration(id.data);
  if (!generation || !generation.order) notFound();

  if (generation.order.status === "pending") {
    return (
      <>
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">
          Confirming your payment…
        </h1>
        <WaitForPayment />
      </>
    );
  }
  if (generation.order.status === "refunded") {
    return (
      <>
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">This order was refunded</h1>
        <p className="mt-4 text-lg text-ink-muted">The song is no longer available.</p>
      </>
    );
  }

  return (
    <LyricsStudio
      generationId={generation.id}
      orderId={generation.order.id}
      recipientName={generation.input.recipientName}
      senderName={generation.input.senderName}
      initialText={generation.text}
      initialRewritesLeft={rewritesLeft(generation.regenCount)}
      initialLocked={generation.locked}
    />
  );
}
