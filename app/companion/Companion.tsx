"use client";

/**
 * "Talk it out" — a hands-free voice companion.
 *
 * Primary mode: full-duplex Gemini Live audio (see lib/liveClient.ts) with
 * an audio-reactive orb driven by real microphone/model amplitude.
 * Fallback mode: if the browser can't run the audio pipeline or the Live
 * connection fails, the page degrades to zero-typing quick phrases that go
 * through /api/generate, with replies read aloud via speech synthesis.
 * Either way, the user never has to type.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import AiText from "@/components/AiText";
import VoiceOrb, { type OrbState } from "@/components/VoiceOrb";
import {
  startLiveSession,
  supportsLiveVoice,
  type LiveSessionHandle,
  type LiveStatus,
} from "@/lib/liveClient";
import { planToProfile, useSafetyPlan } from "@/lib/profile";
import { useGenerate } from "@/lib/useGenerate";

const QUICK_PHRASES = [
  "I'm having a hard day",
  "I feel a craving coming",
  "Tell me something encouraging",
  "Help me get through the next hour",
  "I'm proud of something today",
  "I can't stop overthinking",
] as const;

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

type Mode = "voice" | "chips";
type ReplySource = "gemini" | "fallback";

/** Capability never changes during a session, so subscribers never fire. */
const subscribeNoop = () => () => {};

export default function Companion() {
  const { plan } = useSafetyPlan();
  const { generate } = useGenerate();
  const [mode, setMode] = useState<Mode>("voice");
  const [status, setStatus] = useState<LiveStatus | "idle">("idle");
  const [reply, setReply] = useState<string>("");
  const [replySource, setReplySource] = useState<ReplySource | null>(null);
  const [busyPhrase, setBusyPhrase] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>("");
  const sessionRef = useRef<LiveSessionHandle | null>(null);

  // Browser capability is an external, immutable-per-session fact — read it
  // via useSyncExternalStore (server snapshot assumes support so the voice UI
  // is what gets server-rendered; the client corrects itself on hydration).
  const voiceSupported = useSyncExternalStore(
    subscribeNoop,
    supportsLiveVoice,
    () => true,
  );
  const effectiveMode: Mode = voiceSupported ? mode : "chips";
  const effectiveNotice =
    !voiceSupported && !notice
      ? "Live voice isn't available in this browser, so tap a phrase instead."
      : notice;

  // Always release the mic and socket when leaving the page.
  useEffect(() => {
    return () => sessionRef.current?.stop();
  }, []);

  const stopVoice = useCallback(() => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setStatus("idle");
  }, []);

  const startVoice = useCallback(async () => {
    setNotice("");
    try {
      const handle = await startLiveSession({
        onStatus: (s) => setStatus(s),
        onError: () => {
          setMode("chips");
          setNotice("The voice connection dropped — switched to tap-to-talk.");
        },
      });
      sessionRef.current = handle;
    } catch {
      setStatus("idle");
      setMode("chips");
      setNotice("Couldn't start live voice — switched to tap-to-talk instead.");
    }
  }, []);

  /** Stable callback so VoiceOrb's rAF loop survives re-renders untouched. */
  const getLevels = useCallback(
    () => sessionRef.current?.getLevels() ?? { input: 0, output: 0 },
    [],
  );

  const sendPhrase = useCallback(
    async (phrase: string) => {
      setBusyPhrase(phrase);
      setReply("");
      setReplySource(null);
      const text = await generate({
        task: "companion-reply",
        context: phrase,
        profile: planToProfile(plan),
      });
      if (text) {
        setReply(text);
        setReplySource("gemini");
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
        }
      } else {
        setReply("I couldn't reach the assistant just now, but I'm still here. Try again in a moment.");
        setReplySource("fallback");
      }
      setBusyPhrase(null);
    },
    [generate, plan],
  );

  const voiceActive = status !== "idle" && status !== "closed" && status !== "error";

  return (
    <div className="companion-shell mx-auto max-w-4xl space-y-6">
      {effectiveMode === "voice" ? (
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
            onClick={voiceActive ? stopVoice : startVoice}
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

          {effectiveNotice && (
            <p
              role="status"
              className="companion-notice mx-auto mt-6 max-w-lg rounded-2xl bg-surface-2 px-4 py-3 text-sm"
            >
              {effectiveNotice}
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
      ) : (
        <section aria-label="Tap to talk" className="companion-fallback space-y-6">
          <div className="companion-intro glass overflow-hidden p-7 text-center sm:p-9">
            <div className="companion-kicker-row companion-kicker-row-centered">
              <p className="eyebrow">
                <span className="companion-kicker-dot" aria-hidden="true" />
                Tap-to-talk companion
              </p>
            </div>
            <h1 className="companion-title mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              What feels closest?
            </h1>
            <p className="companion-lede mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
              Choose a thought below. Pulari will answer out loud, so you never
              need to find the words.
            </p>
            {effectiveNotice && (
              <p
                role="status"
                className="companion-notice mx-auto mt-5 max-w-lg rounded-2xl bg-surface-2 px-4 py-3 text-sm"
              >
                {effectiveNotice}
              </p>
            )}
          </div>

          <div className="quick-phrase-grid grid gap-4 sm:grid-cols-2">
            {QUICK_PHRASES.map((phrase, index) => (
              <button
                key={phrase}
                type="button"
                onClick={() => sendPhrase(phrase)}
                disabled={busyPhrase !== null}
                aria-busy={busyPhrase === phrase}
                className="quick-phrase-card glass lift animate-fade-up group flex min-h-20 items-center gap-4 px-5 py-4 text-left font-medium disabled:opacity-60"
                style={{ animationDelay: `${index * 55}ms` }}
              >
                <span className="quick-phrase-mark" aria-hidden="true">
                  {busyPhrase === phrase ? "…" : "“"}
                </span>
                <span className="quick-phrase-copy flex-1">
                  {busyPhrase === phrase ? "Thinking…" : phrase}
                </span>
                <span className="quick-phrase-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            ))}
          </div>

          {reply && (
            <article
              role="status"
              aria-live="polite"
              aria-atomic="true"
              data-source={replySource ?? "fallback"}
              className="companion-reply glass animate-fade-up p-6 sm:p-7"
            >
              <div className="companion-reply-heading">
                <span className="companion-reply-avatar" aria-hidden="true">
                  A
                </span>
                <div>
                  <p className="eyebrow">
                    {replySource === "gemini"
                      ? "Generated live with Gemini"
                      : "Connection fallback"}
                  </p>
                  <span>
                    {replySource === "gemini"
                      ? "Made for this moment"
                      : "Not generated by Gemini"}
                  </span>
                </div>
              </div>
              <div className="companion-reply-body mt-4">
                <AiText text={reply} />
              </div>
            </article>
          )}
        </section>
      )}

      <footer className="companion-privacy-note">
        <span className="companion-privacy-icon" aria-hidden="true">
          ◇
        </span>
        <p>
          Live voice responds only to what you say in that session; it does not
          receive your saved safety plan. Audio is streamed to Google Gemini and
          is not recorded or stored by Pulari. In an emergency, call 112.
        </p>
      </footer>
    </div>
  );
}
