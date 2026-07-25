"use client";

/**
 * The audio-reactive animation loop for the voice orb.
 *
 * One requestAnimationFrame loop mutates transforms and opacities directly
 * on element refs — React state is never touched per frame, so the orb
 * animates at 60fps without re-rendering the page. When the orb is not in
 * an active state (or reduced motion is on) the loop does not run at all
 * and control is handed back to the CSS ambient animations.
 */
import { useEffect, useRef, type RefObject } from "react";
import type { OrbState } from "../VoiceOrb";

type LayerRef = RefObject<HTMLDivElement | null>;

export function useOrbMotion(
  state: OrbState,
  getLevels: (() => { input: number; output: number }) | undefined,
): {
  glowPrimaryRef: LayerRef;
  glowAmberRef: LayerRef;
  haloRef: LayerRef;
  coreRef: LayerRef;
} {
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

  return { glowPrimaryRef, glowAmberRef, haloRef, coreRef };
}
