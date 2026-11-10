import type { Metadata } from "next";
import { CardForm } from "@/components/ui/card-form";
import { getActiveCardDesigns } from "@/lib/card-designs";
import { formatPrice } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { CARD_PRICE_PENCE, MAX_REGENERATIONS } from "@/lib/pricing";
import { CARD_RELATIONSHIP_LABELS, CARD_TONE_LABELS } from "@/lib/card-options";

export const metadata: Metadata = {
  title: "Make a personal Christmas card",
  description:
    "Pick a design, tell us who it's for, and we'll write their Christmas card message. Download a print-ready PNG and PDF.",
};

export default async function CardsPage() {
  const designs = await getActiveCardDesigns();
  const price = formatPrice(CARD_PRICE_PENCE);

  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <h1 className="max-w-3xl text-balance font-display text-5xl leading-tight sm:text-6xl">
          Make a Christmas card that sounds like you
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
          Pick a design and tell us about the person it&rsquo;s for. After you pay {price}, we write
          the message for them. Not quite right? You get {MAX_REGENERATIONS} rewrites, and you can
          edit the words yourself before downloading.
        </p>

        {designs.length === 0 ? (
          <p className="mt-12 text-lg">
            Card designs are being updated. Check back in a few minutes.
          </p>
        ) : (
          <CardForm
            designs={designs.map((d) => ({
              slug: d.slug,
              name: d.name,
              imageUrl: mediaUrl(d.backgroundPath),
            }))}
            priceLabel={price}
            relationships={CARD_RELATIONSHIP_LABELS}
            tones={CARD_TONE_LABELS}
          />
        )}
      </div>
    </div>
  );
}
