import Link from "next/link";
import { nav, site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="relative z-20">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
        <Link
          href="/"
          translate="no"
          className="flex items-center gap-2 font-display text-2xl text-frost"
        >
          <SnowflakeMark />
          {site.name}
        </Link>
        <nav aria-label="Main">
          <ul className="flex flex-wrap gap-x-1 text-[0.95rem] font-medium sm:gap-x-2">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-frost-muted transition-colors hover:bg-night-raised hover:text-frost"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/account"
                className="inline-flex min-h-11 items-center rounded-full border border-frost-muted/40 px-3 text-frost transition-colors hover:border-frost"
              >
                My account
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

function SnowflakeMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="text-ember">
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" />
        <path d="M9.5 3.8L12 6l2.5-2.2M9.5 20.2L12 18l2.5 2.2" />
      </g>
    </svg>
  );
}
