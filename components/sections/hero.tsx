import Link from "next/link";
import { HeroArt } from "@/components/three/hero-art";
import { AiKitNote } from "@/components/ui/ai-kit-note";
import { ButtonLink } from "@/components/ui/button-link";
import { displayPrices, site } from "@/lib/site";

const textLink =
  "inline-flex min-h-12 items-center px-1 font-semibold text-frost underline decoration-ember decoration-2 underline-offset-[6px] hover:decoration-frost sm:px-3";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pb-16 pt-6 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pb-24 md:pt-10">
        <div className="relative z-10">
          <h1
            id="hero-title"
            className="max-w-[14ch] text-balance font-display text-[clamp(2.6rem,6.4vw,5.25rem)] leading-[1] tracking-[-0.01em] text-frost"
          >
            {site.headline}
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-frost sm:text-xl">
            It takes a little to be intentional.
            <br />
            It costs less to be kind.
          </p>
          <p className="mt-3 max-w-[34rem] leading-relaxed text-frost-muted">
            Cards from {displayPrices.card}, sung songs from {displayPrices.song}. Preview free, pay
            only if you love it.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="/cards">Make a card</ButtonLink>
            <ButtonLink href="/lyrics" variant="outline-night">
              Write a song
            </ButtonLink>
            <Link href="/shop" className={textLink}>
              Browse the shop
            </Link>
            <Link href="/gallery" className={textLink}>
              See the gallery
            </Link>
          </div>
          <AiKitNote tone="night" className="mt-6 max-w-[34rem]" />
        </div>

        {/* Fixed-size box so the art never shifts layout while the 3D scene loads. */}
        <div className="relative mx-auto aspect-square w-full max-w-[min(30rem,80vw)] md:max-w-none">
          <HeroArt />
        </div>
      </div>
    </section>
  );
}
