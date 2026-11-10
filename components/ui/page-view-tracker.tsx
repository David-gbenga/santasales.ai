"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

/** Logs one page_view per route change. Cookie-free; the path is all we record. */
export function PageViewTracker() {
  const pathname = usePathname();
  const isFirstView = useRef(true);

  useEffect(() => {
    // Only the landing view carries the external referrer; later views are internal.
    const referrer = isFirstView.current ? document.referrer || undefined : undefined;
    isFirstView.current = false;
    track("page_view", { referrer });
  }, [pathname]);

  return null;
}
