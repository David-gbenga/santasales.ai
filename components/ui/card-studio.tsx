"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CardPreview, type PreviewDesign } from "@/components/ui/card-preview";
import { PreviewBar, PreviewWatermark } from "@/components/ui/preview-bar";
import type { CardWords } from "@/lib/card-fit";

type StudioProps = {
  generationId: string;
  /** Null until paid (free preview). */
  orderId: string | null;
  paid: boolean;
  priceLabel: string;
  initialFreeRerollsLeft: number;
  recipientName: string;
  senderName: string;
  design: PreviewDesign & { name: string };
  initialText: CardWords | null;
  initialRewritesLeft: number;
  initialLocked: boolean;
};

type Busy = null | "generate" | "regenerate" | "finalize";
type ApiReply = { text: CardWords; rewritesLeft: number; freeRerollsLeft: number; locked: boolean };

const LIMITS = { greeting: 60, message: 700, signOff: 60 } as const;

const fieldClass =
  "mt-2 block w-full rounded-md border border-ink/25 bg-white px-4 py-3 text-base text-ink focus-visible:border-ink disabled:bg-snow disabled:text-ink-muted";

const BUSY_MESSAGES: Record<Exclude<Busy, null>, string> = {
  generate: "Writing your message. This takes about 10 seconds…",
  regenerate: "Writing a new version…",
  finalize: "Creating your card…",
};

