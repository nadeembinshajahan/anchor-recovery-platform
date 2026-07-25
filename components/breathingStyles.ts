/**
 * CSS for the guided-breathing visual, injected by BreathingCircle via a
 * single <style> tag (self-contained single-instance component).
 */
export const BREATHING_CSS = `
        .breathing-visual {
          position: relative;
          display: grid;
          width: min(15rem, 72vw);
          aspect-ratio: 1;
          place-items: center;
          isolation: isolate;
        }
        .breathing-visual::before {
          content: "";
          position: absolute;
          z-index: -2;
          inset: -12%;
          border-radius: 50%;
          background: radial-gradient(circle,
            color-mix(in srgb, var(--accent) 18%, transparent) 0%,
            transparent 68%);
          filter: blur(18px);
        }
        .breathing-animation {
          position: absolute;
          inset: 0;
          animation-timing-function: cubic-bezier(0.45, 0, 0.24, 1);
          animation-fill-mode: both;
          will-change: transform, opacity;
        }
        .breathing-visual[data-phase="0"] .breathing-animation {
          animation-name: breathing-in;
        }
        .breathing-visual[data-phase="1"] .breathing-animation {
          animation-name: breathing-hold;
        }
        .breathing-visual[data-phase="2"] .breathing-animation {
          animation-name: breathing-out;
        }
        .breathing-layer {
          position: absolute;
          border-radius: 50%;
        }
        .breathing-aura {
          inset: 0;
          background: radial-gradient(circle,
            color-mix(in srgb, var(--accent) 24%, transparent) 0%,
            color-mix(in srgb, var(--accent) 9%, transparent) 54%,
            transparent 73%);
        }
        .breathing-ring {
          inset: 11%;
          border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
          background: color-mix(in srgb, white 18%, transparent);
          box-shadow:
            inset 0 0 24px color-mix(in srgb, white 28%, transparent),
            0 8px 32px color-mix(in srgb, var(--accent) 13%, transparent);
          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
        }
        .breathing-core {
          inset: 25%;
          border: 1px solid color-mix(in srgb, white 76%, transparent);
          background:
            radial-gradient(circle at 35% 27%,
              rgba(255,255,255,0.84) 0%,
              rgba(255,255,255,0.16) 27%,
              transparent 45%),
            radial-gradient(circle at 55% 58%,
              color-mix(in srgb, var(--accent) 52%, white) 0%,
              color-mix(in srgb, var(--primary) 28%, var(--accent)) 100%);
          box-shadow:
            inset -12px -14px 28px color-mix(in srgb, var(--primary) 16%, transparent),
            0 10px 30px color-mix(in srgb, var(--accent) 20%, transparent);
        }
        .breathing-center {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1.15;
          text-shadow: 0 1px 14px rgba(255, 255, 255, 0.42);
        }
        .breathing-label {
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--foreground);
        }
        .breathing-seconds {
          margin-top: 0.35rem;
          font-size: 0.67rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .breathing-caption {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          text-align: center;
        }
        .breathing-instruction {
          font-size: 0.92rem;
          font-weight: 650;
          color: var(--foreground);
        }
        .breathing-hint {
          font-size: 0.78rem;
          color: var(--muted);
        }
        .breathing-phase-track {
          display: flex;
          align-items: center;
          gap: 0.38rem;
          margin-top: 0.45rem;
        }
        .breathing-phase-dot {
          width: 0.38rem;
          height: 0.38rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--muted) 28%, transparent);
          transition:
            width 240ms ease,
            background-color 240ms ease;
        }
        .breathing-phase-dot[data-active="true"] {
          width: 1.3rem;
          background: var(--accent);
        }
        @keyframes breathing-in {
          from { transform: scale(0.73); opacity: 0.78; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes breathing-hold {
          from, to { transform: scale(1); opacity: 1; }
        }
        @keyframes breathing-out {
          from { transform: scale(1); opacity: 1; }
          to { transform: scale(0.73); opacity: 0.78; }
        }
        @media (prefers-reduced-motion: reduce) {
          .breathing-animation {
            animation: none !important;
            transform: none !important;
          }
          .breathing-phase-dot {
            transition: none !important;
          }
        }
`;
