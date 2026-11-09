import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";

export function GalleryTeaser() {
  return (
    <section aria-labelledby="gallery-title" className="bg-snow text-ink">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
        <div className="max-w-2xl">
          <h2 id="gallery-title" className="font-display text-4xl leading-tight sm:text-5xl">
            Gifts we&rsquo;d buy ourselves
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            A short, picked-by-hand list of presents from other shops. Each one opens on the
            shop&rsquo;s own site.
          </p>
          <div className="mt-8">
            <ButtonLink href="/gallery" variant="outline-snow">
              See the gallery
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm text-ink-muted">
            Some links earn us a small commission at no extra cost to you.{" "}
            <Link href="/disclosure" className="underline underline-offset-4 hover:text-ink">
              How affiliate links work
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
