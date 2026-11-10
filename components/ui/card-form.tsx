"use client";

import { useId, useState, type FormEvent } from "react";
import { AnonymousField, OccasionField } from "@/components/ui/occasion-fields";
import { OwnWordsField } from "@/components/ui/own-words-field";
import { track } from "@/lib/analytics";
import type { Occasion } from "@/lib/occasions";

/** `occasions` empty means the design suits every occasion. */
type DesignOption = { slug: string; name: string; imageUrl: string; occasions: Occasion[] };

const suits = (d: DesignOption, occasion: Occasion) =>
  d.occasions.length === 0 || d.occasions.includes(occasion);

type CardFormProps = {
  designs: DesignOption[];
  defaultOccasion: Occasion;
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
  { label: "Thank them for something", text: "Thank them for " },
] as const;

const fieldClass =
  "mt-2 block w-full rounded-md border border-ink/25 bg-white px-4 py-3 text-base text-ink placeholder:text-ink-muted/70 focus-visible:border-ink";

export function CardForm({
  designs,
  defaultOccasion,
  priceLabel,
  relationships,
  tones,
}: CardFormProps) {
  const [occasion, setOccasion] = useState<Occasion>(defaultOccasion);
  const shown = designs.filter((d) => suits(d, occasion));
  const [picked, setPicked] = useState(shown[0]?.slug ?? designs[0].slug);
  // Keep the choice when it suits the new occasion; otherwise fall back to the first that does.
  const design = shown.some((d) => d.slug === picked) ? picked : (shown[0]?.slug ?? picked);
  const setDesign = setPicked;
  const [anonymous, setAnonymous] = useState(false);
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");
  const errorId = useId();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("loading");
    setError("");
    track("cta_click", { refId: `preview:card:${design}` });

    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "card",
          designSlug: design,
          input: {
            occasion,
            anonymous,
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
        throw new Error(body.error ?? "Your preview didn't start. Please try again.");
      window.location.assign(body.url);
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Your preview didn't start. Please try again.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_1fr]"
      aria-describedby={error ? errorId : undefined}
    >
      <fieldset>
        <legend className="text-xl font-semibold">1. Pick the occasion and a design</legend>
        <OccasionField value={occasion} onChange={setOccasion} noun="card" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5">
          {shown.map((d) => (
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
              Your name
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

          <AnonymousField checked={anonymous} onChange={setAnonymous} noun="card" />

          <OwnWordsField
            name="details"
            label="Describe the card in your own words"
            hint="Who they are, what they’re celebrating, a memory or in-joke, how you want it to sound. Keep it kind: it goes on their card."
            placeholder="e.g. My brother turns 40 and just moved to Canada. He pretends he isn’t homesick. Make it a bit funny and remind him about our Sunday football…"
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
            {status === "loading" ? "Starting your preview…" : "Write my card (free preview)"}
          </button>
          <p className="mt-3 text-sm text-ink-muted">
            We&rsquo;ll write it and show you the whole card first. Love it? Pay {priceLabel} to
            edit and download it.
          </p>
          <p id={errorId} role="alert" className="mt-3 min-h-6 font-medium text-berry">
            {error}
          </p>
        </div>
      </div>
    </form>
  );
}
