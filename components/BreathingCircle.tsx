"use client";

import { useEffect, useState } from "react";

const PHASES = [
  { label: "Breathe in", seconds: 4 },
  { label: "Hold", seconds: 4 },
  { label: "Breathe out", seconds: 6 },
] as const;

/**
 * A guided-breathing visual: layered gradient circles expand and contract
 * on a 12s cycle while the phase label is announced to screen readers.
 * Purely client-side CSS animation so it works even if the network or AI
 * is unavailable; `prefers-reduced-motion` collapses it to a static figure.
 */
export default function BreathingCircle() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPhase((p) => (p + 1) % PHASES.length), PHASES[phase].seconds * 1000);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <figure className="flex flex-col items-center gap-6 py-6">
      <div className="relative flex h-56 w-56 items-center justify-center" aria-hidden="true">
        {/* Warm outer halo */}
        <div
          className="animate-breathe absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, var(--accent-soft), transparent 72%)",
          }}
        />
        {/* Soft teal mid layer */}
        <div
          className="animate-breathe absolute inset-5 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, var(--primary-soft), transparent 78%)",
            animationDelay: "150ms",
          }}
        />
        {/* Core */}
        <div
          className="animate-breathe absolute inset-12 rounded-full shadow-soft"
          style={{
            background:
              "radial-gradient(circle at 42% 34%, color-mix(in srgb, var(--primary) 38%, transparent), color-mix(in srgb, var(--primary) 14%, transparent) 70%)",
            animationDelay: "300ms",
          }}
        />
        <span className="relative text-lg font-semibold tracking-tight text-primary-strong">
          {PHASES[phase].label}
        </span>
      </div>
      <figcaption aria-live="polite" className="eyebrow">
        {PHASES[phase].label} for {PHASES[phase].seconds} seconds — follow the circle
      </figcaption>
    </figure>
  );
}
