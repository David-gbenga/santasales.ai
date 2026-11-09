import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { WaitForPayment } from "@/components/ui/wait-for-payment";
import { ButtonLink } from "@/components/ui/button-link";
import { DOWNLOAD_WINDOW_DAYS, getOrderBySessionId, isWithinDownloadWindow } from "@/lib/orders";
import { stripeSessionIdSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false },
};

export default function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 md:py-24">
        <Suspense fallback={<Heading>Checking your order…</Heading>}>
          <OrderStatus searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h1 className="font-display text-4xl leading-tight sm:text-5xl">{children}</h1>;
}

async function OrderStatus({ searchParams }: Pick<PageProps<"/checkout/success">, "searchParams">) {
  const parsed = stripeSessionIdSchema.safeParse((await searchParams).session_id);
  if (!parsed.success) {
    return (
      <>
        <Heading>We couldn&rsquo;t find that order</Heading>
        <p className="mt-4 text-lg text-ink-muted">
          This link is missing its order reference. Use the link from the end of checkout, or head
          back to the shop.
        </p>
        <div className="mt-8">
          <ButtonLink href="/shop" variant="outline-snow">
            Go to the shop
          </ButtonLink>
        </div>
      </>
    );
  }

  const order = await getOrderBySessionId(parsed.data);

  if (!order) {
    return (
      <>
        <Heading>We couldn&rsquo;t find that order</Heading>
        <p className="mt-4 text-lg text-ink-muted">
          If you&rsquo;ve just paid, refresh this page in a few seconds.
        </p>
      </>
    );
  }

  if (order.status === "pending") {
    return (
      <>
        <Heading>Confirming your payment…</Heading>
        <WaitForPayment />
      </>
    );
  }

  if (order.status === "refunded") {
    return (
      <>
        <Heading>This order was refunded</Heading>
        <p className="mt-4 text-lg text-ink-muted">The download is no longer available.</p>
      </>
    );
  }

  const name = order.product?.name ?? "your download";
  const canDownload = isWithinDownloadWindow(order.paid_at);

  return (
    <>
      <Heading>Thank you. {name} is ready.</Heading>
      {canDownload ? (
        <>
          <div className="mt-8">
            <a
              href={`/api/download/${order.id}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-7 font-semibold text-snow transition-colors hover:bg-night-raised"
            >
              Download {name}
            </a>
          </div>
          <p className="mt-6 text-ink-muted">
            Each download link works for 24 hours. Bookmark this page: for {DOWNLOAD_WINDOW_DAYS}{" "}
            days it gives you a fresh link whenever you need one.
          </p>
        </>
      ) : (
        <p className="mt-4 text-lg text-ink-muted">
          Downloads for this order closed {DOWNLOAD_WINDOW_DAYS} days after purchase.
        </p>
      )}
      <p className="mt-10">
        <Link href="/shop" className="font-semibold underline underline-offset-4">
          Back to the shop
        </Link>
      </p>
    </>
  );
}
