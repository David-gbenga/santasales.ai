/**
 * Runs `callback` once the page has loaded and the main thread is idle, so
 * decorative work never competes with first paint or LCP. Returns a cancel function.
 */
export function onIdleAfterLoad(callback: () => void): () => void {
  let cancelled = false;
  let idleId: number | undefined;
  let timeoutId: number | undefined;

  const run = () => {
    if (!cancelled) callback();
  };

  const schedule = () => {
    // requestIdleCallback is missing in older Safari; fall back to a short timeout.
    const ric = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
    if (ric) idleId = ric(run, { timeout: 2500 });
    else timeoutId = window.setTimeout(run, 1200);
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  };
}
