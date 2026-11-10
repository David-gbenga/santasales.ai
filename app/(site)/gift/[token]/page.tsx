import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { loadGift } from "@/lib/gifts";
import { giftTokenSchema } from "@/lib/validation";
import { giftPhrase } from "@/lib/occasions";

export const metadata: Metadata = {
  title: "A gift for you",
  robots: { index: false, follow: false },
};

export default function GiftPage({ params }: PageProps<"/gift/[token]">) {
  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
        <Suspense fallback={<p className="text-lg text-ink-muted">Unwrapping…</p>}>
          <GiftContent params={params} />
        </Suspense>
      </div>
    </div>
  );
}

function sections(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((l) => l.trimEnd()))
    .filter((lines) => lines.some((l) => l.trim()))
    .map((lines) => {
      const m = lines[0].trim().match(/^\[(.{1,30})\]$/);
      return m ? { label: m[1], lines: lines.slice(1) } : { label: null, lines };
    });
}

async function GiftContent({ params }: Pick<PageProps<"/gift/[token]">, "params">) {
  const token = giftTokenSchema.safeParse((await params).token);
  if (!token.success) notFound();
  const gift = await loadGift(token.data);
  if (!gift) notFound();

  const what = giftPhrase(gift.occasion, gift.kind === "card" ? "card" : "song");

  return (
    <article>
      <p className="font-semibold text-berry">For {gift.recipientName}</p>
      <h1 className="mt-2 text-balance font-display text-4xl leading-tight sm:text-5xl">
        {gift.senderName ?? "Someone"} sent you {what}
      </h1>
      {gift.note && (
        <blockquote className="mt-6 border-l-4 border-ember pl-4 text-lg leading-relaxed text-ink">
          {gift.note}
        </blockquote>
      )}

      {gift.greetingAudioUrl && (
        <section
          aria-labelledby="greeting-title"
          className="mt-8 rounded-xl bg-white p-5 shadow-sm"
        >
          <h2 id="greeting-title" className="font-semibold">
            {gift.senderName ? `A voice message from ${gift.senderName}` : "A voice message for you"}
          </h2>
          <audio controls preload="none" src={gift.greetingAudioUrl} className="mt-3 w-full">
            Your browser can&rsquo;t play this audio.
          </audio>
        </section>
      )}

      {gift.cardImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed image
        <img
          src={gift.cardImageUrl}
          alt={`${what.replace(/^an? /, "")} for ${gift.recipientName}${gift.senderName ? ` from ${gift.senderName}` : ""}`}
          width={1500}
          height={2100}
          className="mt-8 w-full rounded-lg shadow-[0_12px_40px_rgb(19_35_63/0.25)]"
        />
      )}

      {gift.songAudioUrl && (
        <section aria-labelledby="song-title" className="mt-8 rounded-xl bg-night p-5 text-frost">
          <h2 id="song-title" className="font-display text-2xl">
            Press play: your song
          </h2>
          <audio controls preload="none" src={gift.songAudioUrl} className="mt-3 w-full">
            Your browser can&rsquo;t play this audio.
          </audio>
        </section>
      )}

      {gift.lyrics && (
        <section
          aria-labelledby="lyrics-title"
          className="mt-8 overflow-hidden rounded-lg bg-white shadow-[0_12px_40px_rgb(19_35_63/0.18)]"
        >
          <header className="bg-night px-6 py-6 text-frost sm:px-8">
            <h2 id="lyrics-title" className="text-balance font-display text-3xl">
              {gift.lyrics.title}
            </h2>
          </header>
          <div className="space-y-6 px-6 py-7 sm:px-8">
            {sections(gift.lyrics.body).map((s, i) => (
              <div key={i}>
                {s.label && <h3 className="text-sm font-semibold text-berry">{s.label}</h3>}
                <p className="mt-1 whitespace-pre-line font-display text-lg leading-relaxed">
                  {s.lines.join("\n")}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 border-t border-line-snow pt-6 text-ink-muted">
        Made with Giftpost.{" "}
        <Link href="/" className="font-semibold text-ink underline underline-offset-4">
          Make one for someone
        </Link>
      </p>
    </article>
  );
}
