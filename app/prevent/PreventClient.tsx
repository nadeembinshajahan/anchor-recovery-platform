"use client";

/**
 * The prevention flow — the "Prevention" half of "Recovery and Prevention".
 *
 * Recovery is easier to defend with a plan made in a calm moment than with
 * willpower in a hard one. The user names an upcoming high-risk situation
 * (tap-first; one optional text field, since planning happens at calm times)
 * and gets a personal plan: prepare-before steps, day-of steps, a
 * word-for-word exit line, an ally ask, and early warning signs.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AiText from "@/components/AiText";
import { planToProfile, useSafetyPlan } from "@/lib/profile";
import { useGenerate } from "@/lib/useGenerate";

const OCCASIONS = [
  { id: "party", emoji: "🎉", label: "A party or celebration", detail: "Drinks or substances will probably be around." },
  { id: "wedding", emoji: "💍", label: "A wedding in the family", detail: "Long days, expectations, and toasts everywhere." },
  { id: "old-friends", emoji: "🕰️", label: "Meeting old using friends", detail: "People connected to the times I used." },
  { id: "payday", emoji: "💸", label: "Payday / money in hand", detail: "Extra cash has been a trigger before." },
  { id: "festival", emoji: "🪔", label: "A festival weekend", detail: "Celebrations, crowds, and old habits colliding." },
  { id: "travel", emoji: "🧳", label: "Travelling alone", detail: "Unstructured time away from my routines." },
] as const;

const FALLBACK_PLAN = `Before:
1. Decide your no-thanks drink or snack order in advance and rehearse it once out loud.
2. Plan your own transport so you can leave the moment you want to.
3. Eat and sleep properly the day before — HALT states make everything harder.

On the day:
1. Arrive late, leave early, and keep your phone charged.
2. Keep a drink you chose in your hand so nobody offers you one.
3. Step outside for two minutes of slow breathing whenever the noise rises.

Tell one person you trust where you'll be and ask them to check in on you once during the event.`;

export default function PreventClient() {
  const { plan } = useSafetyPlan();
  const { generate, loading, error } = useGenerate();
  const [occasion, setOccasion] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
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

  const submitCustom = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const trimmed = custom.trim();
      if (trimmed) {
        void buildFor(trimmed, "A personally risky situation the user described.");
      }
    },
    [buildFor, custom],
  );

  useEffect(() => {
    if (occasion) headingRef.current?.focus();
  }, [occasion]);

  if (!occasion) {
    return (
      <div className="space-y-7">
        <section className="glass overflow-hidden px-6 py-9 text-center sm:px-10 sm:py-11">
          <p className="eyebrow">
            Prevention beats willpower
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Something risky coming up?
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Make the plan now, while you&apos;re steady. Tap what&apos;s ahead and
            we&apos;ll prepare it together.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          {OCCASIONS.map((o, i) => (
            <button
              key={o.id}
              type="button"
              onClick={() => buildFor(o.label, o.detail)}
              className="glass lift animate-fade-up group flex min-h-32 items-start gap-4 p-5 text-left sm:p-6"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-xl"
              >
                {o.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold">{o.label}</span>
                <span className="mt-1.5 block text-sm leading-relaxed text-muted">
                  {o.detail}
                </span>
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={submitCustom} className="glass flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:p-6">
          <div className="min-w-0 flex-1">
            <label htmlFor="custom-occasion" className="mb-1.5 block text-sm font-semibold">
              Something else coming up?
            </label>
            <input
              id="custom-occasion"
              type="text"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              maxLength={200}
              placeholder="e.g. My cousin's engagement next Friday"
              className="w-full rounded-xl border border-card-border bg-surface-2 px-4 py-3"
            />
          </div>
          <button
            type="submit"
            disabled={!custom.trim() || loading}
            className="lift shrink-0 rounded-full bg-primary px-6 py-3 font-semibold text-white disabled:opacity-60"
          >
            Build my plan
          </button>
        </form>
      </div>
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
          <AiText text={planText} />
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
