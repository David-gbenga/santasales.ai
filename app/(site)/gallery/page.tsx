import type { Metadata } from "next";
import Link from "next/link";
import { GalleryLink } from "@/components/ui/gallery-link";
import { getActiveGalleryItems, storeHost } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Gifts we'd buy ourselves, from other shops. Each one opens on the shop's own site.",
};

export default async function GalleryPage() {
  const items = await getActiveGalleryItems();
  const hasAffiliateLinks = items.some((item) => item.is_affiliate);

  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <h1 className="font-display text-5xl leading-tight sm:text-6xl">
          Gifts we&rsquo;d buy ourselves
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-muted">
          A short list of presents from other shops. Each one opens on the shop&rsquo;s own site in
          a new tab.
        </p>

        {hasAffiliateLinks && (
          <aside
            aria-label="Affiliate disclosure"
            className="mt-8 max-w-2xl rounded-md border border-line-snow bg-white px-5 py-4"
          >
            <p>
              <strong className="font-semibold">Some of these are affiliate links.</strong> If you
              buy through a link marked &ldquo;Affiliate link&rdquo;, we may earn a small
              commission. It costs you nothing extra and doesn&rsquo;t change which gifts we pick.{" "}
              <Link
                href="/disclosure"
                className="underline underline-offset-4 hover:text-ink-muted"
              >
                How affiliate links work
              </Link>
            </p>
          </aside>
        )}

        {items.length === 0 ? (
          <p className="mt-12 text-lg">The gallery is being restocked. Check back soon.</p>
        ) : (
          <ul className="mt-12 gap-8 [column-fill:_balance] sm:columns-2 lg:columns-3">
            {items.map((item) => (
              <li key={item.id} className="mb-8 break-inside-avoid">
                <GalleryLink
                  itemId={item.id}
                  href={item.target_url}
                  isAffiliate={item.is_affiliate}
                  className="group block rounded-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- images can be remote affiliate assets of unknown size */}
                  <img
                    src={item.image_url}
                    alt=""
                    loading="lazy"
                    className="w-full rounded-md bg-line-snow"
                  />
                  <span className="mt-3 flex items-baseline justify-between gap-3">
                    <span className="min-w-0 text-lg font-semibold group-hover:underline">
                      {item.title}
                    </span>
                    {item.is_affiliate && (
                      <span className="shrink-0 rounded-full border border-ink/25 px-2 py-0.5 text-xs font-medium text-ink-muted">
                        Affiliate link
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    Opens on {storeHost(item.target_url)}
                    <span className="sr-only"> (new tab)</span>
                  </span>
                </GalleryLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
