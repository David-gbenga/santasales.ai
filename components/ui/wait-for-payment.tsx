"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const POLL_MS = 2000;
const GIVE_UP_MS = 20_000;

/**
 * Stripe's redirect can arrive before its webhook. Re-render the server page
 * every 2 seconds for up to 20 seconds while the order is still pending.
 */
export function WaitForPayment() {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), POLL_MS);
    const stop = setTimeout(() => {
      clearInterval(interval);
      setTimedOut(true);
    }, GIVE_UP_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, [router]);

  return (
    <p role="status" aria-live="polite" className="mt-4 text-lg text-ink-muted">
      {timedOut
        ? "Your payment went through. Confirmation is taking longer than usual; refresh this page in a few seconds."
        : "This usually takes a few seconds. Your download button will appear here."}
    </p>
  );
}
