"use client";

/**
 * Zero-typing caregiver flow, mirroring the SOS pattern: tap a situation,
 * get an AI "say this, not that" script. If the AI is unavailable, a
 * curated tip list keeps the flow useful.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AiText from "@/components/AiText";
import {
  CAREGIVER_FALLBACK_TIPS,
  CAREGIVER_SITUATIONS,
  type CaregiverSituation,
} from "@/lib/content";

type Result =
  | { status: "loading" }
  | { status: "done"; text: string }
  | { status: "error" };

export default function CaregiverClient() {
  const [situation, setSituation] = useState<CaregiverSituation | null>(null);
  const [result, setResult] = useState<Result>({ status: "loading" });
  const headingRef = useRef<HTMLHeadingElement>(null);

  async function choose(s: CaregiverSituation) {
    setSituation(s);
    setResult({ status: "loading" });
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "caregiver-script",
          context: `${s.label}. ${s.context}`,
        }),
      });
      const data = res.ok ? ((await res.json()) as { text?: string }) : null;
      setResult(data?.text ? { status: "done", text: data.text } : { status: "error" });
    } catch {
      setResult({ status: "error" });
    }
  }

  useEffect(() => {
    if (situation) headingRef.current?.focus();
  }, [situation, result.status]);

  return (
    <div className="space-y-8">
      {!situation ? (
        <section aria-label="Pick your situation" className="grid gap-4 sm:grid-cols-2">
          {CAREGIVER_SITUATIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => choose(s)}
              className="min-h-24 rounded-2xl border border-surface-2 bg-surface p-5 text-left transition hover:border-primary hover:shadow-md active:scale-[0.99]"
            >
              <span className="block text-lg font-semibold">{s.label}</span>
              <span className="mt-1 block text-sm text-muted">{s.context}</span>
            </button>
          ))}
        </section>
      ) : (
        <section aria-busy={result.status === "loading"} className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold">
              {situation.label}
            </h2>
            <button
              type="button"
              onClick={() => setSituation(null)}
              className="rounded-lg border border-surface-2 px-3 py-2 text-sm font-medium hover:bg-surface-2"
            >
              ← Other situations
            </button>
          </div>

          <div className="rounded-2xl border border-primary/30 bg-surface p-6 shadow-sm">
            {result.status === "loading" && (
              <p className="text-muted" aria-live="polite">
                Writing a script for this situation…
              </p>
            )}
            {result.status === "done" && <AiText text={result.text} />}
            {result.status === "error" && (
              <div className="space-y-3">
                <p className="text-sm text-muted" aria-live="polite">
                  The AI script writer is unavailable right now — these fundamentals apply to
                  almost every situation:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  {CAREGIVER_FALLBACK_TIPS.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <section
        aria-label="In a crisis"
        className="rounded-2xl bg-surface-2 p-5 text-sm"
      >
        <h2 className="mb-1 font-semibold">In a crisis</h2>
        <p className="text-muted">
          If they are unresponsive, having a seizure, or you fear an overdose, call{" "}
          <a href="tel:112" className="font-bold underline">
            112
          </a>{" "}
          now. For treatment centres and hospitals around you, see{" "}
          <Link href="/nearby" className="font-semibold text-primary underline">
            Find help nearby
          </Link>
          , and the 24x7 helplines at the bottom of every page.
        </p>
      </section>
    </div>
  );
}
