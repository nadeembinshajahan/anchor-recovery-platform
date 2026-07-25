"use client";

/**
 * The prevention flow — the "Prevention" half of "Recovery and Prevention".
 *
 * Recovery is easier to defend with a plan made in a calm moment than with
 * willpower in a hard one. The user names an upcoming high-risk situation
 * (OccasionPicker) and gets a personal plan: prepare-before steps, day-of
 * steps, a word-for-word exit line, an ally ask, and early warning signs.
 * A safe general plan renders instantly and stays if generation fails.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AiText from "@/components/AiText";
import { planToProfile, useSafetyPlan } from "@/lib/profile";
import { useGenerate } from "@/lib/useGenerate";
import OccasionPicker from "./OccasionPicker";
import { FALLBACK_PLAN } from "./occasions";

export default function PreventClient() {
  const { plan } = useSafetyPlan();
  const { generate, loading, error, sig } = useGenerate();
  const [occasion, setOccasion] = useState<string | null>(null);
  const [planText, setPlanText] = useState<string>(FALLBACK_PLAN);
  const [personalized, setPersonalized] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const buildFor = useCallback(
    async (label: string, detail: string) => {
      setOccasion(label);
      setPlanText(FALLBACK_PLAN);
      setPersonalized(false);
      const text = await generate({
        task: "prevention-plan",
        context: `${label}. ${detail}`,
        profile: planToProfile(plan),
      });
      if (text) {
        setPlanText(text);
        setPersonalized(true);
      }
    },
    [generate, plan],
  );

  useEffect(() => {
    if (occasion) headingRef.current?.focus();
  }, [occasion]);

  if (!occasion) {
    return (
      <OccasionPicker
        loading={loading}
        onChoose={buildFor}
        onCustom={(text) =>
          void buildFor(text, "A personally risky situation the user described.")
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Your plan for this</p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {occasion}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setOccasion(null)}
          className="lift shrink-0 rounded-full border border-card-border bg-surface px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
        >
          ← Plan another
        </button>
      </div>

      <section aria-label="Your prevention plan" aria-busy={loading} className="glass overflow-hidden p-6 sm:p-8">
        <div className="mb-5" role="status" aria-live="polite" aria-atomic="true">
          <p className="eyebrow">
            {personalized ? "Generated live with Gemini" : "Ready-anyway plan"}
          </p>
          <span className="text-sm text-muted">
            {loading
              ? "Gemini is preparing a personal version…"
              : personalized
                ? plan.name
                  ? `Personalized for ${plan.name}`
                  : "Personalized for this situation"
                : error
                  ? "The assistant is busy — these steps work regardless."
                  : "A safe general plan while yours loads"}
          </span>
        </div>
        <div
          key={personalized ? "personal" : "fallback"}
          className={`animate-fade-up leading-relaxed transition-opacity duration-300 ${
            loading ? "opacity-70" : "opacity-100"
          }`}
        >
          {/* The fallback plan is English; only tag real generated output.
              Read-aloud is signature-gated, so the unsigned fallback never
              autoplays — by design. */}
          <AiText
            text={planText}
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

      <section className="glass flex flex-col items-center justify-between gap-3 p-5 text-center sm:flex-row sm:text-left">
        <p className="text-sm text-muted">
          If the urge hits anyway, don&apos;t negotiate with it alone.
        </p>
        <Link
          href="/sos"
          className="lift shrink-0 rounded-full bg-danger px-5 py-2.5 text-sm font-bold text-white"
        >
          Get help now →
        </Link>
      </section>
    </div>
  );
}
