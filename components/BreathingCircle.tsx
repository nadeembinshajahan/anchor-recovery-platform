"use client";

import { useEffect, useState } from "react";
import { BREATHING_CSS } from "./breathingStyles";

const PHASES = [
  { label: "Breathe in", seconds: 4 },
  { label: "Hold", seconds: 4 },
  { label: "Breathe out", seconds: 6 },
] as const;

/**
 * A guided-breathing visual: layered gradient circles expand and contract
 * through a 4–4–6 cycle while the phase label is announced to screen readers.
 * Purely client-side CSS animation so it works even if the network or AI
 * is unavailable; `prefers-reduced-motion` collapses it to a static figure.
 */
export default function BreathingCircle() {
  const [phase, setPhase] = useState(0);
  const currentPhase = PHASES[phase];

  useEffect(() => {
    const t = setTimeout(() => setPhase((p) => (p + 1) % PHASES.length), PHASES[phase].seconds * 1000);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <figure className="breathing-guide flex flex-col items-center gap-4 py-5 sm:py-6">
      <style>{BREATHING_CSS}</style>
      <div
        className="breathing-visual"
        data-phase={phase}
        aria-hidden="true"
      >
        <div
          key={phase}
          className="breathing-animation"
          style={{ animationDuration: `${currentPhase.seconds}s` }}
        >
          <div className="breathing-layer breathing-aura" />
          <div className="breathing-layer breathing-ring" />
          <div className="breathing-layer breathing-core" />
        </div>
        <span className="breathing-center">
          <span className="breathing-label">{currentPhase.label}</span>
          <span className="breathing-seconds">{currentPhase.seconds} seconds</span>
        </span>
      </div>
      <figcaption className="breathing-caption">
        <span aria-live="polite" className="breathing-instruction">
          {currentPhase.label} for {currentPhase.seconds} seconds
        </span>
        <span className="breathing-hint">Let the circle set the pace</span>
        <span className="breathing-phase-track" aria-hidden="true">
          {PHASES.map((item, index) => (
            <span
              key={item.label}
              className="breathing-phase-dot"
              data-active={index === phase}
            />
          ))}
        </span>
      </figcaption>
    </figure>
  );
}
