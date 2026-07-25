"use client";

/**
 * First screen of the SOS flow: the glass hero and the tappable
 * situation grid. Pure presentation — selection state lives in SosFlow.
 */
import { SITUATIONS, type Situation } from "./situations";

export default function SituationPicker({
  onChoose,
}: {
  onChoose: (situation: Situation) => void;
}) {
  return (
    <div className="sos-flow sos-picker space-y-7">
      <section className="sos-intro glass overflow-hidden px-6 py-9 text-center sm:px-10 sm:py-11">
        <div className="sos-intro-copy">
          <p className="eyebrow sos-kicker">
            <span className="sos-kicker-dot" aria-hidden="true" />
            You&apos;re in the right place
          </p>
          <h1 className="sos-intro-title mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            What&apos;s happening right now?
          </h1>
          <p className="sos-intro-lede mx-auto mt-3 max-w-lg text-muted">
            Choose what feels closest. We&apos;ll take the next step together.
          </p>
          <div className="sos-assurances" aria-label="How this works">
            <span>
              <i aria-hidden="true">✓</i> One tap
            </span>
            <span>
              <i aria-hidden="true">✓</i> No judgment
            </span>
            <span>
              <i aria-hidden="true">✓</i> No typing
            </span>
          </div>
        </div>
      </section>
      <div className="sos-situations-grid grid gap-4 sm:grid-cols-2">
        {SITUATIONS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChoose(s)}
            data-situation={s.id}
            className="sos-situation-card glass lift animate-fade-up group flex min-h-32 items-start gap-4 p-5 text-left sm:p-6"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span
              aria-hidden="true"
              className="sos-situation-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-xl"
            >
              {s.emoji}
            </span>
            <span className="sos-situation-copy min-w-0 flex-1">
              <span className="sos-situation-title block text-lg font-semibold">
                {s.label}
              </span>
              <span className="sos-situation-detail mt-1.5 block text-sm leading-relaxed text-muted">
                {s.detail}
              </span>
            </span>
            <span className="sos-situation-arrow" aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
