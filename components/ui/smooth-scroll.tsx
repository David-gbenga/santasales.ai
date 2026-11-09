"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { onIdleAfterLoad } from "@/lib/idle";

/**
 * Lenis smooth scrolling for the whole page. Skipped entirely when the
 * visitor prefers reduced motion, and torn down if that preference changes.
 */
export function SmoothScroll() {
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;

    function sync() {
      if (query.matches) {
        lenis?.destroy();
        lenis = null;
      } else if (!lenis) {
        lenis = new Lenis({ autoRaf: true, anchors: true });
      }
    }

    // Smooth scrolling is a nicety; set it up after load so it never delays first paint.
    const cancelIdle = onIdleAfterLoad(() => {
      sync();
      query.addEventListener("change", sync);
    });
    return () => {
      cancelIdle();
      query.removeEventListener("change", sync);
      lenis?.destroy();
    };
  }, []);

  return null;
}
