"use client";

import { useActionState } from "react";
import { sendMagicLink, type SignInState } from "@/app/admin/auth-actions";

const initial: SignInState = { status: "idle", message: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(sendMagicLink, initial);

  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block font-medium text-frost">
        Email
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          spellCheck={false}
          className="mt-2 block w-full rounded-md border border-line-night bg-night-raised px-4 py-3 text-frost placeholder:text-frost-muted focus-visible:border-frost"
          placeholder="you@example.com…"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ember px-6 font-semibold text-night hover:bg-ember-strong disabled:cursor-wait disabled:opacity-80"
      >
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
      <p
        role="status"
        aria-live="polite"
        className={`min-h-6 ${state.status === "error" ? "text-ember" : "text-frost-muted"}`}
      >
        {state.message}
      </p>
    </form>
  );
}
