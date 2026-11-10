import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/content-forms";
import { ContentPage, PageHeading } from "@/components/admin/content-page";

export const metadata: Metadata = { title: "Add a product" };

export default function NewProductPage() {
  return (
    <ContentPage section="/admin/products">
      {async () => (
        <>
          <PageHeading title="Add a product" back={{ href: "/admin/products", label: "Products" }} />
          <ProductForm
            values={{
              id: "",
              name: "",
              slug: "",
              description: "",
              price: "",
              filePath: "",
              previewImage: null,
              active: true,
            }}
          />
        </>
      )}
    </ContentPage>
  );
}
