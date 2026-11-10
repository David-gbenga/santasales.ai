"use client";

import { useId, useState, type FormEvent } from "react";
import { OwnWordsField } from "@/components/ui/own-words-field";
import { track } from "@/lib/analytics";

type Option = { label: string; hint: string };

type LyricsFormProps = {
  priceLabel: string;
  relationships: Record<string, string>;
  styles: Record<string, Option>;
  lengths: Record<string, Option>;
};

const DETAILS_MAX = 500;

const IDEAS = [
  { label: "Their year", text: "This year they " },
  { label: "A running joke", text: "Include the running joke about " },
  { label: "Their hobby", text: "They love " },
  {
    label: "Everyone sings the chorus",
    text: "Make the chorus easy for the whole family to sing.",
  },
  { label: "Mention the pets", text: "Mention the pets: " },
] as const;

const fieldClass =
  "mt-2 block w-full rounded-md border border-ink/25 bg-white px-4 py-3 text-base text-ink placeholder:text-ink-muted/70 focus-visible:border-ink";

function ChoiceGroup({
  legend,
  name,
  options,
}: {
  legend: string;
  name: string;
  options: Record<string, Option>;
}) {
  return (
    <fieldset>
      <legend className="font-medium">{legend}</legend>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        {Object.entries(options).map(([value, { label, hint }], i) => (
          <label key={value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={value}
              defaultChecked={i === 0}
              className="peer sr-only"
            />
            <span className="block h-full rounded-md border border-ink/25 bg-white px-4 py-3 transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-snow peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember">
              <span className="block font-semibold">{label}</span>
              <span className="block text-sm opacity-80">{hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function LyricsForm({ priceLabel, relationships, styles, lengths }: LyricsFormProps) {
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");
  const errorId = useId();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("loading");
    setError("");
    track("checkout_start", { refId: "lyrics" });

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "lyrics",
          input: {
            recipientName: form.get("recipientName"),
            senderName: form.get("senderName"),
            relationship: form.get("relationship"),
            style: form.get("style"),
            length: form.get("length"),
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
      className="mt-12 space-y-6"
      aria-describedby={error ? errorId : undefined}
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block font-medium">
          Who&rsquo;s the song for?
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

      <OwnWordsField
        name="details"
        label="Describe the song in your own words"
        hint="What they're like, what they did this year, things only your family would get. Keep it kind: they'll hear it."
        placeholder="e.g. Grandad finally retired this year, spends every morning on his allotment and still can't work the TV remote…"
        ideas={IDEAS}
        max={DETAILS_MAX}
        value={details}
        onChange={setDetails}
      />

      <label className="block font-medium">
        Who are they to you?{" "}
        <span className="font-normal text-ink-muted">(optional if you&rsquo;ve said above)</span>
        <select name="relationship" defaultValue="" className={fieldClass}>
          <option value="">Not chosen</option>
          {Object.entries(relationships).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <ChoiceGroup legend="Style" name="style" options={styles} />
      <ChoiceGroup legend="Length" name="length" options={lengths} />

      <div className="border-t border-line-snow pt-6">
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-7 text-base font-semibold text-snow transition-colors hover:bg-night-raised disabled:cursor-wait disabled:opacity-80 sm:w-auto"
        >
          {status === "loading" ? "Opening checkout…" : `Pay ${priceLabel} and write my song`}
        </button>
        <p className="mt-3 text-sm text-ink-muted">
          You&rsquo;ll pay on Stripe&rsquo;s secure page, then come straight back here while we
          write the song.
        </p>
        <p id={errorId} role="alert" className="mt-3 min-h-6 font-medium text-berry">
          {error}
        </p>
      </div>
    </form>
  );
}
