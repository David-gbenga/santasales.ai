import type { Metadata } from "next";
import { GalleryForm } from "@/components/admin/content-forms";
import { ContentPage, PageHeading } from "@/components/admin/content-page";

export const metadata: Metadata = { title: "Add a gallery item" };

export default function NewGalleryItemPage() {
  return (
    <ContentPage section="/admin/gallery">
      {async () => (
        <>
          <PageHeading title="Add a gallery item" back={{ href: "/admin/gallery", label: "Gallery" }} />
          <GalleryForm
            values={{
              id: "",
              title: "",
              targetUrl: "",
              imageUrl: "",
              isAffiliate: false,
              sort: 100,
              active: true,
            }}
          />
        </>
      )}
    </ContentPage>
  );
}
