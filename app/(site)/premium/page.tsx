import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { currentCustomer } from "@/lib/account";
import { formatPrice } from "@/lib/format";
import { PREMIUM_ALLOWANCE, PREMIUM_INTERVAL_DAYS, PREMIUM_PRICE_PENCE } from "@/lib/pricing";
import { displayPrices } from "@/lib/site";
import { getSubscription, hasAccess } from "@/lib/subscriptions";
import { startSubscription } from "./actions";

const price = formatPrice(PREMIUM_PRICE_PENCE);

export const metadata: Metadata = {
  title: "GiftPost Premium",
  description: `${price} every ${PREMIUM_INTERVAL_DAYS} days: ${PREMIUM_ALLOWANCE.song} personal songs, ${PREMIUM_ALLOWANCE.card} cards and ${PREMIUM_ALLOWANCE.voice_greeting} voice greetings. Cancel any time.`,
};

const buttonClass =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-7 font-semibold text-snow hover:bg-ink/90";

export default function PremiumPage({ searchParams }: PageProps<"/premium">) {
  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.1fr_1fr] md:py-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-pine">Membership</p>
          <h1 className="mt-3 font-display text-5xl leading-tight sm:text-6xl">GiftPost Premium</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
            For people who never miss a birthday. Make personal songs and cards for everyone on your
            list, all month, for one price.
          </p>
          <h2 className="mt-10 font-display text-2xl">Every {PREMIUM_INTERVAL_DAYS} days you get</h2>
          <ul className="mt-4 space-y-3 text-lg">
            <li>
              <strong>{PREMIUM_ALLOWANCE.song} personal songs</strong>, any length, sung and ready to
              download (usually {displayPrices.song}–{displayPrices.songMax} each)
            </li>
            <li>
              <strong>{PREMIUM_ALLOWANCE.card} personal cards</strong>, print-ready PNG and PDF
              (usually {displayPrices.card} each)
            </li>
            <li>
              <strong>{PREMIUM_ALLOWANCE.voice_greeting} voice greetings</strong> to go with them
            </li>
            <li>The same 3 rewrites and editing as a single purchase, with no watermark</li>
          </ul>
          <p className="mt-6 max-w-xl text-ink-muted">
            Unused songs, cards and greetings don&rsquo;t carry over to the next period. You don&rsquo;t
            need an account to buy a single card, song or download:{" "}
            <Link href="/cards" className="font-medium text-ink underline underline-offset-4">
              make one now
            </Link>
            .
          </p>
        </div>

        <div className="self-start rounded-2xl border border-line-snow bg-white/70 p-6 sm:p-8">
          <p className="font-display text-5xl">
            {price}
            <span className="ml-2 font-sans text-lg text-ink-muted">every {PREMIUM_INTERVAL_DAYS} days</span>
          </p>
          <ul className="mt-5 space-y-2 text-ink-muted">
            <li>Renews automatically until you cancel.</li>
            <li>Cancel any time in My account. You keep Premium until the end of the period you&rsquo;ve paid for.</li>
            <li>Payments are handled securely by Stripe.</li>
          </ul>
          <div className="mt-8">
            <Suspense fallback={<p className="text-ink-muted">Loading…</p>}>
              <SubscribeAction searchParams={searchParams} />
            </Suspense>
          </div>
          <p className="mt-6 text-sm text-ink-muted">
            See the{" "}
            <Link href="/terms#premium" className="underline underline-offset-4">
              Premium terms
            </Link>{" "}
            for renewal, cancellation and refunds.
          </p>
        </div>
      </div>
    </div>
  );
}

const ERRORS: Record<string, string> = {
  "confirm-email": "Confirm your email address first: use the link we emailed you, then come back.",
  checkout: "Checkout couldn't start. Please try again in a minute.",
};

async function SubscribeAction({ searchParams }: Pick<PageProps<"/premium">, "searchParams">) {
  const [customer, sp] = await Promise.all([currentCustomer(), searchParams]);
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;

  if (!customer) {
    return (
      <div className="space-y-3">
        <Link href="/signup" className={`${buttonClass} w-full`}>
          Create an account to subscribe
        </Link>
        <p className="text-center text-ink-muted">
          Already have one?{" "}
          <Link href="/login?next=/premium" className="font-semibold text-ink underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  const sub = await getSubscription(customer.id);
  if (sub && (hasAccess(sub) || sub.status === "past_due")) {
    return (
      <div className="space-y-3">
        <p className="font-medium">You&rsquo;re a Premium member.</p>
        <Link href="/account" className={`${buttonClass} w-full`}>
          Go to My account
        </Link>
      </div>
    );
  }

  return (
    <form action={startSubscription} className="space-y-3">
      {error && (
        <p role="alert" className="rounded-md border border-berry/50 bg-white px-4 py-3 font-medium text-berry">
          {error}
        </p>
      )}
      {!customer.emailConfirmed && (
        <p role="note" className="text-ink-muted">
          Confirm your email address before subscribing.
        </p>
      )}
      <button type="submit" className={`${buttonClass} w-full`} disabled={!customer.emailConfirmed}>
        Subscribe for {price}
      </button>
      <p className="text-center text-sm text-ink-muted">You&rsquo;ll pay on Stripe&rsquo;s secure page.</p>
    </form>
  );
}
