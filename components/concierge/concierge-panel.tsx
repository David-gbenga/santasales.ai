"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ConciergeWidgetView } from "@/components/concierge/concierge-widgets";
import { CONCIERGE_NAME, SusanAvatar } from "@/components/concierge/susan-avatar";
import {
  CONCIERGE_LIMITS,
  type ConciergeMessage,
  type ConciergeReply,
  type ConciergeWidget,
} from "@/lib/concierge/types";

type ChatItem =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; widgets: ConciergeWidget[]; note: string };

const STORAGE_KEY = "giftpost-concierge-v1";
const STARTERS = [
  "A gift for my mum, under £10",
  "Something funny for my brother",
  "Help me write a card for my grandad",
  "I need the links to my order",
];
const GREETING = `Hi, I'm ${CONCIERGE_NAME}! I can help you find a gift for any occasion. Who are you shopping for, and roughly what would you like to spend?`;

function loadChat(): ChatItem[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatItem[]) : [];
  } catch {
    return [];
  }
}

function saveChat(items: ChatItem[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-40)));
  } catch {
    // storage unavailable (private mode etc.): the chat still works for this visit
  }
}

/** History sent to the API: plain text, with a note of what was shown so the model remembers it. */
function toHistory(items: ChatItem[]): ConciergeMessage[] {
  return items.map((i) =>
    i.role === "assistant"
      ? { role: "assistant", content: i.note ? `${i.content}\n${i.note}` : i.content }
      : { role: "user", content: i.content },
  );
}

export default function ConciergePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<ChatItem[]>(loadChat);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const titleId = useId();
  const inputId = useId();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    saveChat(items);
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [items, busy]);

  async function send(text: string) {
    const content = text.trim().slice(0, CONCIERGE_LIMITS.messageChars);
    if (!content || busy) return;
    const next: ChatItem[] = [...items, { role: "user", content }];
    setItems(next);
    setInput("");
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toHistory(next), page: window.location.pathname }),
      });
      const body: Partial<ConciergeReply> & { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !body.reply) throw new Error(body.error ?? "Something went wrong. Try again.");
      setItems([
        ...next,
        {
          role: "assistant",
          content: body.reply,
          widgets: body.widgets ?? [],
          note: body.shownNote ?? "",
        },
      ]);
      setAnnouncement(body.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  function startOver() {
    setItems([]);
    setError("");
    inputRef.current?.focus();
  }

  if (!open) return null;

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      className="fixed inset-x-0 bottom-0 z-50 flex h-[min(100dvh,640px)] flex-col overflow-hidden bg-snow text-ink shadow-[0_-8px_40px_rgb(13_26_49/0.35)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(80dvh,640px)] sm:w-[400px] sm:rounded-xl"
    >
      <header className="flex items-center justify-between gap-3 bg-night px-4 py-3 text-frost">
        <div className="flex items-center gap-3">
          <SusanAvatar size={44} className="ring-2 ring-ember" />
          <div>
            <h2 id={titleId} className="font-display text-xl">
              {CONCIERGE_NAME}, gift concierge
            </h2>
            <p className="text-xs text-frost-muted">
              AI helper. Suggestions only come from this site.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {items.length > 0 && (
            <button
              type="button"
              onClick={startOver}
              className="min-h-10 rounded-full px-3 text-sm text-frost-muted hover:bg-night-raised hover:text-frost"
            >
              Start over
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close chat with ${CONCIERGE_NAME}`}
            className="inline-flex size-10 items-center justify-center rounded-full text-frost-muted hover:bg-night-raised hover:text-frost"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </header>

      <ol
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
        aria-label="Conversation"
      >
        <li className="flex items-start gap-2">
          <SusanAvatar size={32} />
          <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
            <span className="sr-only">{CONCIERGE_NAME}: </span>
            {GREETING}
          </p>
        </li>
        {items.length === 0 && (
          <li className="flex flex-wrap gap-2" aria-label="Suggestions">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="min-h-9 rounded-full border border-ink/25 bg-white px-3 text-left text-sm font-medium hover:border-ink"
              >
                {s}
              </button>
            ))}
          </li>
        )}
        {items.map((item, i) =>
          item.role === "user" ? (
            <li
              key={i}
              className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-ink px-4 py-3 text-snow"
            >
              <span className="sr-only">You: </span>
              {item.content}
            </li>
          ) : (
            <li key={i} className="space-y-3">
              <div className="flex items-start gap-2">
                <SusanAvatar size={32} />
                <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                  <span className="sr-only">{CONCIERGE_NAME}: </span>
                  {item.content}
                </p>
              </div>
              {item.widgets.map((w, j) => (
                <ConciergeWidgetView key={j} widget={w} />
              ))}
            </li>
          ),
        )}
        {busy && (
          <li className="inline-flex items-center gap-1 rounded-2xl bg-white px-4 py-3 text-ink-muted shadow-sm">
            <span className="sr-only">{CONCIERGE_NAME} is typing</span>
            {[0, 1, 2].map((d) => (
              <span
                key={d}
                aria-hidden="true"
                className="size-2 rounded-full bg-ink-muted motion-safe:animate-bounce"
                style={{ animationDelay: `${d * 150}ms` }}
              />
            ))}
          </li>
        )}
      </ol>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {error && (
        <p
          role="alert"
          className="mx-4 mb-2 rounded-md border border-berry/40 bg-white px-3 py-2 text-sm font-medium text-berry"
        >
          {error}
        </p>
      )}

      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 border-t border-line-snow bg-white px-3 py-3"
      >
        <label htmlFor={inputId} className="sr-only">
          Message {CONCIERGE_NAME}, the gift concierge
        </label>
        <textarea
          id={inputId}
          ref={inputRef}
          rows={1}
          value={input}
          maxLength={CONCIERGE_LIMITS.messageChars}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Tell me who it's for…"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border border-ink/25 px-3 py-2.5 text-base focus-visible:border-ink"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 font-semibold text-snow hover:bg-night-raised disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
