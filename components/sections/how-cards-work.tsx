import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { cardSteps, displayPrices } from "@/lib/site";

export function HowCardsWork() {
  return (
    <section aria-labelledby="how-title" className="bg-night">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:py-28">
        <div>
          <h2 id="how-title" className="font-display text-4xl leading-tight text-frost sm:text-5xl">
            How a personal card gets made
          </h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-frost-muted">
            It takes about two minutes. Want a song instead? Lyrics work the same way, from{" "}
            {displayPrices.lyrics}.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/cards">Make a card</ButtonLink>
            <Link
              href="/lyrics"
              className="inline-flex min-h-12 items-center px-3 font-semibold text-frost underline decoration-ember decoration-2 underline-offset-[6px] hover:decoration-frost"
            >
              Write a song
            </Link>
          </div>
        </div>

        <ol className="space-y-0">
          {cardSteps.map((s, i) => (
            <li
              key={s.title}
              className="grid grid-cols-[3rem_1fr] gap-4 border-t border-line-night py-6 last:border-b"
            >
              <span aria-hidden="true" className="font-display text-3xl text-ember">
                {i + 1}
              </span>
              <div>
                <h3 className="text-xl font-semibold text-frost">{s.title}</h3>
                <p className="mt-1 leading-relaxed text-frost-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
