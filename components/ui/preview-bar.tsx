"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

/** Faint diagonal "PREVIEW" marks over an unpaid card or song sheet. Decorative. */
export function PreviewWatermark() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none overflow-hidden">
      <div className="absolute -inset-1/2 flex rotate-[-30deg] flex-col justify-center gap-[12%]">
        {Array.from({ length: 7 }, (_, i) => (
          <p key={i} className="whitespace-nowrap text-center font-sans text-[clamp(1.5rem,6cqw,3rem)] font-bold tracking-[0.3em] text-white/30 mix-blend-difference">
            PREVIEW · PREVIEW · PREVIEW · PREVIEW
          </p>
        ))}
      </div>
    </div>
  );
}

type PreviewBarProps = {
  generationId: string;
  noun: "card" | "song";
  priceLabel: string;
  /** What paying unlocks, e.g. "3 more rewrites, editing and downloads". */
  unlocks: string;
  freeRerollsLeft: number;
  busy: boolean;
  onReroll: () => void;
};

/**
 * Actions on a free preview: one free re-roll, then pay to unlock editing,
 * more rewrites and downloads. Payment goes through the same checkout and
 * server prices as everything else.
 */
export function PreviewBar({ generationId, noun, priceLabel, unlocks, freeRerollsLeft, busy, onReroll }: PreviewBarProps) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setPaying(true);
    setError("");
    track("checkout_start", { refId: `preview:${noun}` });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "preview", generationId }),
      });
      const body: { url?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error ?? "Checkout didn't open. Try again.");
      window.location.assign(body.url);
    } catch (err) {
      setPaying(false);
      setError(err instanceof Error ? err.message : "Checkout didn't open. Try again.");
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-ember/60 bg-white p-5">
      <p className="font-semibold">This is a free preview.</p>
      <p className="mt-1 text-ink-muted">Love it? Pay {priceLabel} to unlock {unlocks}.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={pay}
          disabled={paying || busy}
          className="inline-flex min-h-12 items-center rounded-full bg-ink px-7 font-semibold text-snow hover:bg-night-raised disabled:cursor-wait disabled:opacity-70"
        >
          {paying ? "Opening checkout…" : `Pay ${priceLabel}`}
        </button>
        <button
          type="button"
          onClick={onReroll}
          disabled={busy || paying || freeRerollsLeft === 0}
          className="inline-flex min-h-12 items-center rounded-full border border-ink/30 px-6 font-semibold hover:border-ink hover:bg-snow disabled:cursor-not-allowed disabled:opacity-50"
        >
          {freeRerollsLeft > 0 ? "Try another version (1 free)" : "Free re-roll used"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 font-medium text-berry">
          {error}
        </p>
      )}
    </div>
  );
}
