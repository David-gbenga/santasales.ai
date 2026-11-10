import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, PageHeading, SavedNotice, StatusPill } from "@/components/admin/content-page";
import { listGalleryItems } from "@/lib/admin/content";

export const metadata: Metadata = { title: "Gallery" };

function host(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export default function GalleryAdminPage({ searchParams }: PageProps<"/admin/gallery">) {
  return (
    <ContentPage section="/admin/gallery">
      {async () => {
        const [items, sp] = await Promise.all([listGalleryItems(), searchParams]);
        return (
          <>
            <PageHeading
              title="Gallery"
              intro="Gift ideas from other shops. Each opens the other shop's page in a new tab, and clicks are counted."
              action={{ href: "/admin/gallery/new", label: "Add a gallery item" }}
            />
            <SavedNotice name={sp.saved} />
            {items.length === 0 ? (
              <p className="mt-8 text-ink-muted">No gallery items yet.</p>
            ) : (
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((g) => (
                  <li key={g.id} className="flex gap-4 rounded-lg border border-line-snow bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                    <img src={g.imageUrl} alt="" className="size-20 shrink-0 rounded object-cover" />
                    <div className="min-w-0">
                      <Link href={`/admin/gallery/${g.id}`} className="font-semibold underline underline-offset-4">
                        {g.title}
                      </Link>
                      <p className="truncate text-sm text-ink-muted">{host(g.targetUrl)}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2">
                        <StatusPill active={g.active} />
                        {g.isAffiliate && <span className="text-xs text-ink-muted">Affiliate</span>}
                        <span className="text-xs text-ink-muted tabular-nums">Order {g.sort}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        );
      }}
    </ContentPage>
  );
}
