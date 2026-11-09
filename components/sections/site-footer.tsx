import Link from "next/link";
import { legalLinks, nav, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-night-deep text-frost-muted">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl text-frost">{site.name}</p>
          <p className="mt-3 max-w-xs leading-relaxed">{site.description}</p>
        </div>
        <FooterList title="Make and shop" links={nav} />
        <FooterList title="The small print" links={legalLinks} />
      </div>
      <div className="border-t border-line-night">
        <p className="mx-auto max-w-6xl px-4 py-6 text-sm sm:px-6">
          © {site.copyrightYear} {site.name}. Some gallery links earn us a commission.
        </p>
      </div>
    </footer>
  );
}

function FooterList({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <nav aria-label={title}>
      <h2 className="font-semibold text-frost">{title}</h2>
      <ul className="mt-3 space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-10 items-center hover:text-frost hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
