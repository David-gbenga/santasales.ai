"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type LyricsWords = { title: string; body: string };

type StudioProps = {
  generationId: string;
  orderId: string;
  recipientName: string;
  senderName: string;
  initialText: LyricsWords | null;
  initialRewritesLeft: number;
  initialLocked: boolean;
};

type Busy = null | "generate" | "regenerate" | "finalize";
type ApiReply = { text: LyricsWords; rewritesLeft: number; locked: boolean };

const BUSY_MESSAGES: Record<Exclude<Busy, null>, string> = {
  generate: "Writing your song. This takes about 15 seconds…",
  regenerate: "Writing a new version…",
  finalize: "Saving your song…",
};

const fieldClass =
  "mt-2 block w-full rounded-md border border-ink/25 bg-white px-4 py-3 text-base text-ink focus-visible:border-ink disabled:bg-snow disabled:text-ink-muted";

/** Splits the body into labelled sections for display. Mirrors lib/lyrics-render.ts. */
function sections(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((l) => l.trimEnd()))
    .filter((lines) => lines.some((l) => l.trim()))
    .map((lines) => {
      const m = lines[0].trim().match(/^\[(.{1,30})\]$/);
      return m ? { label: m[1], lines: lines.slice(1) } : { label: null, lines };
    });
}

