import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { featuredPlaceholders } from "@/lib/site";

const swatches = {
  berry: "bg-berry",
  pine: "bg-pine",
  ember: "bg-ember",
} as const;

/** Phase 1 shows placeholder products; Phase 2 swaps in active products from Supabase. */
export function FeaturedProducts() {
  return (
    <section aria-labelledby="featured-title" className="bg-snow text-ink">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="featured-title" className="font-display text-4xl leading-tight sm:text-5xl">
              Printables to download tonight
            </h2>
            <p className="mt-3 max-w-xl text-lg text-ink-muted">
              Pay, download, print at home. Files arrive the moment you check out.
            </p>
          </div>
          <ButtonLink href="/shop" variant="outline-snow">
            See everything in the shop
          </ButtonLink>
        </div>

        <ul className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {featuredPlaceholders.map((item) => (
            <li key={item.name}>
              <Link href="/shop" className="group block rounded-lg">
                <div
                  aria-hidden="true"
                  className={`aspect-[4/5] rounded-md ${swatches[item.swatch]} relative overflow-hidden`}
                >
                  <div className="absolute inset-6 rounded-sm border border-white/40" />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <h3 className="text-xl font-semibold group-hover:underline">{item.name}</h3>
                  <span className="shrink-0 font-semibold">{item.price}</span>
                </div>
                <p className="mt-1 text-ink-muted">{item.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
