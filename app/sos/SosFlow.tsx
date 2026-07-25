"use client";

/**
 * The zero-typing crisis flow. The user only ever taps: pick a situation,
 * receive a personalized AI script plus a guided breathing exercise, and
 * one-tap actions to call their supporter or a helpline. A safe generic
 * script is shown immediately while the personalized one streams in, so
 * the flow still works if the network or model fails.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AiText from "@/components/AiText";
import BreathingCircle from "@/components/BreathingCircle";
import { planToProfile, useSafetyPlan } from "@/lib/profile";
import { useGenerate } from "@/lib/useGenerate";

const SITUATIONS = [
  { id: "craving", emoji: "🌊", label: "I'm having a craving", detail: "An intense urge to use is building right now." },
  { id: "overwhelmed", emoji: "🌀", label: "I'm overwhelmed", detail: "Panic, anxiety or racing thoughts are taking over." },
  { id: "risky-place", emoji: "📍", label: "I'm somewhere risky", detail: "I am near people or places connected to using." },
  { id: "lonely", emoji: "🫂", label: "I feel alone", detail: "Isolation and low mood are pulling me down." },
  { id: "slipped", emoji: "🌱", label: "I slipped", detail: "I used and I am scared or ashamed. I need next steps, not judgment." },
  { id: "cant-sleep", emoji: "🌙", label: "I can't sleep", detail: "It is late, I am restless and my thoughts are loud." },
] as const;

type Situation = (typeof SITUATIONS)[number];

const FALLBACK_SCRIPT = `1. You are safe in this moment. Put both feet flat on the floor.
2. Take one slow breath in through your nose for four counts.
3. Hold it gently for four counts, then let it out for six.
4. Name five things you can see around you, out loud or in your head.
5. This feeling is a wave — it rises, peaks, and always passes.
6. Stay with the breathing circle below until it settles.

You reached out. That is the strongest thing you could do right now.`;

export default function SosFlow() {
  const { plan, ready } = useSafetyPlan();
  const { generate, loading } = useGenerate();
  const [situation, setSituation] = useState<Situation | null>(null);
  const [script, setScript] = useState<string>(FALLBACK_SCRIPT);
  const [personalized, setPersonalized] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const choose = useCallback(
    async (s: Situation) => {
      setSituation(s);
      setScript(FALLBACK_SCRIPT);
      setPersonalized(false);
      // The fallback script is already on screen; on any failure the hook
      // returns null and we simply keep it.
      const text = await generate({
        task: "emergency-script",
        context: `${s.label}. ${s.detail}`,
        profile: planToProfile(plan),
      });
      if (text) {
        setScript(text);
        setPersonalized(true);
      }
    },
    [generate, plan],
  );

  useEffect(() => {
    if (situation) headingRef.current?.focus();
  }, [situation]);

  if (!situation) {
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
              onClick={() => choose(s)}
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

  return (
    <div className="sos-flow sos-result mx-auto max-w-3xl space-y-6">
      <div className="sos-result-header flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Let&apos;s steady this moment</p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="sos-result-title mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
          >
            <span aria-hidden="true" className="sos-result-icon mr-2">
              {situation.emoji}
            </span>
            {situation.label}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setSituation(null)}
          className="sos-back-button lift shrink-0 rounded-full border border-card-border bg-surface px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
        >
          ← Choose again
        </button>
      </div>

      <section
        aria-label="Your grounding script"
        aria-busy={loading}
        className="sos-grounding-card glass overflow-hidden p-6 sm:p-8"
      >
        <div
          className="sos-script-meta mb-5"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <p
            className="eyebrow sos-script-label"
            data-source={personalized ? "gemini" : "offline"}
          >
            <span className="sos-script-status" aria-hidden="true" />
            {personalized
              ? "Generated live with Gemini"
              : "Offline safety steps"}
          </p>
          <span className="sos-script-note">
            {loading
              ? "Gemini is preparing a personal version…"
              : personalized
                ? plan.name
                  ? `Personalized for ${plan.name}`
                  : "Personalized for this moment"
                : "Ready even if Gemini is unavailable"}
          </span>
        </div>
        {/* Re-keyed so the personalized script fades in over the fallback. */}
        <div
          key={personalized ? "personal" : "fallback"}
          className={`sos-script-body animate-fade-up leading-relaxed transition-opacity duration-300 ${
            loading ? "opacity-70" : "opacity-100"
          }`}
        >
          <AiText text={script} />
        </div>
      </section>

      <section
        aria-label="Guided breathing"
        className="sos-breathing-card glass p-4 sm:p-6"
      >
        <div className="sos-section-heading">
          <div>
            <p className="eyebrow">Stay with the rhythm</p>
            <h2>Breathe through this wave</h2>
          </div>
          <span>About 2 minutes</span>
        </div>
        <BreathingCircle />
      </section>

      <section
        aria-label="Reach a person"
        className="sos-contact-panel glass p-5 sm:p-6"
      >
        <div className="sos-contact-heading">
          <span className="sos-contact-mark" aria-hidden="true">
            ↗
          </span>
          <div>
            <h2>You don&apos;t have to hold this alone.</h2>
            <p>A real person can stay with you while the feeling passes.</p>
          </div>
        </div>
        <div className="sos-contact-actions mt-5 grid gap-3 sm:grid-cols-2">
          {ready && plan.supporterPhone ? (
            <a
              href={`tel:${plan.supporterPhone}`}
              className="sos-contact-button sos-contact-primary lift rounded-full bg-primary px-6 py-4 text-center text-base font-bold text-white shadow-soft hover:bg-primary-strong"
            >
              Call {plan.supporter || "my person"}
            </a>
          ) : (
            <Link
              href="/plan"
              className="sos-contact-button sos-contact-secondary lift rounded-full border-2 border-primary bg-surface px-6 py-4 text-center text-base font-semibold text-primary shadow-soft"
            >
              Add a trusted contact
            </Link>
          )}
          <a
            href="tel:14446"
            className="sos-contact-button sos-contact-helpline lift rounded-full bg-danger px-6 py-4 text-center text-base font-bold text-white shadow-soft hover:opacity-90"
          >
            Call de-addiction helpline
          </a>
        </div>
      </section>
    </div>
  );
}
