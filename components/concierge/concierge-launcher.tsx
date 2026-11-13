"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { CONCIERGE_NAME, SusanAvatar } from "./susan-avatar";

// The chat panel is only downloaded when someone opens it, so the landing
// page's first load (and its PageSpeed score) is unaffected.
const ConciergePanel = dynamic(() => import("./concierge-panel"), { ssr: false });

/** Floating "Help me choose a gift" button that opens the Gift Concierge chat. */
export function ConciergeLauncher() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const onHome = usePathname() === "/";

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
          <SusanAvatar size={36} className="-ml-3 ring-2 ring-night" />
          {onHome ? `Ask ${CONCIERGE_NAME}: help me choose a gift` : `Ask ${CONCIERGE_NAME} for help`}
        </button>
      )}
      {loaded && <ConciergePanel open={open} onClose={closePanel} />}
    </>
  );
}
