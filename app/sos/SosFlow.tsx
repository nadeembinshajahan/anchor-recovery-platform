"use client";

/**
 * The zero-typing crisis flow. The user only ever taps: pick a situation
 * (SituationPicker), receive a personalized AI script plus a guided
 * breathing exercise, and one-tap actions to reach a person
 * (ContactPanel). A safe generic script is shown immediately while the
 * personalized one loads, so the flow still works if the network or
 * model fails.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import AiText from "@/components/AiText";
import BreathingCircle from "@/components/BreathingCircle";
import { planToProfile, useSafetyPlan } from "@/lib/profile";
import { useGenerate } from "@/lib/useGenerate";
import ContactPanel from "./ContactPanel";
import SituationPicker from "./SituationPicker";
import { FALLBACK_SCRIPT, type Situation } from "./situations";

export default function SosFlow() {
  const { plan, ready } = useSafetyPlan();
  const { generate, loading, sig } = useGenerate();
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
    return <SituationPicker onChoose={choose} />;
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
          {/* The instant fallback script is English; only tag real replies.
              Read-aloud only for the signed AI script — the fallback has no
              signature by design, so it stays silent (and always readable). */}
          <AiText
            text={script}
            lang={personalized ? plan.language : undefined}
            speak={
              personalized
                ? {
                    sig,
                    lang: plan.language !== "en" ? plan.language : undefined,
                    autoplay: true,
                  }
                : undefined
            }
          />
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

      <ContactPanel
        ready={ready}
        supporter={plan.supporter}
        supporterPhone={plan.supporterPhone}
      />
    </div>
  );
}
