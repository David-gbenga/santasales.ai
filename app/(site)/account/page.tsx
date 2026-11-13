import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProfileForm } from "@/components/account/account-forms";
import { requireCustomer } from "@/lib/account";
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

async function Account({ searchParams }: Pick<PageProps<"/account">, "searchParams">) {
  const customer = await requireCustomer("/account");
  const sp = await searchParams;
  const notice = typeof sp.updated === "string" ? NOTICES[sp.updated] : undefined;

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

      <section aria-labelledby="membership" className="mt-10 rounded-2xl border border-line-snow bg-white/60 p-6 sm:p-8">
        <h2 id="membership" className="font-display text-2xl">Membership</h2>
        <p className="mt-2 text-ink-muted">You don&rsquo;t have GiftPost Premium yet.</p>
      </section>

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
