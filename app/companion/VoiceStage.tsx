"use client";

/**
 * Voice-mode hero: the audio-reactive orb, live status line, and the
 * start/end call-to-action. Pure presentation — session state lives in
 * the parent Companion component.
 */
import VoiceOrb, { type OrbState } from "@/components/VoiceOrb";
import type { LiveStatus } from "@/lib/liveClient";

const STATUS_TEXT: Record<LiveStatus, string> = {
  connecting: "Connecting…",
  live: "Listening — just start talking.",
  "model-speaking": "Pulari is speaking…",
  closed: "Session ended.",
  error: "Something went wrong.",
};

const ORB_STATE: Record<LiveStatus | "idle", OrbState> = {
  idle: "idle",
  connecting: "connecting",
  live: "listening",
  "model-speaking": "speaking",
  closed: "idle",
  error: "idle",
};

interface VoiceStageProps {
  status: LiveStatus | "idle";
  voiceActive: boolean;
  notice: string;
  onStart: () => void;
  onStop: () => void;
  getLevels: () => { input: number; output: number };
}

export default function VoiceStage({
  status,
  voiceActive,
  notice,
  onStart,
  onStop,
  getLevels,
}: VoiceStageProps) {
  return (
    <section
      aria-label="Voice conversation"
      className="companion-stage glass overflow-hidden px-5 py-8 text-center sm:px-10 sm:py-10"
    >
      <header className="companion-header">
        <div className="companion-kicker-row">
          <p className="eyebrow">
            <span className="companion-kicker-dot" aria-hidden="true" />
            Voice companion
          </p>
          <span
            className="companion-private-badge"
            aria-label="Voice responses are generated live with Google Gemini"
          >
            <span aria-hidden="true">◦</span>
            Gemini Live
          </span>
        </div>
        <h1 className="companion-title mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Talk it out
        </h1>
        <p className="companion-lede mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
          No perfect words needed. Pulari will meet you gently, right where
          you are.
        </p>
      </header>

      <div className="companion-orb-stage my-7 sm:my-9">
        <div className="companion-orb-light" aria-hidden="true" />
        <VoiceOrb state={ORB_STATE[status]} getLevels={getLevels} />
      </div>

      <p
        aria-live="polite"
        data-status={status}
        className="companion-status mx-auto min-h-6 w-fit font-medium text-muted"
      >
        <span className="companion-status-dot" aria-hidden="true" />
        {status === "idle"
          ? "Tap the button, then speak naturally."
          : STATUS_TEXT[status]}
      </p>

      <button
        type="button"
        aria-pressed={voiceActive}
        onClick={voiceActive ? onStop : onStart}
        disabled={status === "connecting"}
        data-active={voiceActive ? "true" : "false"}
        className={`companion-primary-action lift mt-6 inline-flex min-w-56 items-center justify-center gap-3 rounded-full px-8 py-4 text-base font-bold text-white shadow-lg disabled:opacity-60 ${
          voiceActive
            ? "companion-primary-action-stop bg-danger"
            : "companion-primary-action-start bg-primary hover:bg-primary-strong"
        }`}
      >
        <span aria-hidden="true" className="companion-action-icon text-xl leading-none">
          {status === "connecting" ? "…" : voiceActive ? "■" : "●"}
        </span>
        {status === "connecting"
          ? "Connecting"
          : voiceActive
            ? "End conversation"
            : "Start talking"}
      </button>

      {notice && (
        <p
          role="status"
          className="companion-notice mx-auto mt-6 max-w-lg rounded-2xl bg-surface-2 px-4 py-3 text-sm"
        >
          {notice}
        </p>
      )}

      <ul className="companion-promises" aria-label="What to expect">
        <li>
          <span aria-hidden="true">✓</span> Talk naturally
        </li>
        <li>
          <span aria-hidden="true">✓</span> Pause anytime
        </li>
        <li>
          <span aria-hidden="true">✓</span> No transcript saved by Pulari
        </li>
      </ul>
    </section>
  );
}
