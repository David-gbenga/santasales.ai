import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiKitNote } from "@/components/ui/ai-kit-note";
import { BuyButton } from "@/components/ui/buy-button";
import { ProductImage } from "@/components/ui/product-card";
import { formatPrice } from "@/lib/format";
import { getActiveProducts, getProductBySlug } from "@/lib/products";

export async function generateStaticParams() {
  const products = await getActiveProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return product ? { title: product.name, description: product.description } : {};
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <nav aria-label="Breadcrumb" className="text-ink-muted">
          <Link href="/shop" className="underline underline-offset-4 hover:text-ink">
            Shop
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_1fr] md:gap-16">
          <div className="max-w-md">
            <ProductImage product={product} eager />
          </div>

          <div>
            <h1 className="text-balance font-display text-4xl leading-tight sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-4 text-2xl font-semibold tabular-nums">
              {formatPrice(product.price_pence, product.currency)}
            </p>
            <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-muted">
              {product.description}
            </p>

            <div className="mt-8">
              <BuyButton
                productId={product.id}
                label={`Buy for ${formatPrice(product.price_pence, product.currency)}`}
              />
            </div>
            <AiKitNote className="mt-6 max-w-prose" />

            <ul className="mt-8 max-w-prose space-y-2 text-ink-muted">
              <li>You&rsquo;ll pay on Stripe&rsquo;s secure checkout page. No account needed.</li>
              <li>
                Your download link appears as soon as payment completes and works for 24 hours.
              </li>
              <li>
                Keep the confirmation page: for 30 days it gives you a fresh link. See our{" "}
                <Link href="/refunds" className="underline underline-offset-4 hover:text-ink">
                  refund policy
                </Link>
                .
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
