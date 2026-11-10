"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  GREETING_TEXT_MAX,
  GREETING_VOICES,
  SONG_STYLES,
  VOCALS,
  type GreetingVoiceId,
  type SongStyle,
  type Vocal,
} from "@/lib/audio-options";
import { track } from "@/lib/analytics";

export type AddonState = {
  id: string;
  orderId: string | null;
  status: "pending" | "paid" | null;
  audioReady: boolean;
  takesLeft: number;
  input: { style?: SongStyle; vocal?: Vocal; voiceId?: GreetingVoiceId; text?: string };
} | null;

const primary =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-6 font-semibold text-snow hover:bg-night-raised disabled:cursor-wait disabled:opacity-70";
const secondary =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/25 bg-white px-4 text-sm font-semibold hover:border-ink disabled:opacity-50";

function Choice<K extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: Record<K, { label: string; hint?: string }>;
  value: K;
  onChange: (v: K) => void;
}) {
  return (
    <fieldset>
      <legend className="font-medium">{legend}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {(Object.entries(options) as [K, { label: string; hint?: string }][]).map(([key, opt]) => (
          <label key={key} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={key}
              checked={value === key}
              onChange={() => onChange(key)}
              className="peer sr-only"
            />
            <span className="block h-full rounded-md border border-ink/25 bg-white px-3 py-2 peer-checked:border-ink peer-checked:bg-ink peer-checked:text-snow peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember">
              <span className="block font-semibold">{opt.label}</span>
              {opt.hint && <span className="block text-sm opacity-80">{opt.hint}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

async function startCheckout(body: unknown, refId: string): Promise<string | null> {
  track("checkout_start", { refId });
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data: { url?: string; error?: string } = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) return data.error ?? "Checkout didn't open. Try again.";
  window.location.assign(data.url);
  return null;
}

/** Player + recording logic shared by both add-ons once paid. */
function useRecording(addon: NonNullable<AddonState>) {
  const router = useRouter();
  const [ready, setReady] = useState(addon.audioReady);
  const [takesLeft, setTakesLeft] = useState(addon.takesLeft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const started = useRef(false);

  const record = useCallback(
    async (
      action: "generate" | "retake",
      greeting?: { voiceId: GreetingVoiceId; text: string },
    ) => {
      setBusy(true);
      setError("");
      try {
        const res = await fetch("/api/generate/audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            generationId: addon.id,
            action,
            ...(greeting ? { greeting } : {}),
          }),
        });
        const body: { audioReady?: boolean; takesLeft?: number; error?: string } = await res
          .json()
          .catch(() => ({}));
        if (!res.ok || !body.audioReady)
          throw new Error(body.error ?? "Recording didn't work. Try again.");
        setReady(true);
        setTakesLeft(body.takesLeft ?? 0);
        setVersion((v) => v + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Recording didn't work. Try again.");
      } finally {
        setBusy(false);
      }
    },
    [addon.id],
  );

  // Paid but not recorded yet: start straight away. Pending payment: refresh until the webhook lands.
  useEffect(() => {
    if (addon.status === "paid" && !addon.audioReady && !started.current) {
      started.current = true;
      void record("generate");
    }
    if (addon.status === "pending") {
      const t = setInterval(() => router.refresh(), 2500);
      const stop = setTimeout(() => clearInterval(t), 30_000);
      return () => {
        clearInterval(t);
        clearTimeout(stop);
      };
    }
  }, [addon.status, addon.audioReady, record, router]);

  const src = addon.orderId ? `/api/download/${addon.orderId}?format=mp3&view=1&v=${version}` : "";
  const download = addon.orderId ? `/api/download/${addon.orderId}?format=mp3` : "";
  return { ready, takesLeft, busy, error, record, src, download };
}

function Status({
  busy,
  waitingMessage,
  error,
}: {
  busy: boolean;
  waitingMessage: string;
  error: string;
}) {
  return (
    <>
      <p role="status" aria-live="polite" className="mt-3 min-h-6 text-ink-muted">
        {busy ? waitingMessage : ""}
      </p>
      {error && (
        <p role="alert" className="mt-1 font-medium text-berry">
          {error}
        </p>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

export function SongAddon({
  parentId,
  priceLabel,
  addon,
}: {
  parentId: string;
  priceLabel: string;
  addon: AddonState;
}) {
  const [style, setStyle] = useState<SongStyle>("cosy");
  const [vocal, setVocal] = useState<Vocal>("female");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <section
      aria-labelledby="song-addon-title"
      className="rounded-xl border border-line-snow bg-white p-5"
    >
      <h2 id="song-addon-title" className="text-xl font-semibold">
        Hear it sung
      </h2>
      {addon?.status === "paid" ? (
        <PaidSong addon={addon} />
      ) : addon?.status === "pending" ? (
        <p className="mt-2 text-ink-muted" role="status">
          Confirming your payment… this updates in a few seconds.
        </p>
      ) : (
        <>
          <p className="mt-1 text-ink-muted">
            We&rsquo;ll record your lyrics as a full song with a real-sounding singer and music,
            about 1 to 2 minutes long. Includes one retake. MP3 to download and share.
          </p>
          <div className="mt-4 space-y-4">
            <Choice
              legend="Style"
              name="song-style"
              options={SONG_STYLES}
              value={style}
              onChange={setStyle}
            />
            <Choice
              legend="Singer"
              name="song-vocal"
              options={VOCALS}
              value={vocal}
              onChange={setVocal}
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const problem = await startCheckout(
                { kind: "song_audio", parentGenerationId: parentId, input: { style, vocal } },
                "addon:song",
              );
              if (problem) {
                setError(problem);
                setBusy(false);
              }
            }}
            className={`${primary} mt-5`}
          >
            {busy ? "Opening checkout…" : `Pay ${priceLabel} and record my song`}
          </button>
          {error && (
            <p role="alert" className="mt-2 font-medium text-berry">
              {error}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function PaidSong({ addon }: { addon: NonNullable<AddonState> }) {
  const { ready, takesLeft, busy, error, record, src, download } = useRecording(addon);
  const style = addon.input.style ? SONG_STYLES[addon.input.style].label : "";
  return (
    <div className="mt-2">
      <p className="text-ink-muted">
        {style}
        {addon.input.vocal ? ` · ${VOCALS[addon.input.vocal].label}` : ""}
      </p>
      {ready && !busy && (
        <>
          <audio key={src} controls preload="none" src={src} className="mt-3 w-full">
            Your browser can&rsquo;t play this audio.
          </audio>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={download} className={secondary}>
              Download MP3
            </a>
            {takesLeft > 0 && (
              <button type="button" onClick={() => record("retake")} className={secondary}>
                Record a different take
              </button>
            )}
          </div>
        </>
      )}
      <Status
        busy={busy}
        error={error}
        waitingMessage="Recording your song. This can take a minute or two; keep this page open…"
      />
      {!ready && !busy && error && (
        <button type="button" onClick={() => record("generate")} className={`${secondary} mt-2`}>
          Try again
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function VoiceAddon({
  parentId,
  priceLabel,
  addon,
  defaultText,
}: {
  parentId: string;
  priceLabel: string;
  addon: AddonState;
  defaultText: string;
}) {
  const [voiceId, setVoiceId] = useState<GreetingVoiceId>(
    addon?.input.voiceId ?? "JBFqnCBsd6RMkjVDRZzb",
  );
  const [text, setText] = useState(addon?.input.text ?? defaultText);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const textId = useId();
  const voiceOptions = Object.fromEntries(
    Object.entries(GREETING_VOICES).map(([id, v]) => [id, { label: v.name, hint: v.hint }]),
  ) as Record<GreetingVoiceId, { label: string; hint: string }>;

  const editor = (
    <div className="mt-4 space-y-4">
      <div>
        <label htmlFor={textId} className="block font-medium">
          What should it say?
        </label>
        <textarea
          id={textId}
          value={text}
          maxLength={GREETING_TEXT_MAX}
          rows={4}
          onChange={(e) => setText(e.target.value)}
          className="mt-2 block w-full rounded-md border border-ink/25 px-4 py-3 focus-visible:border-ink"
        />
        <p className="mt-1 text-right text-sm tabular-nums text-ink-muted">
          {text.length}/{GREETING_TEXT_MAX}
        </p>
      </div>
      <Choice
        legend="Voice"
        name="greeting-voice"
        options={voiceOptions}
        value={voiceId}
        onChange={setVoiceId}
      />
    </div>
  );

  return (
    <section
      aria-labelledby="voice-addon-title"
      className="rounded-xl border border-line-snow bg-white p-5"
    >
      <h2 id="voice-addon-title" className="text-xl font-semibold">
        Add a voice greeting
      </h2>
      {addon?.status === "paid" ? (
        <PaidVoice addon={addon} editor={editor} voiceId={voiceId} text={text} />
      ) : addon?.status === "pending" ? (
        <p className="mt-2 text-ink-muted" role="status">
          Confirming your payment… this updates in a few seconds.
        </p>
      ) : (
        <>
          <p className="mt-1 text-ink-muted">
            A short spoken message, read by a warm AI voice, that plays when they open your gift.
            You can edit and re-record it.
          </p>
          {editor}
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={async () => {
              setBusy(true);
              const problem = await startCheckout(
                { kind: "voice_greeting", parentGenerationId: parentId, input: { voiceId, text } },
                "addon:voice",
              );
              if (problem) {
                setError(problem);
                setBusy(false);
              }
            }}
            className={`${primary} mt-5`}
          >
            {busy ? "Opening checkout…" : `Pay ${priceLabel} and record it`}
          </button>
          {error && (
            <p role="alert" className="mt-2 font-medium text-berry">
              {error}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function PaidVoice({
  addon,
  editor,
  voiceId,
  text,
}: {
  addon: NonNullable<AddonState>;
  editor: React.ReactNode;
  voiceId: GreetingVoiceId;
  text: string;
}) {
  const { ready, takesLeft, busy, error, record, src, download } = useRecording(addon);
  const [editing, setEditing] = useState(false);
  return (
    <div className="mt-2">
      {ready && !busy && (
        <>
          <audio key={src} controls preload="none" src={src} className="mt-3 w-full">
            Your browser can&rsquo;t play this audio.
          </audio>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={download} className={secondary}>
              Download MP3
            </a>
            {takesLeft > 0 && (
              <button
                type="button"
                aria-expanded={editing}
                onClick={() => setEditing((e) => !e)}
                className={secondary}
              >
                {editing ? "Cancel" : `Edit and re-record (${takesLeft} left)`}
              </button>
            )}
          </div>
          {editing && (
            <>
              {editor}
              <button
                type="button"
                disabled={!text.trim()}
                onClick={async () => {
                  setEditing(false);
                  await record("retake", { voiceId, text });
                }}
                className={`${primary} mt-4`}
              >
                Re-record
              </button>
            </>
          )}
        </>
      )}
      <Status busy={busy} error={error} waitingMessage="Recording your greeting…" />
      {!ready && !busy && error && (
        <button type="button" onClick={() => record("generate")} className={`${secondary} mt-2`}>
          Try again
        </button>
      )}
    </div>
  );
}
