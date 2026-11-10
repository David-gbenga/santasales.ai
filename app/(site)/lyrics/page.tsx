import type { Metadata } from "next";
import { LyricsForm } from "@/components/ui/lyrics-form";
import { CARD_RELATIONSHIP_LABELS } from "@/lib/card-options";
import { formatPrice } from "@/lib/format";
import { LYRIC_LENGTH_LABELS, LYRIC_STYLE_LABELS } from "@/lib/lyrics-options";
import { MAX_REGENERATIONS, SONG_PRICE_BY_LENGTH } from "@/lib/pricing";
import { SONG_STYLES, VOCALS } from "@/lib/audio-options";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "A personal song for any occasion",
  description:
    "Birthday, anniversary, wedding, Valentine's, Mother's Day, Christmas and more: we write and sing an original song about them. Preview it free before you pay.",
};

export default function LyricsPage() {
  const lengthPrices = {
    short: formatPrice(SONG_PRICE_BY_LENGTH.short),
    standard: formatPrice(SONG_PRICE_BY_LENGTH.standard),
    long: formatPrice(SONG_PRICE_BY_LENGTH.long),
  };
  const musicStyles = Object.fromEntries(
    Object.entries(SONG_STYLES).map(([k, s]) => [k, { label: s.label, hint: s.hint }]),
  );
  const vocals = Object.fromEntries(Object.entries(VOCALS).map(([k, v]) => [k, v.label]));

  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
        <h1 className="text-balance font-display text-5xl leading-tight sm:text-6xl">
          A song written just for them, for any occasion
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          Birthdays, anniversaries, weddings, Valentine&rsquo;s, Mother&rsquo;s Day, Christmas and
          more. Tell us who it&rsquo;s for and what to sing about. We write original lyrics they&rsquo;ll
          recognise themselves in and let you hear a 15-second sung sample, free. Love it? Pay once,
          from {lengthPrices.short}, and we record the full song. You also get {MAX_REGENERATIONS}{" "}
          more rewrites, can edit any line, and download the MP3, a PDF to print and a text file.
        </p>
        <LyricsForm
          defaultOccasion={site.seasonalOccasion}
          lengthPrices={lengthPrices}
          musicStyles={musicStyles}
          vocals={vocals}
          relationships={CARD_RELATIONSHIP_LABELS}
          styles={LYRIC_STYLE_LABELS}
          lengths={LYRIC_LENGTH_LABELS}
        />
      </div>
    </div>
  );
}
