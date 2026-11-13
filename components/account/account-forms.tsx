"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordReset,
  signIn,
  signUp,
  updatePassword,
  updateProfile,
  type FormState,
} from "@/app/(site)/account/actions";

const initial: FormState = { status: "idle", message: "" };

export const fieldClass =
  "mt-2 block w-full rounded-md border border-ink/25 bg-white px-4 py-3 text-base text-ink placeholder:text-ink-muted/70 focus-visible:border-ink";
export const primaryButtonClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-6 font-semibold text-snow hover:bg-ink/90 disabled:cursor-wait disabled:opacity-80";

function Message({ state }: { state: FormState }) {
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      aria-live="polite"
      className={`min-h-6 ${state.status === "error" ? "font-medium text-berry" : "text-ink-muted"}`}
    >
      {state.message}
    </p>
  );
}

function EmailField({ autoComplete = "email", defaultValue }: { autoComplete?: string; defaultValue?: string }) {
  return (
    <label className="block font-medium">
      Email address
      <input
        type="email"
        name="email"
        required
        maxLength={254}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        spellCheck={false}
        className={fieldClass}
      />
    </label>
  );
}

function NewPasswordField({ name = "password", label = "Password" }: { name?: string; label?: string }) {
  return (
    <label className="block font-medium">
      {label}
      <input
        type="password"
        name={name}
        required
        minLength={10}
        maxLength={72}
        autoComplete="new-password"
        aria-describedby="password-hint"
        className={fieldClass}
      />
    </label>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initial);
  if (state.status === "done") {
    return (
      <div role="status" className="rounded-xl border border-pine/40 bg-white p-6">
        <p className="font-display text-3xl">Nearly there</p>
        <p className="mt-2 text-ink-muted">{state.message}</p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-5">
      <label className="block font-medium">
        Your name
        <input
          name="fullName"
          required
          maxLength={80}
          autoComplete="name"
          defaultValue={state.values?.fullName}
          className={fieldClass}
        />
      </label>
      <EmailField defaultValue={state.values?.email} />
      <div>
        <NewPasswordField />
        <p id="password-hint" className="mt-2 text-sm text-ink-muted">
          At least 10 characters. A short phrase is easy to remember.
        </p>
      </div>
      <label className="flex items-start gap-3 text-ink-muted">
        <input type="checkbox" name="terms" required className="mt-1 size-5 accent-ink" />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="font-medium text-ink underline underline-offset-4">
            terms
          </Link>{" "}
          and have read the{" "}
          <Link href="/privacy" className="font-medium text-ink underline underline-offset-4">
            privacy notice
          </Link>
          .
        </span>
      </label>
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Creating your account…" : "Create account"}
      </button>
      <Message state={state} />
    </form>
  );
}

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, initial);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <EmailField autoComplete="username" defaultValue={state.values?.email} />
      <label className="block font-medium">
        Password
        <input
          type="password"
          name="password"
          required
          maxLength={200}
          autoComplete="current-password"
          className={fieldClass}
        />
      </label>
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <Message state={state} />
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);
  return (
    <form action={action} className="space-y-5">
      <EmailField defaultValue={state.values?.email} />
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Sending…" : "Email me a reset link"}
      </button>
      <Message state={state} />
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initial);
  return (
    <form action={action} className="space-y-5">
      <div>
        <NewPasswordField label="New password" />
        <p id="password-hint" className="mt-2 text-sm text-ink-muted">
          At least 10 characters.
        </p>
      </div>
      <NewPasswordField name="confirm" label="Type it again" />
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Saving…" : "Save new password"}
      </button>
      <Message state={state} />
    </form>
  );
}

export function ProfileForm({ fullName }: { fullName: string }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="block min-w-0 flex-1 font-medium">
        Your name
        <input
          name="fullName"
          required
          maxLength={80}
          defaultValue={fullName}
          autoComplete="name"
          className={fieldClass}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 items-center rounded-full border border-ink/30 px-6 font-semibold hover:border-ink disabled:cursor-wait disabled:opacity-80"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      <div className="basis-full">
        <Message state={state} />
      </div>
    </form>
  );
}
