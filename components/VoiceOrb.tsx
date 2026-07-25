"use client";

/**
 * Audio-reactive orb for the voice companion.
 *
 * Layered radial gradients form a warm, sunlit sphere: the grounded primary
 * aura swells with the USER's microphone level while listening, and an amber
 * halo swells with the MODEL's voice while it speaks. Two thin rings ripple
 * outward during model speech.
 *
 * The 60fps ref-mutation animation loop lives in orb/useOrbMotion; the CSS
 * lives in orb/baseStyles + orb/motionStyles (injected here — the orb is a
 * self-contained single-instance component). Ambient motion (idle float,
 * connecting pulse, ripples) is plain CSS keyed off `data-state`.
 * `prefers-reduced-motion` freezes everything; state is still conveyed by
 * the page's aria-live status text (the orb itself is decorative and
 * aria-hidden).
 */
import { ORB_BASE_CSS } from "./orb/baseStyles";
import { ORB_MOTION_CSS } from "./orb/motionStyles";
import { useOrbMotion } from "./orb/useOrbMotion";

export type OrbState = "idle" | "connecting" | "listening" | "speaking";

interface VoiceOrbProps {
  state: OrbState;
  getLevels?: () => { input: number; output: number };
}

export default function VoiceOrb({ state, getLevels }: VoiceOrbProps) {
  const { glowPrimaryRef, glowAmberRef, haloRef, coreRef } = useOrbMotion(
    state,
    getLevels,
  );

  return (
    <div className="voice-orb orb-root" data-state={state} aria-hidden="true">
      <style>{ORB_BASE_CSS + ORB_MOTION_CSS}</style>
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
