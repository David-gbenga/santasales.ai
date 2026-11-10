import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignForm } from "@/components/admin/content-forms";
import { ContentPage, PageHeading } from "@/components/admin/content-page";
import { getDesign } from "@/lib/admin/content";
import { mediaUrl } from "@/lib/media";
import { orderIdSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Edit card design" };

export default function EditDesignPage({ params }: PageProps<"/admin/designs/[id]">) {
  return (
    <ContentPage section="/admin/designs">
      {async () => {
        const id = orderIdSchema.safeParse((await params).id);
        const design = id.success ? await getDesign(id.data) : null;
        if (!design) notFound();
        const layout = design.layout ?? {
          text: { x: 200, y: 520, width: 1100, height: 1000 },
          align: "center" as const,
          font: "serif" as const,
          color: "#13233f",
          accentColor: "#c8324a",
        };
        return (
          <>
            <PageHeading
              title={design.name}
              intro="Changes apply to new cards. Finished cards keep the image they were made with."
              back={{ href: "/admin/designs", label: "Card designs" }}
            />
            <DesignForm
              values={{
                id: design.id,
                name: design.name,
                slug: design.slug,
                backgroundPath: design.backgroundPath,
                backgroundUrl: mediaUrl(design.backgroundPath),
                occasions: design.occasions,
                ...layout.text,
                align: layout.align,
                font: layout.font,
                color: layout.color,
                accentColor: layout.accentColor ?? layout.color,
                sort: design.sort,
                active: design.active,
              }}
            />
          </>
        );
      }}
    </ContentPage>
  );
}
