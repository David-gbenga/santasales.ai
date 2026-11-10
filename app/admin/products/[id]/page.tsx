import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/content-forms";
import { ContentPage, PageHeading } from "@/components/admin/content-page";
import { getProduct } from "@/lib/admin/content";
import { orderIdSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Edit product" };

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <ContentPage section="/admin/products">
      {async () => {
        const id = orderIdSchema.safeParse((await params).id);
        const product = id.success ? await getProduct(id.data) : null;
        if (!product) notFound();
        return (
          <>
            <PageHeading
              title={product.name}
              intro={
                product.orderCount
                  ? `${product.orderCount} orders so far. A new file only changes future downloads.`
                  : undefined
              }
              back={{ href: "/admin/products", label: "Products" }}
            />
            <ProductForm
              values={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                description: product.description,
                price: (product.pricePence / 100).toFixed(2),
                filePath: product.filePath,
                previewImage: product.previewImage,
                active: product.active,
              }}
            />
          </>
        );
      }}
    </ContentPage>
  );
}
