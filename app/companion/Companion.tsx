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
  "model-speaking": "Anchor is speaking…",
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

/** Capability never changes during a session, so subscribers never fire. */
const subscribeNoop = () => () => {};

export default function Companion() {
  const { plan } = useSafetyPlan();
  const [mode, setMode] = useState<Mode>("voice");
  const [status, setStatus] = useState<LiveStatus | "idle">("idle");
  const [reply, setReply] = useState<string>("");
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
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task: "companion-reply",
            context: phrase,
            profile: planToProfile(plan),
          }),
        });
        const data = (await res.json()) as { text?: string; error?: string };
        const text = data.text ?? data.error ?? "I'm here with you. Take one slow breath.";
        setReply(text);
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
        }
      } catch {
        setReply("I couldn't reach the assistant just now, but I'm still here. Try again in a moment.");
      } finally {
        setBusyPhrase(null);
      }
    },
    [plan],
  );

  const voiceActive = status !== "idle" && status !== "closed" && status !== "error";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {effectiveMode === "voice" ? (
        <section aria-label="Voice conversation" className="glass px-6 py-10 text-center sm:px-10">
          <p className="eyebrow">Voice companion</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Talk it out</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            A judgment-free companion, out loud. No typing, no transcripts kept.
          </p>

          <div className="my-10">
            <VoiceOrb state={ORB_STATE[status]} getLevels={getLevels} />
          </div>

          <p aria-live="polite" className="min-h-6 font-medium text-muted">
            {status === "idle" ? "Tap the button and speak naturally." : STATUS_TEXT[status]}
          </p>

          <button
            type="button"
            aria-pressed={voiceActive}
            onClick={voiceActive ? stopVoice : startVoice}
            disabled={status === "connecting"}
            className={`lift mt-6 inline-flex min-w-52 items-center justify-center gap-2.5 rounded-full px-8 py-4 text-base font-bold text-white shadow-lg disabled:opacity-60 ${
              voiceActive ? "bg-danger" : "bg-primary hover:bg-primary-strong"
            }`}
          >
            <span aria-hidden="true" className="text-xl leading-none">
              {status === "connecting" ? "…" : voiceActive ? "◼" : "🎙"}
            </span>
            {status === "connecting"
              ? "Connecting"
              : voiceActive
                ? "End conversation"
                : "Start talking"}
          </button>

          {effectiveNotice && (
            <p role="status" className="mt-6 rounded-2xl bg-surface-2 px-4 py-3 text-sm">
              {effectiveNotice}
            </p>
          )}
        </section>
      ) : (
        <section aria-label="Tap to talk" className="space-y-6">
          <div className="glass p-8 text-center">
            <p className="eyebrow">Voice companion</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Talk it out</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Tap a phrase — Anchor replies out loud. No typing needed.
            </p>
            {effectiveNotice && (
              <p role="status" className="mt-5 rounded-2xl bg-surface-2 px-4 py-3 text-sm">
                {effectiveNotice}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {QUICK_PHRASES.map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => sendPhrase(phrase)}
                disabled={busyPhrase !== null}
                aria-busy={busyPhrase === phrase}
                className="glass lift min-h-16 px-5 py-4 text-left font-medium disabled:opacity-60"
              >
                {busyPhrase === phrase ? "Thinking…" : `“${phrase}”`}
              </button>
            ))}
          </div>

          {reply && (
            <div aria-live="polite" className="glass animate-fade-up p-6">
              <p className="eyebrow mb-3">Anchor</p>
              <AiText text={reply} />
            </div>
          )}
        </section>
      )}

      <p className="text-center text-xs text-muted">
        Voice audio is streamed to Google Gemini to generate a response and is not
        recorded or stored by this app. In an emergency, call 112.
      </p>
    </div>
  );
}
