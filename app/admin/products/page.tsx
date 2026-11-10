import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, PageHeading, SavedNotice, StatusPill } from "@/components/admin/content-page";
import { listProducts } from "@/lib/admin/content";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Products" };

export default function ProductsAdminPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <ContentPage section="/admin/products">
      {async () => {
        const [products, sp] = await Promise.all([listProducts(), searchParams]);
        return (
          <>
            <PageHeading
              title="Products"
              intro="Downloads sold in the shop. Hide a product instead of deleting it: past orders still point at it."
              action={{ href: "/admin/products/new", label: "Add a product" }}
            />
            <SavedNotice name={sp.saved} />
            {products.length === 0 ? (
              <p className="mt-8 text-ink-muted">No products yet.</p>
            ) : (
              <div className="mt-8 overflow-x-auto rounded-lg border border-line-snow bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line-snow text-ink-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Product</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Price</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Orders</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-line-snow last:border-0">
                        <td className="px-4 py-3">
                          <Link href={`/admin/products/${p.id}`} className="font-semibold underline underline-offset-4">
                            {p.name}
                          </Link>
                          <span className="block text-ink-muted">/shop/{p.slug}</span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{formatPrice(p.pricePence)}</td>
                        <td className="px-4 py-3 tabular-nums">{p.orderCount}</td>
                        <td className="px-4 py-3">
                          <StatusPill active={p.active} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        );
      }}
    </ContentPage>
  );
}
