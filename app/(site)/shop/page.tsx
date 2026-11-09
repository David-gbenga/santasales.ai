import type { Metadata } from "next";
import { ProductCard } from "@/components/ui/product-card";
import { getActiveProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "Christmas printables and wallpapers to download straight after you pay.",
};

export default async function ShopPage() {
  const products = await getActiveProducts();

  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <h1 className="font-display text-5xl leading-tight sm:text-6xl">Shop</h1>
        <p className="mt-4 max-w-xl text-lg text-ink-muted">
          Printables and wallpapers. Pay once and download straight away. No account needed.
        </p>

        {products.length === 0 ? (
          <p className="mt-12 text-lg">
            Nothing in the shop just now. New printables are on the way; check back soon.
          </p>
        ) : (
          <ul className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
