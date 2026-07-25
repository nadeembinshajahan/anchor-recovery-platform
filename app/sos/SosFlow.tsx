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
  const [situation, setSituation] = useState<Situation | null>(null);
  const [script, setScript] = useState<string>(FALLBACK_SCRIPT);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const choose = useCallback(
    async (s: Situation) => {
      setSituation(s);
      setScript(FALLBACK_SCRIPT);
      setPersonalized(false);
      setLoading(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task: "emergency-script",
            context: `${s.label}. ${s.detail}`,
            profile: planToProfile(plan),
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { text?: string };
          if (data.text) {
            setScript(data.text);
            setPersonalized(true);
          }
        }
      } catch {
        // Network/model failure: the fallback script is already on screen.
      } finally {
        setLoading(false);
      }
    },
    [plan],
  );

  useEffect(() => {
    if (situation) headingRef.current?.focus();
  }, [situation]);

  if (!situation) {
    return (
      <div className="space-y-6">
        <section className="glass p-8 text-center">
          <p className="eyebrow">You&apos;re in the right place</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            What&apos;s happening right now?
          </h1>
          <p className="mt-2 text-muted">Tap the closest one. No typing needed.</p>
        </section>
        <div className="grid gap-5 sm:grid-cols-2">
          {SITUATIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => choose(s)}
              className="glass lift animate-fade-up flex min-h-28 items-start gap-4 p-6 text-left"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-xl"
              >
                {s.emoji}
              </span>
              <span>
                <span className="block text-lg font-semibold">{s.label}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">
                  {s.detail}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight">
          <span aria-hidden="true" className="mr-2">
            {situation.emoji}
          </span>
          {situation.label}
        </h1>
        <button
          type="button"
          onClick={() => setSituation(null)}
          className="lift shrink-0 rounded-full border border-card-border bg-surface px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
        >
          ← Choose again
        </button>
      </div>

      <section
        aria-label="Your grounding script"
        aria-busy={loading}
        className="glass overflow-hidden p-6 ring-1 ring-primary/25 sm:p-8"
      >
        <p className="eyebrow mb-4" aria-live="polite">
          {loading
            ? "Personalizing your script…"
            : personalized
              ? plan.name
                ? `Written for you, ${plan.name}`
                : "Written for you just now"
              : "Grounding steps"}
        </p>
        {/* Re-keyed so the personalized script fades in over the fallback. */}
        <div
          key={personalized ? "personal" : "fallback"}
          className={`animate-fade-up leading-relaxed transition-opacity duration-300 ${
            loading ? "opacity-70" : "opacity-100"
          }`}
        >
          <AiText text={script} />
        </div>
      </section>

      <section aria-label="Guided breathing" className="glass p-4">
        <BreathingCircle />
      </section>

      <section aria-label="Reach a person" className="grid gap-4 sm:grid-cols-2">
        {ready && plan.supporterPhone ? (
          <a
            href={`tel:${plan.supporterPhone}`}
            className="lift rounded-full bg-primary px-6 py-4 text-center text-lg font-bold text-white shadow-soft hover:bg-primary-strong"
          >
            Call {plan.supporter || "my person"}
          </a>
        ) : (
          <Link
            href="/plan"
            className="lift rounded-full border-2 border-primary bg-surface px-6 py-4 text-center text-lg font-semibold text-primary shadow-soft"
          >
            Add a trusted contact
          </Link>
        )}
        <a
          href="tel:18005990019"
          className="lift rounded-full bg-danger px-6 py-4 text-center text-lg font-bold text-white shadow-soft hover:opacity-90"
        >
          Call KIRAN helpline
        </a>
      </section>
    </div>
  );
}
