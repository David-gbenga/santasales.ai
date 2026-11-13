import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProfileForm } from "@/components/account/account-forms";
import { requireCustomer } from "@/lib/account";
import {
  getAllowance,
  getSubscription,
  membershipState,
  type MembershipState,
  type SubscriptionRow,
} from "@/lib/subscriptions";
import { openBillingPortal } from "../premium/actions";
import { signOutCustomer } from "./actions";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default function AccountPage({ searchParams }: PageProps<"/account">) {
  return (
    <div className="bg-snow text-ink">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <Suspense fallback={<p className="text-ink-muted">Loading your account…</p>}>
          <Account searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

const NOTICES: Record<string, string> = { password: "Your new password is saved." };

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
const formatDate = (iso: string | null) => (iso ? dateFormat.format(new Date(iso)) : "");

const STATE_LABEL: Record<MembershipState, string> = {
  active: "Active",
  cancelling: "Cancelled — access until the end of this period",
  payment_failed: "Payment failed",
  expired: "Expired",
};

async function Account({ searchParams }: Pick<PageProps<"/account">, "searchParams">) {
  const customer = await requireCustomer("/account");
  const sp = await searchParams;
  const notice = typeof sp.updated === "string" ? NOTICES[sp.updated] : undefined;
  const subscribed = sp.subscribed === "1";
  const portalError = sp.error === "portal";
  const subscription = await getSubscription(customer.id);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">My account</h1>
          <p className="mt-3 text-lg text-ink-muted">
            {customer.fullName ? `Hello, ${customer.fullName}.` : "Hello."}
          </p>
        </div>
        <form action={signOutCustomer}>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-full border border-ink/30 px-5 font-semibold hover:border-ink"
          >
            Sign out
          </button>
        </form>
      </div>

      {notice && (
        <p role="status" className="mt-6 rounded-md border border-pine/40 bg-white px-4 py-3 font-medium text-pine">
          {notice}
        </p>
      )}
      {!customer.emailConfirmed && (
        <p role="note" className="mt-6 rounded-md border border-berry/50 bg-white px-4 py-3 font-medium text-berry">
          Confirm your email address to use GiftPost Premium. Check your inbox for our link, or sign
          out and in again to get a new one.
        </p>
      )}

      {subscribed && !subscription && (
        <p role="status" className="mt-6 rounded-md border border-pine/40 bg-white px-4 py-3 font-medium text-pine">
          Thank you! Your payment went through. Premium switches on in a few seconds; refresh this
          page if it hasn&rsquo;t yet.
        </p>
      )}
      {portalError && (
        <p role="alert" className="mt-6 rounded-md border border-berry/50 bg-white px-4 py-3 font-medium text-berry">
          The billing page couldn&rsquo;t open. Try again in a minute.
        </p>
      )}

      <Membership subscription={subscription} />

      <section aria-labelledby="details" className="mt-6 rounded-2xl border border-line-snow bg-white/60 p-6 sm:p-8">
        <h2 id="details" className="font-display text-2xl">Your details</h2>
        <dl className="mt-4">
          <dt className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Email</dt>
          <dd className="mt-1 break-all">{customer.email}</dd>
        </dl>
        <div className="mt-6">
          <ProfileForm fullName={customer.fullName} />
        </div>
        <p className="mt-2">
          <Link href="/account/password" className="font-semibold underline underline-offset-4">
            Change password
          </Link>
        </p>
        <p className="mt-4 text-sm text-ink-muted">
          To change your email address or delete your account, email us from this address.
        </p>
      </section>
    </>
  );
}

async function Membership({ subscription }: { subscription: SubscriptionRow | null }) {
  if (!subscription) {
    return (
      <section aria-labelledby="membership" className="mt-10 rounded-2xl border border-line-snow bg-white/60 p-6 sm:p-8">
        <h2 id="membership" className="font-display text-2xl">Membership</h2>
        <p className="mt-2 text-ink-muted">You don&rsquo;t have GiftPost Premium yet.</p>
        <Link
          href="/premium"
          className="mt-5 inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-semibold text-snow hover:bg-ink/90"
        >
          See GiftPost Premium
        </Link>
      </section>
    );
  }

  const state = membershipState(subscription);
  const allowance = state === "active" || state === "cancelling" ? await getAllowance(subscription) : null;
  const rows: [string, string][] = [
    ["Plan", "GiftPost Premium, £25 every 30 days"],
    ["Status", STATE_LABEL[state]],
    ["Member since", formatDate(subscription.created_at)],
  ];
  if (state === "active") rows.push(["Next payment", formatDate(subscription.current_period_end)]);
  if (state === "cancelling") rows.push(["Premium ends", formatDate(subscription.current_period_end)]);
  if (state === "expired") rows.push(["Ended", formatDate(subscription.ended_at ?? subscription.current_period_end)]);

  return (
    <section aria-labelledby="membership" className="mt-10 rounded-2xl border border-line-snow bg-white/60 p-6 sm:p-8">
      <h2 id="membership" className="font-display text-2xl">Membership</h2>
      {state === "payment_failed" && (
        <p role="alert" className="mt-4 rounded-md border border-berry/50 bg-white px-4 py-3 font-medium text-berry">
          Your last payment didn&rsquo;t go through, so Premium is paused. Update your card to switch it
          back on.
        </p>
      )}
      <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-[auto_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {allowance && (
        <>
          <h3 className="mt-8 font-display text-xl">Left this period</h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {(
              [
                ["song", "Songs"],
                ["card", "Cards"],
                ["voice_greeting", "Voice greetings"],
              ] as const
            ).map(([kind, label]) => (
              <li key={kind} className="rounded-xl border border-line-snow bg-white px-4 py-3">
                <span className="block text-sm text-ink-muted">{label}</span>
                <span className="font-display text-3xl tabular-nums">
                  {allowance[kind].limit - allowance[kind].used}
                </span>
                <span className="text-ink-muted"> of {allowance[kind].limit}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {state === "expired" ? (
          <Link
            href="/premium"
            className="inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-semibold text-snow hover:bg-ink/90"
          >
            Rejoin Premium
          </Link>
        ) : (
          <form action={openBillingPortal}>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-semibold text-snow hover:bg-ink/90"
            >
              {state === "payment_failed" ? "Update card" : "Manage or cancel subscription"}
            </button>
          </form>
        )}
      </div>
      <p className="mt-3 text-sm text-ink-muted">
        Card details, invoices and cancelling are handled on Stripe&rsquo;s secure billing page.
      </p>
    </section>
  );
}
