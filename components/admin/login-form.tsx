"use client";

import { useActionState } from "react";
import { sendMagicLink, signInWithPassword, type SignInState } from "@/app/admin/auth-actions";

const initial: SignInState = { status: "idle", message: "" };

const inputClass =
  "mt-2 block w-full rounded-md border border-line-night bg-night-raised px-4 py-3 text-frost placeholder:text-frost-muted focus-visible:border-frost";

function Message({ state }: { state: SignInState }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={`min-h-6 ${state.status === "error" ? "text-ember" : "text-frost-muted"}`}
    >
      {state.message}
    </p>
  );
}

/** Password sign-in first (instant); an emailed one-time link as the fallback. */
export function LoginForm() {
  const [passwordState, passwordAction, signingIn] = useActionState(signInWithPassword, initial);
  const [linkState, linkAction, sending] = useActionState(sendMagicLink, initial);

  return (
    <>
      <form action={passwordAction} className="mt-8 space-y-4">
        <label className="block font-medium text-frost">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="username"
            spellCheck={false}
            className={inputClass}
            placeholder="you@example.com…"
          />
        </label>
        <label className="block font-medium text-frost">
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={signingIn}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ember px-6 font-semibold text-night hover:bg-ember-strong disabled:cursor-wait disabled:opacity-80"
        >
          {signingIn ? "Signing in…" : "Sign in"}
        </button>
        <Message state={passwordState} />
      </form>

      <details className="mt-6 rounded-md border border-line-night p-4 text-frost">
        <summary className="cursor-pointer font-medium">No password? Email me a sign-in link</summary>
        <form action={linkAction} className="mt-4 space-y-4">
          <label className="block font-medium">
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              spellCheck={false}
              className={inputClass}
              placeholder="you@example.com…"
            />
          </label>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-frost-muted/60 px-6 font-semibold text-frost hover:border-frost disabled:cursor-wait disabled:opacity-80"
          >
            {sending ? "Sending…" : "Email me a sign-in link"}
          </button>
          <Message state={linkState} />
        </form>
      </details>
    </>
  );
}
