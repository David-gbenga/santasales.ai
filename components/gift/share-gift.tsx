"use client";

import { useId, useState } from "react";
import { track } from "@/lib/analytics";
import { OCCASIONS, giftPhrase, type Occasion } from "@/lib/occasions";

type ShareGiftProps = {
  orderId: string;
  recipientName: string;
  senderName: string;
  anonymous: boolean;
  occasion: Occasion;
  noun: "card" | "song";
  initialUrl: string | null;
  initialActive: boolean;
};

const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink/25 bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-ink";

/**
 * Creates the private gift link and hands it to the buyer's own apps
 * (WhatsApp, email, the phone's share sheet). Nothing is sent from our
 * servers, so there's no risk of the site being used to message strangers.
 */
export function ShareGift({
  orderId,
  recipientName,
  senderName,
  anonymous,
  occasion,
  noun,
  initialUrl,
  initialActive,
}: ShareGiftProps) {
  const [url, setUrl] = useState(initialUrl);
  const [active, setActive] = useState(initialActive && Boolean(initialUrl));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const noteId = useId();

  const phrase = giftPhrase(occasion, noun);
  // Anonymous gifts never say who made them, in the text at least.
  const intro = anonymous
    ? `${recipientName}, someone made you ${phrase}.`
    : `${recipientName}, I made you ${phrase}.`;
  const message = `${intro} Open it here: ${url}`;

  async function update(action: "create" | "revoke") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "create"
            ? { action, orderId, note: note.trim() || undefined }
            : { action, orderId },
        ),
      });
      const body: { url?: string; active?: boolean; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error ?? "That didn't work. Try again.");
      setUrl(body.url);
      setActive(Boolean(body.active));
      setStatus(
        body.active ? "Your gift link is ready." : "The link is switched off. It no longer opens.",
      );
      if (action === "create") track("cta_click", { refId: `share:create:${noun}` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied.");
    } catch {
      setStatus("Copy didn't work here. Press and hold the link to copy it.");
    }
  }

  async function nativeShare() {
    if (!url) return;
    try {
      await navigator.share({
        title: `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)} for ${recipientName}`,
        text: intro,
        url,
      });
      track("cta_click", { refId: `share:native:${noun}` });
    } catch {
      // cancelled by the user: nothing to do
    }
  }

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <section
      aria-labelledby="share-title"
      className="rounded-xl border border-line-snow bg-white p-5"
    >
      <h2 id="share-title" className="text-xl font-semibold">
        Send it to {recipientName}
      </h2>

      {!active ? (
        <>
          <p className="mt-1 text-ink-muted">
            Make a private link that opens your {noun} on any phone or computer. Only people you
            send it to can see it, and you can switch it off any time.
          </p>
          <label htmlFor={noteId} className="mt-4 block font-medium">
            Add a short note <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          <input
            id={noteId}
            value={note}
            maxLength={300}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`e.g. ${OCCASIONS[occasion].greeting}! ${anonymous ? "Guess who?" : `Love, ${senderName}`}`}
            className="mt-2 block w-full rounded-md border border-ink/25 px-4 py-3 focus-visible:border-ink"
          />
          <button
            type="button"
            onClick={() => update("create")}
            disabled={busy}
            className="mt-4 inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-semibold text-snow hover:bg-night-raised disabled:opacity-70"
          >
            {busy ? "Making your link…" : url ? "Switch the link back on" : "Make a gift link"}
          </button>
        </>
      ) : (
        <>
          <p className="mt-1 text-ink-muted">Send it however you like:</p>
          {anonymous && (
            <p className="mt-2 rounded-md border border-ember/60 bg-snow px-3 py-2 text-sm">
              Your name isn&rsquo;t on the {noun} or the gift page. But a message from your own
              phone or email shows it came from you, so for a real surprise ask a friend to send the
              link.
            </p>
          )}
          <p className="mt-3 break-all rounded-md bg-snow px-3 py-2 font-mono text-sm">{url}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener"
              onClick={() => track("cta_click", { refId: `share:whatsapp:${noun}` })}
              className={button}
            >
              WhatsApp
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(`${phrase.charAt(0).toUpperCase()}${phrase.slice(1)} for you`)}&body=${encodeURIComponent(message)}`}
              onClick={() => track("cta_click", { refId: `share:email:${noun}` })}
              className={button}
            >
              Email
            </a>
            <button type="button" onClick={copy} className={button}>
              Copy link
            </button>
            {canNativeShare && (
              <button type="button" onClick={nativeShare} className={button}>
                More apps…
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => update("revoke")}
            disabled={busy}
            className="mt-4 text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
          >
            Switch this link off
          </button>
        </>
      )}

      <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm text-pine">
        {status}
      </p>
      {error && (
        <p role="alert" className="mt-1 text-sm font-medium text-berry">
          {error}
        </p>
      )}
    </section>
  );
}
