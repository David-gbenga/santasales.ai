import Link from "next/link";
import type { ReactNode } from "react";
import { legalLinks, seller, sellerDetailsMissing } from "@/lib/site";

/** Frame for the legal pages: readable column, "last updated", links to the others. */
export function LegalPage({
  title,
  intro,
  path,
  children,
}: {
  title: string;
  intro: string;
  path: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-snow text-ink">
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
        {sellerDetailsMissing && (
          <p role="note" className="mb-8 rounded-md border border-berry/50 bg-white px-4 py-3 font-medium text-berry">
            Draft: the seller&rsquo;s name and contact details still need filling in (lib/site.ts).
          </p>
        )}
        <h1 className="text-balance font-display text-5xl leading-tight">{title}</h1>
        <p className="mt-3 text-sm text-ink-muted">Last updated {seller.lastUpdated}</p>
        <p className="mt-6 text-lg leading-relaxed text-ink-muted">{intro}</p>
        <div className="legal mt-10 space-y-10">{children}</div>
        <nav aria-label="Other policies" className="mt-14 border-t border-line-snow pt-6">
          <p className="font-semibold">Other policies</p>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
            {legalLinks
              .filter((l) => l.href !== path)
              .map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-10 items-center underline underline-offset-4">
                    {l.label}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </article>
    </div>
  );
}

/** A numbered section with a heading anchor. */
export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4 leading-relaxed">
      <h2 id={id} className="scroll-mt-6 font-display text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6 marker:text-ink-muted">{children}</ul>;
}

/** The seller's contact block, used on every page. */
export function SellerDetails() {
  return (
    <address className="not-italic">
      {seller.legalName}
      <br />
      {seller.address}
      <br />
      Email:{" "}
      {seller.email.startsWith("[") ? (
        seller.email
      ) : (
        <a href={`mailto:${seller.email}`} className="underline underline-offset-4">
          {seller.email}
        </a>
      )}
    </address>
  );
}
