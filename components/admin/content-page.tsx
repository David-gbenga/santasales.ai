import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Frame for the content pages: checks the admin (inside Suspense, since it
 * reads cookies), then renders the shell with a heading and optional action.
 */
export function ContentPage({
  section,
  children,
}: {
  section: "/admin/products" | "/admin/gallery" | "/admin/designs" | "/admin/bootcamp";
  children: () => Promise<ReactNode>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-ink-muted">Loading…</p>}>
      <Guarded section={section} render={children} />
    </Suspense>
  );
}

async function Guarded({
  section,
  render,
}: {
  section: "/admin/products" | "/admin/gallery" | "/admin/designs" | "/admin/bootcamp";
  render: () => Promise<ReactNode>;
}) {
  const admin = await requireAdmin();
  return (
    <AdminShell email={admin.email} current={section}>
      {await render()}
    </AdminShell>
  );
}

export function PageHeading({
  title,
  intro,
  action,
  back,
}: {
  title: string;
  intro?: string;
  action?: { href: string; label: string };
  back?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <Link href={back.href} className="text-sm font-semibold text-ink-muted underline underline-offset-4 hover:text-ink">
            ← {back.label}
          </Link>
        )}
        <h1 className="mt-1 font-display text-4xl">{title}</h1>
        {intro && <p className="mt-1 max-w-2xl text-ink-muted">{intro}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-semibold text-snow hover:bg-night-raised"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function SavedNotice({ name }: { name: string | string[] | undefined }) {
  if (typeof name !== "string" || !name) return null;
  return (
    <p role="status" className="mt-6 rounded-md border border-pine/40 bg-white px-4 py-3 font-medium text-pine">
      Saved “{name.slice(0, 120)}”. The public site shows the change within a minute.
    </p>
  );
}

export function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        active ? "bg-pine/15 text-pine" : "bg-ink/10 text-ink-muted"
      }`}
    >
      {active ? "Live" : "Hidden"}
    </span>
  );
}
