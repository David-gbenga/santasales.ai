import type { Metadata } from "next";
import { LyricsForm } from "@/components/ui/lyrics-form";
import { CARD_RELATIONSHIP_LABELS } from "@/lib/card-options";
import { formatPrice } from "@/lib/format";
import { LYRIC_LENGTH_LABELS, LYRIC_STYLE_LABELS } from "@/lib/lyrics-options";
import { LYRICS_PRICE_PENCE, MAX_REGENERATIONS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Write a personal Christmas song",
  description:
    "Tell us who it's for and we'll write original Christmas song lyrics about them. Download as PDF and TXT.",
};

export default function LyricsPage() {
  const price = formatPrice(LYRICS_PRICE_PENCE);

  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
        <h1 className="text-balance font-display text-5xl leading-tight sm:text-6xl">
          A Christmas song written about them
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          Tell us who it&rsquo;s for and what to sing about. After you pay {price}, we write
          original lyrics with verses and a chorus they&rsquo;ll recognise themselves in. You get{" "}
          {MAX_REGENERATIONS} rewrites, can edit any line, then download the song as a PDF to print
          and a text file to share.
        </p>
        <LyricsForm
          priceLabel={price}
          relationships={CARD_RELATIONSHIP_LABELS}
          styles={LYRIC_STYLE_LABELS}
          lengths={LYRIC_LENGTH_LABELS}
        />
      </div>
    </div>
  );
}
