import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GalleryForm } from "@/components/admin/content-forms";
import { ContentPage, PageHeading } from "@/components/admin/content-page";
import { getGalleryItem } from "@/lib/admin/content";
import { orderIdSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Edit gallery item" };

export default function EditGalleryItemPage({ params }: PageProps<"/admin/gallery/[id]">) {
  return (
    <ContentPage section="/admin/gallery">
      {async () => {
        const id = orderIdSchema.safeParse((await params).id);
        const item = id.success ? await getGalleryItem(id.data) : null;
        if (!item) notFound();
        return (
          <>
            <PageHeading title={item.title} back={{ href: "/admin/gallery", label: "Gallery" }} />
            <GalleryForm values={item} />
          </>
        );
      }}
    </ContentPage>
  );
}
