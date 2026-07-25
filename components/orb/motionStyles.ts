/**
 * Motion and state CSS for the voice orb: ripple rings during model
 * speech, idle float, connecting pulse, per-state accent shifts, and the
 * reduced-motion kill switch. Structure styles live in baseStyles.ts.
 */
export const ORB_MOTION_CSS = `
  .orb-root[data-state="speaking"] .orb-halo { opacity: 0.95; }
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
`;
