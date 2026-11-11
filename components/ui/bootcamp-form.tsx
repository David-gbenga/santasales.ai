"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { BOOTCAMP_EXPERIENCE } from "@/lib/validation";

const fieldClass =
  "mt-2 block w-full rounded-md border border-ink/25 bg-white px-4 py-3 text-base text-ink placeholder:text-ink-muted/70 focus-visible:border-ink";

/** Sign-up form for the free AI engineering bootcamp. */
export function BootcampForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/bootcamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          experience: form.get("experience"),
          goal: form.get("goal") || undefined,
          consent: form.get("consent") === "on",
          website: form.get("website") || undefined,
        }),
      });
      const body: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "That didn't go through. Try again.");
      track("cta_click", { refId: "bootcamp:register" });
      setStatus("done");
      requestAnimationFrame(() => doneRef.current?.focus());
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "That didn't go through. Try again.");
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  if (status === "done") {
    return (
      <div
        ref={doneRef}
        tabIndex={-1}
        role="status"
        className="rounded-xl border border-pine/40 bg-white p-6 outline-none"
      >
        <p className="font-display text-3xl">You&rsquo;re on the list.</p>
        <p className="mt-2 text-ink-muted">
          We&rsquo;ll email you the dates and joining details for the bootcamp. Keep an eye on your
          inbox, and your spam folder just in case.
        </p>
        <p className="mt-6">
          <Link href="/" className="font-semibold underline underline-offset-4">
            Back to Giftpost
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <label className="block font-medium">
        Your name
        <input name="name" required maxLength={100} autoComplete="name" className={fieldClass} />
      </label>

      <label className="block font-medium">
        Email address
        <input
          name="email"
          type="email"
          required
          maxLength={320}
          autoComplete="email"
          spellCheck={false}
          className={fieldClass}
        />
      </label>

      <fieldset>
        <legend className="font-medium">Your coding experience</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {Object.entries(BOOTCAMP_EXPERIENCE).map(([value, label], i) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="experience"
                value={value}
                defaultChecked={i === 0}
                className="peer sr-only"
              />
              <span className="block h-full rounded-md border border-ink/25 bg-white px-4 py-3 font-semibold transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-snow peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block font-medium">
        What would you like to build? <span className="font-normal text-ink-muted">(optional)</span>
        <textarea
          name="goal"
          rows={3}
          maxLength={500}
          placeholder="e.g. a booking assistant for my salon"
          className={fieldClass}
        />
      </label>

      {/* Honeypot: hidden from people and screen readers; bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="flex items-start gap-3">
        <input name="consent" type="checkbox" required className="mt-1 size-5 shrink-0 accent-ink" />
        <span className="text-ink-muted">
          Giftpost can email me about the bootcamp. We use your details only for this, and you can
          ask us to delete them any time. See our{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-ink">
            privacy notice
          </Link>
          .
        </span>
      </label>

      {error && (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="rounded-md border border-berry/40 bg-white px-4 py-3 font-medium text-berry outline-none"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex min-h-12 items-center rounded-full bg-ember px-8 font-semibold text-night hover:bg-ember-strong disabled:cursor-wait disabled:opacity-70"
      >
        {status === "sending" ? "Registering…" : "Register for free"}
      </button>
    </form>
  );
}
