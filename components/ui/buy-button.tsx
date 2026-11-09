"use client";

import { useState } from "react";

type State = { status: "idle" } | { status: "loading" } | { status: "error"; message: string };

/** Starts Stripe Checkout for a product. The price is decided on the server, never here. */
export function BuyButton({ productId, label }: { productId: string; label: string }) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function startCheckout() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "product", productId }),
      });
      const body: { url?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) {
        throw new Error(body.error ?? "Checkout didn't open. Please try again in a moment.");
      }
      window.location.assign(body.url);
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Checkout didn't open. Please try again.",
      });
    }
  }

  const loading = state.status === "loading";

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-7 text-base font-semibold text-snow transition-colors hover:bg-night-raised disabled:cursor-wait disabled:opacity-80"
      >
        {loading ? "Opening checkout…" : label}
      </button>
      <p role="status" aria-live="polite" className="mt-3 min-h-6 text-berry">
        {state.status === "error" ? state.message : ""}
      </p>
    </div>
  );
}
