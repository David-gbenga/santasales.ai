import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell, ErrorBanner } from "@/components/account/auth-shell";
import { SignInForm } from "@/components/account/account-forms";
import { accountNextSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  "link-expired": "That link has expired or was already used. Sign in, or ask for a new link below.",
};

export default function SignInPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthShell
      title="Sign in"
      footer={
        <>
          <p>
            <Link href="/forgot-password" className="font-semibold text-ink underline underline-offset-4">
              Forgotten your password?
            </Link>
          </p>
          <p>
            New here?{" "}
            <Link href="/signup" className="font-semibold text-ink underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </>
      }
    >
      <Suspense fallback={<SignInForm next="/account" />}>
        <SignInWithParams searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function SignInWithParams({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const sp = await searchParams;
  const message = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;
  return (
    <>
      {message && <ErrorBanner message={message} />}
      <SignInForm next={accountNextSchema.parse(sp.next)} />
    </>
  );
}
