import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  "not-allowed": "That account can't manage this shop. Sign in with an admin email.",
  "link-expired": "That sign-in link has expired or was already used. Request a new one.",
};

export default function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-4xl text-frost">Admin sign in</h1>
      <p className="mt-3 text-frost-muted">We&rsquo;ll email you a one-time sign-in link.</p>
      <Suspense fallback={null}>
        <ErrorNote searchParams={searchParams} />
      </Suspense>
      <LoginForm />
    </main>
  );
}

async function ErrorNote({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const error = (await searchParams).error;
  const message = typeof error === "string" ? ERRORS[error] : undefined;
  return message ? (
    <p
      role="alert"
      className="mt-6 rounded-md border border-berry/60 bg-night-raised px-4 py-3 text-frost"
    >
      {message}
    </p>
  ) : null;
}
