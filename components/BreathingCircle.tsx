"use client";

import { useEffect, useState } from "react";

const PHASES = [
  { label: "Breathe in", seconds: 4 },
  { label: "Hold", seconds: 4 },
  { label: "Breathe out", seconds: 6 },
] as const;

/**
 * A guided-breathing visual: the circle expands and contracts on a 12s
 * cycle while the phase label is announced to screen readers. Purely
 * client-side so it works even if the network or AI is unavailable.
 */
export default function BreathingCircle() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPhase((p) => (p + 1) % PHASES.length), PHASES[phase].seconds * 1000);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <figure className="flex flex-col items-center gap-6 py-6">
      <div className="relative flex h-52 w-52 items-center justify-center" aria-hidden="true">
        <div className="animate-breathe absolute inset-0 rounded-full bg-primary-soft" />
        <div className="animate-breathe absolute inset-6 rounded-full bg-primary/30" />
        <span className="relative text-lg font-semibold text-primary-strong">
          {PHASES[phase].label}
        </span>
      </div>
      <figcaption aria-live="polite" className="text-muted">
        {PHASES[phase].label} for {PHASES[phase].seconds} seconds… follow the circle.
      </figcaption>
    </figure>
  );
}
