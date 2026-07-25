"use client";

/**
 * Audio-reactive orb for the voice companion.
 *
 * Layered radial gradients form a warm, sunlit sphere: the grounded primary
 * aura swells with the USER's microphone level while listening, and an amber
 * halo swells with the MODEL's voice while it speaks. Two thin rings ripple
 * outward during model speech.
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
  const glowPrimaryRef = useRef<HTMLDivElement>(null);
  const glowAmberRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const active = state === "listening" || state === "speaking";
    const layers = [glowPrimaryRef, glowAmberRef, haloRef, coreRef];

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
      if (glowPrimaryRef.current) {
        glowPrimaryRef.current.style.opacity = String(listening ? 0.4 + input * 0.6 : 0.16);
        glowPrimaryRef.current.style.transform = `scale(${1.05 + input * 0.35})`;
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
    <div className="voice-orb orb-root" data-state={state} aria-hidden="true">
      <style>{`
        .orb-root {
          --orb-ease: cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
          width: min(17.5rem, 68vw);
          aspect-ratio: 1;
          margin-inline: auto;
          isolation: isolate;
        }
        .orb-root::after {
          content: "";
          position: absolute;
          z-index: -2;
          left: 22%;
          right: 22%;
          bottom: -2%;
          height: 13%;
          border-radius: 50%;
          background: color-mix(in srgb, var(--accent) 28%, transparent);
          filter: blur(18px);
          opacity: 0.52;
        }
        .orb-layer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          will-change: transform, opacity;
        }
        .orb-aura {
          z-index: -1;
          transition:
            opacity 500ms var(--orb-ease),
            transform 500ms var(--orb-ease);
        }
        .orb-aura-primary {
          background: radial-gradient(circle,
            color-mix(in srgb, var(--primary) 38%, transparent) 0%,
            color-mix(in srgb, var(--primary) 14%, transparent) 43%,
            transparent 72%);
          filter: blur(30px);
          opacity: 0.2;
        }
        .orb-aura-sun {
          background: radial-gradient(circle,
            color-mix(in srgb, var(--accent) 52%, transparent) 0%,
            color-mix(in srgb, var(--accent) 16%, transparent) 48%,
            transparent 74%);
          filter: blur(36px);
          opacity: 0.32;
        }
        .orb-orbit {
          position: absolute;
          border-radius: 50%;
          border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent);
          pointer-events: none;
          opacity: 0.72;
        }
        .orb-orbit-a {
          inset: 5%;
          transform: rotate(-12deg) scaleY(0.93);
        }
        .orb-orbit-b {
          inset: 9%;
          border-color: color-mix(in srgb, var(--primary) 24%, transparent);
          transform: rotate(22deg) scaleX(0.95);
        }
        .orb-halo {
          inset: 7%;
          border: 1px solid color-mix(in srgb, white 56%, transparent);
          background:
            radial-gradient(circle at 70% 72%,
              color-mix(in srgb, var(--accent) 34%, transparent) 0%,
              transparent 48%),
            radial-gradient(circle at 28% 30%,
              color-mix(in srgb, white 56%, transparent) 0%,
              transparent 38%);
          box-shadow:
            inset 0 0 34px color-mix(in srgb, white 22%, transparent),
            0 0 0 8px color-mix(in srgb, white 8%, transparent);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          opacity: 0.68;
          transition: opacity 500ms var(--orb-ease);
        }
        .orb-root[data-state="speaking"] .orb-halo { opacity: 0.95; }
        .orb-core {
          inset: 16%;
          overflow: hidden;
          border: 1px solid color-mix(in srgb, white 74%, transparent);
          background:
            radial-gradient(circle at 31% 24%,
              rgba(255, 255, 255, 0.96) 0%,
              rgba(255, 255, 255, 0.52) 8%,
              transparent 27%),
            radial-gradient(circle at 48% 40%,
              color-mix(in srgb, var(--accent) 18%, white) 0%,
              color-mix(in srgb, var(--accent) 72%, #fff4d2) 56%,
              color-mix(in srgb, var(--primary) 48%, var(--accent)) 100%);
          box-shadow:
            inset -18px -22px 42px color-mix(in srgb, var(--primary-strong) 24%, transparent),
            inset 14px 16px 32px color-mix(in srgb, white 34%, transparent),
            0 16px 42px color-mix(in srgb, var(--accent) 27%, transparent),
            0 5px 18px color-mix(in srgb, var(--primary) 15%, transparent);
        }
        .orb-gloss {
          inset: 16%;
          background:
            radial-gradient(ellipse at 34% 24%,
              rgba(255, 255, 255, 0.66) 0%,
              rgba(255, 255, 255, 0.12) 29%,
              transparent 48%),
            linear-gradient(138deg,
              transparent 52%,
              rgba(255, 255, 255, 0.15) 67%,
              transparent 80%);
          mix-blend-mode: screen;
        }
        .orb-spark {
          position: absolute;
          z-index: 3;
          width: 8px;
          aspect-ratio: 1;
          border-radius: 50%;
          top: 25%;
          left: 29%;
          background: rgba(255, 255, 255, 0.92);
          box-shadow:
            0 0 0 6px rgba(255, 255, 255, 0.13),
            0 0 18px rgba(255, 255, 255, 0.8);
        }
        .orb-ring {
          position: absolute;
          inset: 2%;
          border-radius: 50%;
          border: 1px solid color-mix(in srgb, var(--accent) 58%, transparent);
          opacity: 0;
          pointer-events: none;
        }
        .orb-root[data-state="speaking"] .orb-ring {
          animation: orb-ripple 2s cubic-bezier(0.25, 0.6, 0.35, 1) infinite;
        }
        .orb-root[data-state="speaking"] .orb-ring-b {
          animation-delay: 1.1s;
          border-color: color-mix(in srgb, var(--primary) 42%, transparent);
        }
        .orb-root[data-state="idle"] .orb-core,
        .orb-root[data-state="idle"] .orb-gloss,
        .orb-root[data-state="idle"] .orb-spark {
          animation: orb-float 7s ease-in-out infinite;
        }
        .orb-root[data-state="idle"] .orb-halo {
          animation: orb-float 7s ease-in-out -3.5s infinite;
        }
        .orb-root[data-state="connecting"] .orb-core,
        .orb-root[data-state="connecting"] .orb-gloss,
        .orb-root[data-state="connecting"] .orb-spark {
          animation: orb-pulse 1.5s ease-in-out infinite;
        }
        .orb-root[data-state="listening"] .orb-orbit-b {
          border-color: color-mix(in srgb, var(--primary) 46%, transparent);
        }
        .orb-root[data-state="speaking"] .orb-orbit-a {
          border-color: color-mix(in srgb, var(--accent) 68%, transparent);
        }
        @keyframes orb-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.025); }
        }
        @keyframes orb-pulse {
          0%, 100% { transform: scale(0.97); opacity: 0.88; }
          50% { transform: scale(1.025); opacity: 1; }
        }
        @keyframes orb-ripple {
          0% { transform: scale(0.92); opacity: 0.68; }
          100% { transform: scale(1.38); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .orb-root *,
          .orb-root::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
      <div ref={glowPrimaryRef} className="orb-layer orb-aura orb-aura-primary" />
      <div ref={glowAmberRef} className="orb-layer orb-aura orb-aura-sun" />
      <span className="orb-orbit orb-orbit-a" />
      <span className="orb-orbit orb-orbit-b" />
      <span className="orb-ring" />
      <span className="orb-ring orb-ring-b" />
      <div ref={haloRef} className="orb-layer orb-halo" />
      <div ref={coreRef} className="orb-layer orb-core" />
      <div className="orb-layer orb-gloss" />
      <span className="orb-spark" />
    </div>
  );
}
