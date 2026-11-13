import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/account/auth-shell";
import { ForgotPasswordForm } from "@/components/account/account-forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      intro={<p>We&rsquo;ll email you a link to choose a new one.</p>}
      footer={
        <p>
          <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
