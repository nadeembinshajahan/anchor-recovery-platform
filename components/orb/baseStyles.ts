/**
 * Structural CSS for the voice orb: the layered sphere itself (auras,
 * orbit lines, halo, core, gloss, spark). Motion/state styles live in
 * motionStyles.ts; both are injected by VoiceOrb via a single <style> tag
 * because the orb is a self-contained, single-instance component.
 */
export const ORB_BASE_CSS = `
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
`;
