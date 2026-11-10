"use client";

import { useId, useState, type FormEvent } from "react";
import { OwnWordsField } from "@/components/ui/own-words-field";
import { track } from "@/lib/analytics";

type DesignOption = { slug: string; name: string; imageUrl: string };

type CardFormProps = {
  designs: DesignOption[];
  priceLabel: string;
  relationships: Record<string, string>;
  tones: Record<string, { label: string; hint: string }>;
};

const DETAILS_MAX = 500;

/** Starter phrases people can tap to add to their description. */
const IDEAS = [
  { label: "A shared memory", text: "Mention the time we " },
  { label: "Their year", text: "This year they " },
  { label: "Make it rhyme", text: "Make it rhyme." },
  { label: "Keep it short", text: "Keep it short and sweet." },
  { label: "First Christmas apart", text: "It’s our first Christmas apart." },
] as const;

const fieldClass =
  "mt-2 block w-full rounded-md border border-ink/25 bg-white px-4 py-3 text-base text-ink placeholder:text-ink-muted/70 focus-visible:border-ink";

export function CardForm({ designs, priceLabel, relationships, tones }: CardFormProps) {
  const [design, setDesign] = useState(designs[0].slug);
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");
  const errorId = useId();

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
      aria-describedby={error ? errorId : undefined}
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

          <OwnWordsField
            name="details"
            label="Describe the card in your own words"
            hint="Who they are, what happened this year, a memory or in-joke, how you want it to sound. Keep it kind: it goes on their card."
            placeholder="e.g. My brother moved to Canada this year. He pretends he isn’t homesick. Make it a bit funny and remind him about our Boxing Day football…"
            ideas={IDEAS}
            max={DETAILS_MAX}
            value={details}
            onChange={setDetails}
          />

          <label className="block font-medium">
            Who are they to you?{" "}
            <span className="font-normal text-ink-muted">(optional if you’ve said above)</span>
            <select name="relationship" defaultValue="" className={fieldClass}>
              <option value="">Not chosen</option>
              {Object.entries(relationships).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="font-medium">
              Tone <span className="font-normal text-ink-muted">(your words above win)</span>
            </legend>
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
          <p id={errorId} role="alert" className="mt-3 min-h-6 font-medium text-berry">
            {error}
          </p>
        </div>
      </div>
    </form>
  );
}
