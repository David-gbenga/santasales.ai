import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CardStudio } from "@/components/ui/card-studio";
import { WaitForPayment } from "@/components/ui/wait-for-payment";
import { getCardDesign } from "@/lib/card-designs";
import { getCardGeneration, rewritesLeft } from "@/lib/generations";
import { mediaUrl } from "@/lib/media";
import { orderIdSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Your card",
  robots: { index: false },
};

export default function CardStudioPage({ params }: PageProps<"/cards/[generationId]">) {
  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <Suspense
          fallback={<h1 className="font-display text-4xl sm:text-5xl">Opening your card…</h1>}
        >
          <Studio params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function Studio({ params }: Pick<PageProps<"/cards/[generationId]">, "params">) {
  const id = orderIdSchema.safeParse((await params).generationId);
  if (!id.success) notFound();

  const generation = await getCardGeneration(id.data);
  if (!generation || !generation.order) notFound();

  const recipient = generation.input.recipientName;

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
        <p className="mt-4 text-lg text-ink-muted">The card is no longer available.</p>
      </>
    );
  }

  const design = await getCardDesign(generation.designSlug, { includeInactive: true });
  if (!design) notFound();

  return (
    <CardStudio
      generationId={generation.id}
      orderId={generation.order.id}
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
}