function SongSheet({
  text,
  recipientName,
  senderName,
}: {
  text: LyricsWords;
  recipientName: string;
  senderName: string;
}) {
  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-[0_12px_40px_rgb(19_35_63/0.18)]">
      <header className="bg-night px-6 py-7 text-frost sm:px-8">
        <h2 className="text-balance font-display text-3xl leading-tight sm:text-4xl">
          {text.title}
        </h2>
        <p className="mt-2 text-sm text-frost-muted">
          A Christmas song for {recipientName}, from {senderName}
        </p>
      </header>
      <div className="space-y-6 px-6 py-7 sm:px-8">
        {sections(text.body).map((s, i) => (
          <section key={i}>
            {s.label && <h3 className="text-sm font-semibold text-berry">{s.label}</h3>}
            <p className="mt-1 whitespace-pre-line font-display text-lg leading-relaxed text-ink">
              {s.lines.join("\n")}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}

export function LyricsStudio(props: StudioProps) {
  const { generationId, orderId, recipientName, senderName } = props;
  const [saved, setSaved] = useState<LyricsWords | null>(props.initialText);
  const [draft, setDraft] = useState<LyricsWords | null>(props.initialText);
  const [editing, setEditing] = useState(false);
  const [rewrites, setRewrites] = useState(props.initialRewritesLeft);
  const [locked, setLocked] = useState(props.initialLocked);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState("");
  const started = useRef(false);
  const router = useRouter();
  const ids = { title: useId(), body: useId() };

  const call = useCallback(
    async (action: Exclude<Busy, null>, text?: LyricsWords) => {
      setBusy(action);
      setError("");
      try {
        const res = await fetch("/api/generate/lyrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, generationId, ...(text ? { text } : {}) }),
        });
        const body: Partial<ApiReply> & { error?: string } = await res.json().catch(() => ({}));
        if (!res.ok || !body.text)
          throw new Error(body.error ?? "Something went wrong. Try again.");
        setSaved(body.text);
        setDraft(body.text);
        setEditing(false);
        setRewrites(body.rewritesLeft ?? 0);
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

  useEffect(() => {
    if (saved || started.current) return;
    started.current = true;
    void call("generate");
  }, [saved, call]);

  const edited = draft && saved ? draft.title !== saved.title || draft.body !== saved.body : false;
  const download = `/api/download/${orderId}`;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
      <div>
        {draft ? (
          <SongSheet text={draft} recipientName={recipientName} senderName={senderName} />
        ) : (
          <div
            role="img"
            aria-label="Song being written"
            className="overflow-hidden rounded-lg bg-white shadow-[0_12px_40px_rgb(19_35_63/0.18)]"
          >
            <div className="h-28 bg-night" />
            <div className={`space-y-3 p-8 ${busy ? "motion-safe:animate-pulse" : ""}`}>
              {[0.3, 0.9, 0.8, 0.85, 0.7, 0, 0.25, 0.9, 0.75].map((w, i) => (
                <span
                  key={i}
                  className="block h-4 rounded-full bg-line-snow"
                  style={{ width: `${w * 100}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <h1 className="text-balance font-display text-4xl leading-tight sm:text-5xl">
          {locked ? `Your song for ${recipientName} is ready` : `Your song for ${recipientName}`}
        </h1>
        <p role="status" aria-live="polite" className="mt-4 min-h-7 text-lg text-ink-muted">
          {busy
            ? BUSY_MESSAGES[busy]
            : locked
              ? "Download it below: a PDF to print and a text file to share."
              : saved
                ? "Read it through, or sing it. Rewrite it, or change any line you like."
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

        {locked ? (
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`${download}?format=pdf`}
              className="inline-flex min-h-12 items-center rounded-full bg-ink px-7 font-semibold text-snow hover:bg-night-raised"
            >
              Download PDF
            </a>
            <a
              href={`${download}?format=txt`}
              className="inline-flex min-h-12 items-center rounded-full border border-ink/30 px-7 font-semibold hover:border-ink hover:bg-white"
            >
              Download text
            </a>
            <p className="basis-full text-sm text-ink-muted">
              Download links last 24 hours. Bookmark this page: for 30 days it gives you fresh ones.
            </p>
          </div>
        ) : (
          draft && (
            <div className="mt-6 space-y-5">
              {editing && (
                <>
                  <div>
                    <label htmlFor={ids.title} className="block font-medium">
                      Title
                    </label>
                    <input
                      id={ids.title}
                      value={draft.title}
                      maxLength={80}
                      disabled={busy !== null}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor={ids.body} className="block font-medium">
                      Lyrics{" "}
                      <span className="font-normal text-ink-muted">
                        (keep labels like [Chorus] on their own line)
                      </span>
                    </label>
                    <textarea
                      id={ids.body}
                      value={draft.body}
                      maxLength={4000}
                      rows={16}
                      disabled={busy !== null}
                      onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                      className={`${fieldClass} font-mono text-sm`}
                    />
                  </div>
                </>
              )}

              <div className="flex flex-wrap items-center gap-3 border-t border-line-snow pt-6">
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => call("finalize", draft)}
                  className="inline-flex min-h-12 items-center rounded-full bg-ink px-7 font-semibold text-snow hover:bg-night-raised disabled:cursor-wait disabled:opacity-70"
                >
                  {busy === "finalize" ? "Saving your song…" : "Save my song"}
                </button>
                <button
                  type="button"
                  aria-expanded={editing}
                  disabled={busy !== null}
                  onClick={() => setEditing((e) => !e)}
                  className="inline-flex min-h-12 items-center rounded-full border border-ink/30 px-6 font-semibold hover:border-ink hover:bg-white disabled:opacity-50"
                >
                  {editing ? "Done editing" : "Edit the words"}
                </button>
                <button
                  type="button"
                  disabled={busy !== null || rewrites === 0}
                  onClick={() => call("regenerate")}
                  className="inline-flex min-h-12 items-center rounded-full border border-ink/30 px-6 font-semibold hover:border-ink hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy === "regenerate" ? "Rewriting…" : "Write a new version"}
                </button>
              </div>
              <p className="text-sm text-ink-muted tabular-nums">
                {rewrites === 0
                  ? "No rewrites left: edit the words instead."
                  : `${rewrites} ${rewrites === 1 ? "rewrite" : "rewrites"} left.`}{" "}
                Saving locks the words, so check names and spelling first.
              </p>
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
            </div>
          )
        )}
      </div>
    </div>
  );
}
