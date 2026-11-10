"use client";

import { useId, useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";

type DesignOption = { slug: string; name: string; imageUrl: string };

type CardFormProps = {
  designs: DesignOption[];
  priceLabel: string;
  relationships: Record<string, string>;
  tones: Record<string, { label: string; hint: string }>;
};

const DETAILS_MAX = 300;

const fieldClass =
  "mt-2 block w-full rounded-md border border-ink/25 bg-white px-4 py-3 text-base text-ink placeholder:text-ink-muted/70 focus-visible:border-ink";

export function CardForm({ designs, priceLabel, relationships, tones }: CardFormProps) {
  const [design, setDesign] = useState(designs[0].slug);
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");
  const ids = { details: useId(), detailsHint: useId(), error: useId() };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("loading");
    setError("");
    track("checkout_start", { refId: `card:${design}` });

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "card",
          designSlug: design,
          input: {
            recipientName: form.get("recipientName"),
            senderName: form.get("senderName"),
            relationship: form.get("relationship"),
            tone: form.get("tone"),
            details: form.get("details") ?? "",
          },
        }),
      });
      const body: { url?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !body.url)
        throw new Error(body.error ?? "Checkout didn't open. Please try again.");
      window.location.assign(body.url);
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Checkout didn't open. Please try again.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_1fr]"
      aria-describedby={error ? ids.error : undefined}
    >
      <fieldset>
        <legend className="text-xl font-semibold">1. Choose a design</legend>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-5">
          {designs.map((d) => (
            <label key={d.slug} className="group cursor-pointer">
              <input
                type="radio"
                name="design"
                value={d.slug}
                checked={design === d.slug}
                onChange={() => setDesign(d.slug)}
                className="peer sr-only"
              />
              <span className="block overflow-hidden rounded-lg ring-2 ring-transparent ring-offset-4 ring-offset-snow transition-shadow peer-checked:ring-ink peer-focus-visible:ring-ember">
                {/* eslint-disable-next-line @next/next/no-img-element -- remote media bucket image */}
                <img
                  src={d.imageUrl}
                  alt=""
                  width={1500}
                  height={2100}
                  loading="lazy"
                  className="aspect-[5/7] w-full object-cover"
                />
              </span>
              <span className="mt-2 flex items-baseline justify-between gap-2 font-medium">
                {d.name}
                {design === d.slug && (
                  <span aria-hidden="true" className="text-sm font-semibold text-pine">
                    Selected
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <fieldset className="space-y-6">
          <legend className="text-xl font-semibold">2. Tell us about them</legend>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block font-medium">
              Their name
              <input
                name="recipientName"
                required
                maxLength={40}
                autoComplete="off"
                placeholder="e.g. Grandad…"
                className={fieldClass}
              />
            </label>
            <label className="block font-medium">
              Your name on the card
              <input
                name="senderName"
                required
                maxLength={40}
                autoComplete="given-name"
                placeholder="e.g. Mia…"
                className={fieldClass}
              />
            </label>
          </div>

          <label className="block font-medium">
            Who are they to you?
            <select name="relationship" required defaultValue="" className={fieldClass}>
              <option value="" disabled>
                Choose one
              </option>
              {Object.entries(relationships).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="font-medium">Tone</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {Object.entries(tones).map(([value, { label, hint }], i) => (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="tone"
                    value={value}
                    defaultChecked={i === 0}
                    className="peer sr-only"
                  />
                  <span className="block rounded-md border border-ink/25 bg-white px-4 py-3 transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-snow peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember">
                    <span className="block font-semibold">{label}</span>
                    <span className="block text-sm opacity-80">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor={ids.details} className="block font-medium">
              Anything we should mention?{" "}
              <span className="font-normal text-ink-muted">(optional)</span>
            </label>
            <p id={ids.detailsHint} className="mt-1 text-sm text-ink-muted">
              A shared memory, something they did this year, an in-joke. Keep it kind: it goes on
              their card.
            </p>
            <textarea
              id={ids.details}
              name="details"
              rows={4}
              maxLength={DETAILS_MAX}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              aria-describedby={ids.detailsHint}
              placeholder="e.g. Taught me to bake this year, still beats everyone at Scrabble…"
              className={fieldClass}
            />
            <p className="mt-1 text-right text-sm tabular-nums text-ink-muted">
              {details.length}/{DETAILS_MAX}
            </p>
          </div>
        </fieldset>

        <div className="mt-8 border-t border-line-snow pt-6">
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-7 text-base font-semibold text-snow transition-colors hover:bg-night-raised disabled:cursor-wait disabled:opacity-80 sm:w-auto"
          >
            {status === "loading" ? "Opening checkout…" : `Pay ${priceLabel} and write my card`}
          </button>
          <p className="mt-3 text-sm text-ink-muted">
            You&rsquo;ll pay on Stripe&rsquo;s secure page, then come straight back here while we
            write the message.
          </p>
          <p id={ids.error} role="alert" className="mt-3 min-h-6 font-medium text-berry">
            {error}
          </p>
        </div>
      </div>
    </form>
  );
}
