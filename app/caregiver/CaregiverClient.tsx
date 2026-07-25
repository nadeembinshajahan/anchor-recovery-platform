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
    <div className="space-y-6">
      {!situation ? (
        <section aria-label="Pick your situation" className="grid gap-5 sm:grid-cols-2">
          {CAREGIVER_SITUATIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => choose(s)}
              className="glass lift animate-fade-up min-h-28 p-6 text-left"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="block text-lg font-semibold">{s.label}</span>
              <span className="mt-1.5 block text-sm leading-relaxed text-muted">
                {s.context}
              </span>
            </button>
          ))}
        </section>
      ) : (
        <section aria-busy={result.status === "loading"} className="animate-fade-up space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight">
              {situation.label}
            </h2>
            <button
              type="button"
              onClick={() => setSituation(null)}
              className="lift shrink-0 rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold text-muted hover:text-foreground"
            >
              ← Other situations
            </button>
          </div>

          <div className="glass p-7">
            <p className="eyebrow mb-3">For this moment</p>
            {result.status === "loading" && (
              <p className="text-muted" aria-live="polite">
                Writing a script for this situation…
              </p>
            )}
            {result.status === "done" && <AiText text={result.text} />}
            {result.status === "error" && (
              <div className="space-y-3">
                <p className="text-sm text-muted" aria-live="polite">
                  The AI script writer is unavailable right now — these fundamentals apply
                  to almost every situation:
                </p>
                <ul className="space-y-2.5">
                  {CAREGIVER_FALLBACK_TIPS.map((tip) => (
                    <li key={tip} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                      />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <section
        aria-label="In a crisis"
        className="glass p-6"
        style={{ background: "var(--accent-soft)" }}
      >
        <p className="eyebrow mb-2">In a crisis</p>
        <p className="text-sm leading-relaxed text-muted">
          If they are unresponsive, having a seizure, or you fear an overdose, act now —
          don&apos;t wait it out.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <a
            href="tel:112"
            className="lift rounded-full bg-danger px-5 py-2.5 text-sm font-bold text-white"
          >
            Call 112
          </a>
          <a
            href="tel:18005990019"
            className="lift rounded-full bg-surface-solid px-5 py-2.5 text-sm font-semibold shadow-soft"
          >
            KIRAN 1800-599-0019
          </a>
          <Link
            href="/nearby"
            className="lift rounded-full bg-surface-solid px-5 py-2.5 text-sm font-semibold text-primary shadow-soft"
          >
            Find help nearby →
          </Link>
        </div>
      </section>
    </div>
  );
}
