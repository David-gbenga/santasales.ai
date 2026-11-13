import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/account/auth-shell";
import { NewPasswordForm } from "@/components/account/account-forms";
import { requireCustomer } from "@/lib/account";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function NewPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      footer={
        <p>
          <Link href="/account" className="font-semibold text-ink underline underline-offset-4">
            Back to my account
          </Link>
        </p>
      }
    >
      <Suspense fallback={<p className="text-ink-muted">Loading…</p>}>
        <SignedInForm />
      </Suspense>
    </AuthShell>
  );
}

async function SignedInForm() {
  await requireCustomer("/account/password");
  return <NewPasswordForm />;
}
