"use client";

/**
 * Audio-reactive orb for the voice companion.
 *
 * Layered radial gradients form an organic sphere: a teal core that swells
 * with the USER's microphone level while listening, and a warm amber halo +
 * glow that swell with the MODEL's voice while it speaks. Two thin rings
 * ripple outward during model speech.
 *
 * Animation strategy: one requestAnimationFrame loop mutates transforms and
 * opacities directly on element refs — React state is never touched per
 * frame, so the orb animates at 60fps without re-rendering the page.
 * Ambient motion (idle float, connecting pulse, ripples) is plain CSS keyed
 * off `data-state`. `prefers-reduced-motion` freezes everything; state is
 * still conveyed by the page's aria-live status text (the orb itself is
 * decorative and aria-hidden).
 */
import { useEffect, useRef } from "react";

export type OrbState = "idle" | "connecting" | "listening" | "speaking";

interface VoiceOrbProps {
  state: OrbState;
  getLevels?: () => { input: number; output: number };
}

export default function VoiceOrb({ state, getLevels }: VoiceOrbProps) {
  const glowTealRef = useRef<HTMLDivElement>(null);
  const glowAmberRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const active = state === "listening" || state === "speaking";
    const layers = [glowTealRef, glowAmberRef, haloRef, coreRef];

    if (!active || !getLevels || reduceMotion) {
      // Hand control back to the CSS ambient animations.
      layers.forEach((ref) => {
        if (ref.current) {
          ref.current.style.transform = "";
          ref.current.style.opacity = "";
        }
      });
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = () => {
      const { input, output } = getLevels();
      const t = (performance.now() - start) / 1000;
      // Two slow sine waves make the sphere feel alive between words.
      const wobble = Math.sin(t * 2.1) * 0.012 + Math.sin(t * 3.7) * 0.008;
      const listening = state === "listening";
      const voice = listening ? input : output;

      if (coreRef.current) {
        coreRef.current.style.transform = `scale(${1 + wobble + voice * (listening ? 0.17 : 0.09)})`;
      }
      if (haloRef.current) {
        haloRef.current.style.transform = `scale(${1.02 + wobble * 1.5 + voice * (listening ? 0.1 : 0.3)})`;
      }
      if (glowTealRef.current) {
        glowTealRef.current.style.opacity = String(listening ? 0.4 + input * 0.6 : 0.16);
        glowTealRef.current.style.transform = `scale(${1.05 + input * 0.35})`;
      }
      if (glowAmberRef.current) {
        glowAmberRef.current.style.opacity = String(!listening ? 0.42 + output * 0.58 : 0.14);
        glowAmberRef.current.style.transform = `scale(${1.05 + output * 0.4})`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state, getLevels]);

  return (
    <div className="orb-root" data-state={state} aria-hidden="true">
      <style>{`
        .orb-root {
          position: relative;
          width: min(260px, 60vw);
          aspect-ratio: 1;
          margin-inline: auto;
        }
        .orb-layer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          will-change: transform, opacity;
        }
        .orb-glow-teal {
          background: radial-gradient(circle,
            color-mix(in srgb, var(--primary) 55%, transparent) 0%,
            transparent 70%);
          filter: blur(26px);
          opacity: 0.18;
          transition: opacity 400ms ease;
        }
        .orb-glow-amber {
          background: radial-gradient(circle,
            color-mix(in srgb, var(--accent) 55%, transparent) 0%,
            transparent 70%);
          filter: blur(30px);
          opacity: 0.14;
          transition: opacity 400ms ease;
        }
        .orb-halo {
          inset: 4%;
          background: radial-gradient(circle at 62% 68%,
            color-mix(in srgb, var(--accent) 42%, transparent) 0%,
            color-mix(in srgb, var(--accent) 16%, transparent) 45%,
            transparent 72%);
          opacity: 0.55;
          transition: opacity 500ms ease;
        }
        .orb-root[data-state="speaking"] .orb-halo { opacity: 0.95; }
        .orb-core {
          inset: 12%;
          background: radial-gradient(circle at 36% 30%,
            color-mix(in srgb, var(--primary) 34%, white) 0%,
            color-mix(in srgb, var(--primary) 88%, transparent) 48%,
            var(--primary-strong) 100%);
          box-shadow:
            inset 0 -18px 40px color-mix(in srgb, var(--primary-strong) 55%, transparent),
            0 10px 40px color-mix(in srgb, var(--primary) 28%, transparent);
        }
        @media (prefers-color-scheme: dark) {
          .orb-core {
            background: radial-gradient(circle at 36% 30%,
              color-mix(in srgb, var(--primary) 75%, white) 0%,
              color-mix(in srgb, var(--primary) 45%, transparent) 52%,
              color-mix(in srgb, var(--primary-strong) 30%, transparent) 100%);
          }
        }
        .orb-gloss {
          inset: 12%;
          background: radial-gradient(circle at 32% 22%,
            rgba(255, 255, 255, 0.55) 0%,
            rgba(255, 255, 255, 0.08) 26%,
            transparent 45%);
        }
        .orb-ring {
          position: absolute;
          inset: 2%;
          border-radius: 50%;
          border: 1.5px solid color-mix(in srgb, var(--accent) 65%, transparent);
          opacity: 0;
          pointer-events: none;
        }
        .orb-root[data-state="speaking"] .orb-ring {
          animation: orb-ripple 2s cubic-bezier(0.25, 0.6, 0.35, 1) infinite;
        }
        .orb-root[data-state="speaking"] .orb-ring-b {
          animation-delay: 1s;
          border-color: color-mix(in srgb, var(--primary) 55%, transparent);
        }
        .orb-root[data-state="idle"] .orb-core,
        .orb-root[data-state="idle"] .orb-gloss {
          animation: orb-float 7s ease-in-out infinite;
        }
        .orb-root[data-state="idle"] .orb-halo {
          animation: orb-float 7s ease-in-out -3.5s infinite;
        }
        .orb-root[data-state="connecting"] .orb-core,
        .orb-root[data-state="connecting"] .orb-gloss {
          animation: orb-pulse 1.5s ease-in-out infinite;
        }
        @keyframes orb-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-7px) scale(1.035); }
        }
        @keyframes orb-pulse {
          0%, 100% { transform: scale(0.96); opacity: 0.85; }
          50% { transform: scale(1.03); opacity: 1; }
        }
        @keyframes orb-ripple {
          0% { transform: scale(0.95); opacity: 0.75; }
          100% { transform: scale(1.45); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .orb-root * { animation: none !important; transition: none !important; }
        }
      `}</style>
      <div ref={glowTealRef} className="orb-layer orb-glow-teal" />
      <div ref={glowAmberRef} className="orb-layer orb-glow-amber" />
      <span className="orb-ring" />
      <span className="orb-ring orb-ring-b" />
      <div ref={haloRef} className="orb-layer orb-halo" />
      <div ref={coreRef} className="orb-layer orb-core" />
      <div className="orb-layer orb-gloss" />
    </div>
  );
}
