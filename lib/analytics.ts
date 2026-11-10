import type { EventType } from "@/lib/validation";

type TrackOptions = { refId?: string; referrer?: string };

/**
 * Sends a cookie-free analytics event from the browser. Uses sendBeacon so
 * the request survives the page navigating away (e.g. a gallery click).
 * Never throws: analytics must not break the page.
 */
export function track(type: EventType, options: TrackOptions = {}) {
  if (typeof window === "undefined") return;
  // Skip automated browsers (our own tests, crawlers that announce themselves).
  if (navigator.webdriver) return;

  const body = JSON.stringify({
    type,
    path: window.location.pathname,
    refId: options.refId,
    referrer: options.referrer,
  });

  try {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/track", blob)) return;
    void fetch("/api/track", {
      method: "POST",
      body,
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  } catch {
    // ignore: analytics is best-effort
  }
}
