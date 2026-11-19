"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { CONCIERGE_NAME, SusanAvatar } from "./susan-avatar";

// The chat panel is only downloaded when someone opens it, so the landing
// page's first load (and its PageSpeed score) is unaffected.
const ConciergePanel = dynamic(() => import("./concierge-panel"), { ssr: false });

/** How long after landing Susan says hello (long enough not to interrupt the first look). */
const GREETING_DELAY_MS = 4000;
/** Remembered for this browser tab only, so the greeting shows once per visit. */
const GREETED_KEY = "giftpost:susan-greeted";

/** What Susan says first, matched to the page the visitor landed on. */
function greetingFor(path: string): string {
  if (path.startsWith("/premium")) return "Questions about Premium? I can explain the plans and help you join.";
  if (path.startsWith("/cards")) return "Not sure what to write? I can help you make the perfect card.";
  if (path.startsWith("/lyrics")) return "I can help you plan a song they'll love, start to finish.";
  if (path.startsWith("/shop")) return "Looking for something special? Tell me who it's for and I'll suggest a few ideas.";
  if (path.startsWith("/account") || path.startsWith("/login") || path.startsWith("/signup"))
    return "Need a hand with your account or Premium? Just ask.";
  return "Stuck for a present? Tell me who it's for and I'll suggest ideas, or write a card or song with you.";
}

function alreadyGreeted(): boolean {
  try {
    return sessionStorage.getItem(GREETED_KEY) === "1";
  } catch {
    return true; // storage blocked: stay quiet rather than greet on every page
  }
}

function rememberGreeted() {
  try {
    sessionStorage.setItem(GREETED_KEY, "1");
  } catch {
    // ignore: the greeting just may show again
  }
}

/** Floating "Help me choose a gift" button that opens the Gift Concierge chat. */
export function ConciergeLauncher() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [greeting, setGreeting] = useState<string | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const pathname = usePathname();
  const onHome = pathname === "/";

  // The launcher is re-rendered only after the panel closes, so move focus
  // back to it once it exists again (keyboard and screen-reader users keep their place).
  useEffect(() => {
    if (!open && wasOpen.current) button.current?.focus();
    wasOpen.current = open;
  }, [open]);

  // Once per visit, a few seconds after landing, Susan says hello beside her button.
  useEffect(() => {
    if (alreadyGreeted()) return;
    const timer = window.setTimeout(() => {
      rememberGreeted();
      setGreeting(greetingFor(window.location.pathname));
      track("cta_click", { refId: "concierge:greeting" });
    }, GREETING_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  function openPanel(source: "button" | "greeting" = "button") {
    setGreeting(null);
    setLoaded(true);
    setOpen(true);
    track("cta_click", { refId: "concierge:open" }); // counted as "Susan opened" in admin
    if (source === "greeting") track("cta_click", { refId: "concierge:greeting:open" });
  }

  function closePanel() {
    setOpen(false);
  }

  return (
    <>
      {!open && greeting && (
        <div
          role="status"
          aria-live="polite"
          onKeyDown={(e) => {
            if (e.key === "Escape") setGreeting(null);
          }}
          className="susan-greeting fixed bottom-20 right-4 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-line-snow bg-snow p-4 text-ink shadow-[0_8px_24px_rgb(13_26_49/0.25)] sm:bottom-24 sm:right-6"
        >
          <div className="flex items-start gap-3">
            <SusanAvatar size={40} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Hi, I&rsquo;m {CONCIERGE_NAME}, your AI gift helper.</p>
              <p className="mt-1 text-sm text-ink-muted">{greeting}</p>
            </div>
            <button
              type="button"
              onClick={() => setGreeting(null)}
              aria-label={`Dismiss ${CONCIERGE_NAME}'s message`}
              className="-mr-1 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-ink/10 hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={() => openPanel("greeting")}
            aria-haspopup="dialog"
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-4 text-sm font-semibold text-snow hover:bg-night-raised"
          >
            Chat with {CONCIERGE_NAME}
          </button>
        </div>
      )}
      {!open && (
        <button
          ref={button}
          type="button"
          onClick={() => openPanel()}
          aria-haspopup="dialog"
          className="fixed bottom-4 right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-ember px-5 font-semibold text-night shadow-[0_8px_24px_rgb(13_26_49/0.35)] transition-colors hover:bg-ember-strong sm:bottom-6 sm:right-6"
        >
          <SusanAvatar size={36} className="-ml-3 ring-2 ring-night" />
          {onHome ? `Ask ${CONCIERGE_NAME}: help me choose a gift` : `Ask ${CONCIERGE_NAME} for help`}
        </button>
      )}
      {loaded && <ConciergePanel open={open} onClose={closePanel} />}
    </>
  );
}
