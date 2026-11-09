import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/products";

/** Grid tile linking to a product page. Used on the shop and the landing page. */
export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/shop/${product.slug}`} className="group block rounded-lg">
      <ProductImage product={product} />
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="min-w-0 text-xl font-semibold group-hover:underline">{product.name}</h3>
        <span className="shrink-0 font-semibold tabular-nums">
          {formatPrice(product.price_pence, product.currency)}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-ink-muted">{product.description}</p>
    </Link>
  );
}

export function ProductImage({ product, eager = false }: { product: Product; eager?: boolean }) {
  if (!product.preview_image) {
    return <div aria-hidden="true" className="aspect-[4/5] rounded-md bg-line-snow" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small local SVG previews; nothing to optimise
    <img
      src={product.preview_image}
      alt=""
      width={800}
      height={1000}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      className="aspect-[4/5] w-full rounded-md object-cover"
    />
  );
}
