import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/account/auth-shell";
import { SignUpForm } from "@/components/account/account-forms";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a free Giftpost account to subscribe to GiftPost Premium.",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create an account"
      intro={
        <p>
          You only need an account for GiftPost Premium. Single cards, songs and shop downloads
          don&rsquo;t need one.
        </p>
      }
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
            Sign in
          </Link>
        </p>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
