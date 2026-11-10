import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, PageHeading, SavedNotice, StatusPill } from "@/components/admin/content-page";
import { listDesigns } from "@/lib/admin/content";
import { mediaUrl } from "@/lib/media";
import { OCCASIONS } from "@/lib/occasions";

export const metadata: Metadata = { title: "Card designs" };

export default function DesignsAdminPage({ searchParams }: PageProps<"/admin/designs">) {
  return (
    <ContentPage section="/admin/designs">
      {async () => {
        const [designs, sp] = await Promise.all([listDesigns(), searchParams]);
        return (
          <>
            <PageHeading
              title="Card designs"
              intro="Backgrounds people pick for their card, and the occasions each is offered for."
              action={{ href: "/admin/designs/new", label: "Add a design" }}
            />
            <SavedNotice name={sp.saved} />
            <ul className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {designs.map((d) => (
                <li key={d.id}>
                  <Link href={`/admin/designs/${d.id}`} className="group block">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                    <img
                      src={mediaUrl(d.backgroundPath)}
                      alt=""
                      width={1500}
                      height={2100}
                      loading="lazy"
                      className="aspect-[5/7] w-full rounded-lg object-cover ring-1 ring-ink/10 group-hover:ring-ink"
                    />
                    <span className="mt-2 block font-semibold underline-offset-4 group-hover:underline">
                      {d.name}
                    </span>
                  </Link>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <StatusPill active={d.active} />
                    {d.occasions.length
                      ? d.occasions.map((o) => OCCASIONS[o].label).join(", ")
                      : "Every occasion"}
                  </p>
                </li>
              ))}
            </ul>
          </>
        );
      }}
    </ContentPage>
  );
}
