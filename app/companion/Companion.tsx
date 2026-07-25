"use client";

/**
 * "Talk it out" — a hands-free voice companion.
 *
 * Primary mode: full-duplex Gemini Live audio (see lib/liveClient.ts).
 * Fallback mode: if the browser can't run the audio pipeline or the Live
 * connection fails, the page degrades to zero-typing quick phrases that go
 * through /api/generate, with replies read aloud via speech synthesis.
 * Either way, the user never has to type.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import AiText from "@/components/AiText";
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
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Talk it out</h1>
        <p className="text-muted">
          A judgment-free companion, out loud. No typing, no transcripts kept.
        </p>
      </div>

      {effectiveNotice && (
        <p role="status" className="rounded-xl bg-surface-2 px-4 py-3 text-center text-sm">
          {effectiveNotice}
        </p>
      )}

      {effectiveMode === "voice" ? (
        <section aria-label="Voice conversation" className="space-y-6 text-center">
          <button
            type="button"
            aria-pressed={voiceActive}
            onClick={voiceActive ? stopVoice : startVoice}
            disabled={status === "connecting"}
            className={`mx-auto flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-full text-lg font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-60 ${
              voiceActive ? "bg-danger" : "bg-primary hover:bg-primary-strong"
            }`}
          >
            <span aria-hidden="true" className="text-3xl">
              {voiceActive ? "◼" : "🎙"}
            </span>
            {status === "connecting" ? "Connecting" : voiceActive ? "End" : "Start talking"}
          </button>

          <p aria-live="polite" className="min-h-6 font-medium text-muted">
            {status === "idle" ? "Tap the button and speak naturally." : STATUS_TEXT[status]}
          </p>

          {status === "model-speaking" && (
            <div aria-hidden="true" className="flex justify-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="h-6 w-1.5 animate-pulse rounded-full bg-primary"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section aria-label="Tap to talk" className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK_PHRASES.map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => sendPhrase(phrase)}
                disabled={busyPhrase !== null}
                aria-busy={busyPhrase === phrase}
                className="min-h-16 rounded-2xl border border-surface-2 bg-surface px-5 py-4 text-left font-medium transition hover:border-primary hover:shadow-md disabled:opacity-60"
              >
                {busyPhrase === phrase ? "Thinking…" : `“${phrase}”`}
              </button>
            ))}
          </div>

          {reply && (
            <div
              aria-live="polite"
              className="rounded-2xl border border-primary/30 bg-surface p-6 shadow-sm"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Anchor
              </p>
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
