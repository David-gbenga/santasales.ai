"use client";

import Link from "next/link";
import { useState } from "react";
import { track } from "@/lib/analytics";
import type { ConciergeWidget } from "@/lib/concierge/types";

/**
 * Starts Stripe Checkout (shop items) or a free preview (cards and songs)
 * through the same endpoints the site's own buttons and forms use. Prices are
 * decided on the server.
 */
function usePay(body: unknown, refId: string, endpoint: "/api/checkout" | "/api/preview") {
  const [state, setState] = useState<{ busy: boolean; error: string }>({ busy: false, error: "" });
  async function pay() {
    setState({ busy: true, error: "" });
    track(endpoint === "/api/checkout" ? "checkout_start" : "cta_click", { refId });
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: { url?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout didn't open. Try again.");
      window.location.assign(data.url);
    } catch (err) {
      setState({
        busy: false,
        error: err instanceof Error ? err.message : "Checkout didn't open.",
      });
    }
  }
  return { ...state, pay };
}

/** Drops closing punctuation so the teaser can end with an ellipsis cleanly. */
const trimEnding = (s: string) => s.trim().replace(/[.,!?;:…]+$/, "");

const box = "overflow-hidden rounded-xl border border-line-snow bg-white";
const primary =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-4 text-sm font-semibold text-snow hover:bg-night-raised disabled:cursor-wait disabled:opacity-70";

function PayButton({
  label,
  body,
  refId,
  endpoint = "/api/checkout",
}: {
  label: string;
  body: unknown;
  refId: string;
  endpoint?: "/api/checkout" | "/api/preview";
}) {
  const { busy, error, pay } = usePay(body, refId, endpoint);
  return (
    <div>
      <button type="button" onClick={pay} disabled={busy} className={primary}>
        {busy ? (endpoint === "/api/checkout" ? "Opening checkout…" : "Starting your preview…") : label}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-berry">
          {error}
        </p>
      )}
    </div>
  );
}

export function ConciergeWidgetView({ widget }: { widget: ConciergeWidget }) {
  switch (widget.type) {
    case "product":
      return (
        <div className={`${box} flex gap-3 p-3`}>
          {widget.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- small local preview
            <img
              src={widget.imageUrl}
              alt=""
              width={64}
              height={80}
              className="h-20 w-16 shrink-0 rounded object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{widget.name}</p>
            <p className="text-sm text-ink-muted">{widget.priceLabel} · instant download</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <PayButton
                label={`Buy for ${widget.priceLabel}`}
                body={{ kind: "product", productId: widget.id }}
                refId={`concierge:${widget.id}`}
              />
              <Link href={widget.href} className="text-sm font-medium underline underline-offset-4">
                Details
              </Link>
            </div>
          </div>
        </div>
      );

    case "gallery":
      return (
        <a
          href={widget.url}
          target="_blank"
          rel={widget.isAffiliate ? "sponsored noopener" : "noopener"}
          onClick={() => track("gallery_click", { refId: widget.id })}
          className={`${box} flex gap-3 p-3 hover:border-ink/40`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- remote gallery image */}
          <img
            src={widget.imageUrl}
            alt=""
            width={64}
            height={64}
            className="size-16 shrink-0 rounded object-cover"
          />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{widget.title}</span>
            <span className="block text-sm text-ink-muted">
              Opens on {widget.store}
              <span className="sr-only"> (new tab)</span>
            </span>
            {widget.isAffiliate && (
              <span className="mt-1 inline-block rounded-full border border-ink/25 px-2 py-0.5 text-xs text-ink-muted">
                Affiliate link
              </span>
            )}
          </span>
        </a>
      );

    case "card_offer":
      return (
        <div className={box}>
          <div className="flex gap-3 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- media bucket image */}
            <img
              src={widget.imageUrl}
              alt=""
              width={72}
              height={101}
              className="h-[101px] w-[72px] shrink-0 rounded object-cover ring-1 ring-ink/15"
            />
            <div className="min-w-0">
              <p className="font-semibold">Card for {widget.recipientName}</p>
              <p className="text-sm text-ink-muted">
                {widget.designName} design · {widget.priceLabel}
              </p>
              <blockquote className="mt-2 border-l-2 border-ember pl-3 font-display text-ink">
                <span className="sr-only">Opening line: </span>&ldquo;{trimEnding(widget.teaser)}
                &hellip;&rdquo;
              </blockquote>
            </div>
          </div>
          <div className="border-t border-line-snow p-3">
            <PayButton
              label="Write the full card (free preview)"
              endpoint="/api/preview"
              body={{ kind: "card", designSlug: widget.designSlug, input: widget.input }}
              refId={`concierge:card:${widget.designSlug}`}
            />
            <p className="mt-2 text-xs text-ink-muted">
              See the whole card before paying. Pay {widget.priceLabel} only if you love it.
            </p>
          </div>
        </div>
      );

    case "song_offer":
      return (
        <div className={box}>
          <div className="p-3">
            <p className="font-semibold">Song for {widget.recipientName}</p>
            <p className="text-sm text-ink-muted">
              {widget.summary} · {widget.priceLabel}
            </p>
            <blockquote className="mt-2 border-l-2 border-ember pl-3 font-display text-ink">
              <span className="sr-only">Opening line: </span>&ldquo;{trimEnding(widget.teaser)}
              &hellip;&rdquo;
            </blockquote>
          </div>
          <div className="border-t border-line-snow p-3">
            <PayButton
              label="Write the full song (free preview)"
              endpoint="/api/preview"
              body={{ kind: "lyrics", input: widget.input }}
              refId="concierge:song"
            />
            <p className="mt-2 text-xs text-ink-muted">
              Read it and hear a sung sample before paying. {widget.priceLabel} for the full sung song.
            </p>
          </div>
        </div>
      );
  }
}
