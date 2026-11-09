import Link from "next/link";
import { HeroArt } from "@/components/three/hero-art";
import { ButtonLink } from "@/components/ui/button-link";
import { displayPrices } from "@/lib/site";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pb-16 pt-6 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pb-24 md:pt-10">
        <div className="relative z-10">
          <h1
            id="hero-title"
            className="max-w-[11ch] text-balance font-display text-[clamp(2.9rem,7.2vw,5.75rem)] leading-[0.98] tracking-[-0.01em] text-frost"
          >
            Christmas words, written for one person.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-frost-muted sm:text-xl">
            Tell us who it&rsquo;s for and we&rsquo;ll write their card message or a short song
            about them. Cards from {displayPrices.card}, lyrics from {displayPrices.lyrics}, and
            printables you can download tonight.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="/cards">Make a card</ButtonLink>
            <ButtonLink href="/shop" variant="outline-night">
              Browse the shop
            </ButtonLink>
            <Link
              href="/gallery"
              className="inline-flex min-h-12 items-center px-1 font-semibold sm:px-3 text-frost underline decoration-ember decoration-2 underline-offset-[6px] hover:decoration-frost"
            >
              See the gallery
            </Link>
          </div>
        </div>

        {/* Fixed-size box so the art never shifts layout while the 3D scene loads. */}
        <div className="relative mx-auto aspect-square w-full max-w-[min(30rem,80vw)] md:max-w-none">
          <HeroArt />
        </div>
      </div>
    </section>
  );
}
