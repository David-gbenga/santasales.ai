import Link from "next/link";
import { signOut } from "@/app/admin/auth-actions";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/designs", label: "Card designs" },
  { href: "/admin/bootcamp", label: "Bootcamp" },
] as const;

/** Header and frame for signed-in admin pages. */
export function AdminShell({
  email,
  current,
  children,
}: {
  email: string;
  current: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-snow text-ink">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="bg-night text-frost">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-display text-xl">
              Giftpost admin
            </Link>
            <nav aria-label="Admin">
              <ul className="flex flex-wrap gap-1 text-sm font-medium">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={current === item.href ? "page" : undefined}
                      className="inline-flex min-h-10 items-center rounded-full px-3 text-frost-muted hover:bg-night-raised hover:text-frost aria-[current=page]:bg-night-raised aria-[current=page]:text-frost"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <form action={signOut} className="flex items-center gap-3 text-sm text-frost-muted">
            <span className="hidden sm:inline">{email}</span>
            <button
              type="submit"
              className="min-h-10 rounded-full border border-line-night px-3 hover:border-frost-muted hover:text-frost"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-10">
        {children}
      </main>
    </div>
  );
}
