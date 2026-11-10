"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

// The chat panel is only downloaded when someone opens it, so the landing
// page's first load (and its PageSpeed score) is unaffected.
const ConciergePanel = dynamic(() => import("./concierge-panel"), { ssr: false });

/** Floating "Help me choose a gift" button that opens the Gift Concierge chat. */
export function ConciergeLauncher() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // The launcher is re-rendered only after the panel closes, so move focus
  // back to it once it exists again (keyboard and screen-reader users keep their place).
  useEffect(() => {
    if (!open && wasOpen.current) button.current?.focus();
    wasOpen.current = open;
  }, [open]);

  function openPanel() {
    setLoaded(true);
    setOpen(true);
    track("cta_click", { refId: "concierge:open" });
  }

  function closePanel() {
    setOpen(false);
  }

  return (
    <>
      {!open && (
        <button
          ref={button}
          type="button"
          onClick={openPanel}
          aria-haspopup="dialog"
          className="fixed bottom-4 right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-ember px-5 font-semibold text-night shadow-[0_8px_24px_rgb(13_26_49/0.35)] transition-colors hover:bg-ember-strong sm:bottom-6 sm:right-6"
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="8" width="18" height="13" rx="2" />
            <path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1.5S10 8 12 8zm0 0c2-4 6-4 6-1.5S14 8 12 8z" />
          </svg>
          Help me choose a gift
        </button>
      )}
      {loaded && <ConciergePanel open={open} onClose={closePanel} />}
    </>
  );
}
