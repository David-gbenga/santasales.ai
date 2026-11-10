import type { Metadata } from "next";
import { CardForm } from "@/components/ui/card-form";
import { getActiveCardDesigns } from "@/lib/card-designs";
import { formatPrice } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { CARD_PRICE_PENCE, MAX_REGENERATIONS } from "@/lib/pricing";
import { CARD_RELATIONSHIP_LABELS, CARD_TONE_LABELS } from "@/lib/card-options";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Make a personal card for any occasion",
  description:
    "Birthday, anniversary, wedding, Valentine's, Mother's Day, Christmas and more: pick a design, tell us who it's for, and we'll write their card. Preview free.",
};

export default async function CardsPage() {
  const designs = await getActiveCardDesigns();
  const price = formatPrice(CARD_PRICE_PENCE);

  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <h1 className="max-w-3xl text-balance font-display text-5xl leading-tight sm:text-6xl">
          A card for every occasion, in words that sound like you
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
          Birthdays, anniversaries, weddings, Valentine&rsquo;s, Mother&rsquo;s Day, Christmas and
          more. Pick the occasion and a design, tell us about the person it&rsquo;s for, and we write
          the message and show you the finished card, free. Love it? Pay {price} to download it, with {MAX_REGENERATIONS}{" "}
          more rewrites and the option to edit the words yourself.
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
              occasions: d.occasions,
            }))}
            defaultOccasion={site.seasonalOccasion}
            priceLabel={price}
            relationships={CARD_RELATIONSHIP_LABELS}
            tones={CARD_TONE_LABELS}
          />
        )}
      </div>
    </div>
  );
}
