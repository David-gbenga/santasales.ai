"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Details stay in the console/server logs; users only see the friendly message.
    console.error(error);
  }, [error]);

  return (
    <main
      id="main"
      className="mx-auto flex max-w-2xl flex-1 flex-col justify-center px-4 py-24 sm:px-6"
    >
      <h1 className="font-display text-5xl text-frost">Something went wrong</h1>
      <p className="mt-4 text-lg text-frost-muted">
        This page didn&rsquo;t load properly. Try again, and if it keeps happening, come back in a
        few minutes.
      </p>
      <div className="mt-8">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-12 items-center rounded-full bg-ember px-6 font-semibold text-night hover:bg-ember-strong"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
