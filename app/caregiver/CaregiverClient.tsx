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
import { planToProfile, useSafetyPlan } from "@/lib/profile";
import { useGenerate } from "@/lib/useGenerate";

export default function CaregiverClient() {
  const [situation, setSituation] = useState<CaregiverSituation | null>(null);
  const { generate, text, loading, error, reset } = useGenerate();
  const { plan } = useSafetyPlan();
  const headingRef = useRef<HTMLHeadingElement>(null);

  function choose(s: CaregiverSituation) {
    setSituation(s);
    reset();
    void generate({
      task: "caregiver-script",
      context: `${s.label}. ${s.context}`,
      profile: planToProfile(plan),
    });
  }

  useEffect(() => {
    if (situation) headingRef.current?.focus();
  }, [situation]);

  return (
    <div className="caregiver-flow">
      {!situation ? (
        <section aria-labelledby="caregiver-situations-heading" className="caregiver-picker">
          <div className="section-heading caregiver-picker-heading">
            <div>
              <p className="eyebrow">Start with what is happening</p>
              <h2 id="caregiver-situations-heading">Choose the closest situation</h2>
            </div>
            <p>You’ll get words you can use and a calmer next step.</p>
          </div>
          <div className="caregiver-choice-grid">
            {CAREGIVER_SITUATIONS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => choose(s)}
                className="caregiver-choice lift animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span aria-hidden="true" className="caregiver-choice-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="caregiver-choice-copy">
                  <span className="caregiver-choice-title">{s.label}</span>
                  <span className="caregiver-choice-context">{s.context}</span>
                </span>
                <span aria-hidden="true" className="caregiver-choice-arrow">
                  ↗
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section
          aria-busy={loading}
          className="caregiver-result animate-fade-up"
        >
          <div className="caregiver-result-heading">
            <div>
              <p className="eyebrow">A steadier way through</p>
              <h2 ref={headingRef} tabIndex={-1}>
                {situation.label}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setSituation(null)}
              className="caregiver-back sun-button sun-button-glass lift"
            >
              ← Other situations
            </button>
          </div>

          <div
            className="caregiver-script"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="caregiver-script-label">
              <span aria-hidden="true">✦</span>
              <p className="eyebrow">For this moment</p>
            </div>
            {loading && (
              <p className="caregiver-script-status text-muted" aria-live="polite">
                <span aria-hidden="true" className="caregiver-thinking-dot" />
                Writing a script for this situation…
              </p>
            )}
            {text && !loading && (
              <div className="caregiver-script-answer">
                <p className="eyebrow">Generated live with Gemini</p>
                <AiText text={text} lang={plan.language} />
              </div>
            )}
            {error && !loading && (
              <div className="caregiver-fallback">
                <p className="text-sm text-muted" aria-live="polite">
                  The AI script writer is unavailable right now — these fundamentals apply
                  to almost every situation:
                </p>
                <ul className="caregiver-fallback-list">
                  {CAREGIVER_FALLBACK_TIPS.map((tip) => (
                    <li key={tip}>
                      <span aria-hidden="true" className="caregiver-tip-mark">
                        ✓
                      </span>
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
        aria-labelledby="caregiver-crisis-heading"
        className="crisis-panel"
      >
        <div aria-hidden="true" className="crisis-panel-icon">
          !
        </div>
        <div className="crisis-panel-copy">
          <p className="eyebrow">Urgent safety</p>
          <h2 id="caregiver-crisis-heading">In a crisis</h2>
          <p>
            If they are unresponsive, having a seizure, or you fear an overdose, act now —
            don&apos;t wait it out.
          </p>
        </div>
        <div className="crisis-panel-actions">
          <a
            href="tel:112"
            className="crisis-action crisis-action-primary lift"
          >
            Call 112
          </a>
          <a
            href="tel:14446"
            className="crisis-action lift"
          >
            De-addiction helpline 14446
          </a>
          <Link
            href="/nearby"
            className="crisis-action crisis-action-link lift"
          >
            Find help nearby →
          </Link>
        </div>
      </section>
    </div>
  );
}
