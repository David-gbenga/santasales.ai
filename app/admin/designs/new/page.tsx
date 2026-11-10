import type { Metadata } from "next";
import { DesignForm } from "@/components/admin/content-forms";
import { ContentPage, PageHeading } from "@/components/admin/content-page";

export const metadata: Metadata = { title: "Add a card design" };

export default function NewDesignPage() {
  return (
    <ContentPage section="/admin/designs">
      {async () => (
        <>
          <PageHeading title="Add a card design" back={{ href: "/admin/designs", label: "Card designs" }} />
          <DesignForm
            values={{
              id: "",
              name: "",
              slug: "",
              backgroundPath: "",
              backgroundUrl: null,
              occasions: [],
              x: 200,
              y: 520,
              width: 1100,
              height: 1000,
              align: "center",
              font: "serif",
              color: "#13233f",
              accentColor: "#c8324a",
              sort: 100,
              active: true,
            }}
          />
        </>
      )}
    </ContentPage>
  );
}
