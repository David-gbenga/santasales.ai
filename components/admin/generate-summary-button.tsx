"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GenerateSummaryButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/summary", { method: "POST" });
      const body: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "That didn't work. Try again.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={generate}
        disabled={busy}
        className="inline-flex min-h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-snow hover:bg-night-raised disabled:cursor-wait disabled:opacity-70"
      >
        {busy ? "Writing the summary…" : "Generate summary"}
      </button>
      <p role="status" aria-live="polite" className="text-sm text-berry">
        {error}
      </p>
    </div>
  );
}
