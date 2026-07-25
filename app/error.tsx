"use client";

/**
 * Global error boundary. In a crisis-support app an error page must never be
 * a dead end: alongside recovery it keeps one-tap routes to human help.
 * Model/API failures are already handled gracefully per feature — this
 * boundary only catches unexpected rendering faults.
 */
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log for operators; never shown to the user.
    console.error("Unexpected UI error:", error);
  }, [error]);

  return (
    <div className="glass mx-auto my-10 max-w-xl p-8 text-center">
      <p className="eyebrow">A bump in the road</p>
      <h1 className="mt-2 text-3xl font-semibold">Something broke — you didn&apos;t.</h1>
      <p className="mt-3 text-muted">
        A part of the page hit an unexpected error. Trying again usually fixes it,
        and the helplines below work no matter what.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className="sun-button sun-button-primary lift">
          Try again
        </button>
        <Link href="/" className="sun-button sun-button-glass lift">
          Go home
        </Link>
      </div>
      <p className="mt-6 text-sm text-muted">
        Need a person right now?{" "}
        <a href="tel:112" className="font-semibold underline underline-offset-2">
          Call 112
        </a>{" "}
        ·{" "}
        <a href="tel:14446" className="font-semibold underline underline-offset-2">
          De-addiction helpline 14446
        </a>{" "}
        ·{" "}
        <Link href="/nearby" className="font-semibold underline underline-offset-2">
          Find help nearby
        </Link>
      </p>
    </div>
  );
}