export function CardStudio(props: StudioProps) {
  const { generationId, orderId, recipientName, senderName, design } = props;
  const [saved, setSaved] = useState<CardWords | null>(props.initialText);
  const [draft, setDraft] = useState<CardWords | null>(props.initialText);
  const [rewrites, setRewrites] = useState(props.initialRewritesLeft);
  const [freeLeft, setFreeLeft] = useState(props.initialFreeRerollsLeft);
  const { paid } = props;
  const [locked, setLocked] = useState(props.initialLocked);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState("");
  const started = useRef(false);
  const router = useRouter();
  const ids = { greeting: useId(), message: useId(), signOff: useId() };

  const call = useCallback(
    async (action: Exclude<Busy, null>, text?: CardWords) => {
      setBusy(action);
      setError("");
      try {
        const res = await fetch("/api/generate/card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, generationId, ...(text ? { text } : {}) }),
        });
        const body: Partial<ApiReply> & { error?: string } = await res.json().catch(() => ({}));
        if (!res.ok || !body.text)
          throw new Error(body.error ?? "Something went wrong. Try again.");
        setSaved(body.text);
        setDraft(body.text);
        setRewrites(body.rewritesLeft ?? 0);
        setFreeLeft(body.freeRerollsLeft ?? 0);
        setLocked(Boolean(body.locked));
        // Finished: re-render the page so the sharing and add-on sections appear.
        if (body.locked) router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      } finally {
        setBusy(null);
      }
    },
    [generationId, router],
  );

  // Write the first version (the free preview) as soon as the studio opens.
  useEffect(() => {
    if (saved || started.current) return;
    started.current = true;
    void call("generate");
  }, [saved, call]);

  const edited =
    draft && saved
      ? draft.greeting !== saved.greeting ||
        draft.message !== saved.message ||
        draft.signOff !== saved.signOff
      : false;

  function update(field: keyof CardWords, value: string) {
    setDraft((d) => (d ? { ...d, [field]: value } : d));
  }

  const downloadBase = `/api/download/${orderId}`;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
      <div className="lg:sticky lg:top-6 lg:self-start">
        {locked ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed image from our download route
          <img
            src={`${downloadBase}?format=png&view=1`}
            alt={`Your finished card for ${recipientName}`}
            width={1500}
            height={2100}
            className="w-full rounded-lg shadow-[0_12px_40px_rgb(19_35_63/0.25)]"
          />
        ) : (
          <div className="relative" style={{ containerType: "inline-size" }} onContextMenu={paid ? undefined : (e) => e.preventDefault()}>
            <CardPreview
              design={design}
              text={draft}
              senderName={senderName}
              placeholder={busy === "generate"}
            />
            {!paid && <PreviewWatermark />}
          </div>
        )}
        <p className="mt-3 text-sm text-ink-muted">{design.name} · 5×7 in · PNG and PDF</p>
      </div>

      <div>
        <h1 className="text-balance font-display text-4xl leading-tight sm:text-5xl">
          {locked ? `Your card for ${recipientName} is ready` : `Your card for ${recipientName}`}
        </h1>

        <p role="status" aria-live="polite" className="mt-4 min-h-7 text-lg text-ink-muted">
          {busy
            ? BUSY_MESSAGES[busy]
            : locked
              ? "Download it below and print at home or send it digitally."
              : saved
                ? paid
                  ? "Read it through. Rewrite it, or change any words you like."
                  : "Here’s your card. Like it? Unlock it below."
                : ""}
        </p>

        {error && (
          <p
            role="alert"
            className="mt-2 rounded-md border border-berry/40 bg-white px-4 py-3 font-medium text-berry"
          >
            {error}
            {!saved && !busy && (
              <button
                type="button"
                onClick={() => call("generate")}
                className="ml-2 underline underline-offset-4"
              >
                Try again
              </button>
            )}
          </p>
        )}

        {!paid && saved ? (
          <PreviewBar
            generationId={generationId}
            noun="card"
            priceLabel={props.priceLabel}
            unlocks="3 more rewrites, editing, and the print-ready PNG and PDF without the watermark"
            freeRerollsLeft={freeLeft}
            busy={busy !== null}
            onReroll={() => call("regenerate")}
          />
        ) : !paid ? null : locked ? (
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`${downloadBase}?format=pdf`}
              className="inline-flex min-h-12 items-center rounded-full bg-ink px-7 font-semibold text-snow hover:bg-night-raised"
            >
              Download PDF
            </a>
            <a
              href={`${downloadBase}?format=png`}
              className="inline-flex min-h-12 items-center rounded-full border border-ink/30 px-7 font-semibold hover:border-ink hover:bg-white"
            >
              Download PNG
            </a>
            <p className="basis-full text-sm text-ink-muted">
              Download links last 24 hours. Bookmark this page: for 30 days it gives you fresh ones.
            </p>
          </div>
        ) : (
          draft && (
            <form
              className="mt-6 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                void call("finalize", draft);
              }}
            >
              <div>
                <label htmlFor={ids.greeting} className="block font-medium">
                  Greeting
                </label>
                <input
                  id={ids.greeting}
                  value={draft.greeting}
                  maxLength={LIMITS.greeting}
                  required
                  disabled={busy !== null}
                  onChange={(e) => update("greeting", e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor={ids.message} className="block font-medium">
                  Message
                </label>
                <textarea
                  id={ids.message}
                  value={draft.message}
                  maxLength={LIMITS.message}
                  required
                  rows={7}
                  disabled={busy !== null}
                  onChange={(e) => update("message", e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor={ids.signOff} className="block font-medium">
                  Sign-off{" "}
                  <span className="font-normal text-ink-muted">
                    (your name, {senderName}, goes underneath)
                  </span>
                </label>
                <input
                  id={ids.signOff}
                  value={draft.signOff}
                  maxLength={LIMITS.signOff}
                  required
                  disabled={busy !== null}
                  onChange={(e) => update("signOff", e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-line-snow pt-6">
                <button
                  type="submit"
                  disabled={busy !== null}
                  className="inline-flex min-h-12 items-center rounded-full bg-ink px-7 font-semibold text-snow hover:bg-night-raised disabled:cursor-wait disabled:opacity-70"
                >
                  {busy === "finalize" ? "Creating your card…" : "Create my card"}
                </button>
                <button
                  type="button"
                  disabled={busy !== null || rewrites === 0}
                  onClick={() => call("regenerate")}
                  className="inline-flex min-h-12 items-center rounded-full border border-ink/30 px-6 font-semibold hover:border-ink hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy === "regenerate" ? "Rewriting…" : "Write a new version"}
                </button>
                <span className="text-sm text-ink-muted tabular-nums">
                  {rewrites === 0
                    ? "No rewrites left: edit the words above instead."
                    : `${rewrites} ${rewrites === 1 ? "rewrite" : "rewrites"} left`}
                </span>
              </div>
              {edited && (
                <p className="text-sm text-ink-muted">
                  You&rsquo;ve edited the words. A new version would replace your changes.{" "}
                  <button
                    type="button"
                    onClick={() => setDraft(saved)}
                    className="underline underline-offset-4"
                  >
                    Undo my edits
                  </button>
                </p>
              )}
              <p className="text-sm text-ink-muted">
                Creating the card locks the words, so check names and spelling first.
              </p>
            </form>
          )
        )}
      </div>
    </div>
  );
}
