"use client";

/**
 * Read-aloud control for AI-generated text. The primary voice is Gemini TTS
 * via /api/tts (signature-gated — see lib/sign.ts); per the app's
 * fallback-first thesis it degrades in order:
 *
 *   Gemini TTS → browser speechSynthesis → idle button for a manual retry.
 *
 * There is never an error wall: a user under stress either hears the script
 * or quietly keeps the readable version.
 *
 * Autoplay: text lands moments after a user tap (their gesture), so playback
 * usually starts unprompted — completing the zero-effort loop of tap →
 * read → hear. If the browser still blocks it, we fall back and finally
 * settle into the idle button.
 */
import { useCallback, useEffect, useRef, useState } from "react";

/** BCP-47 speech locales for the plan's language codes. */
const SPEECH_LOCALES: Record<string, string> = {
  ml: "ml-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  en: "en-IN",
};

type Phase = "idle" | "loading" | "playing";

export interface ReadAloudProps {
  /** The exact signed text as returned by /api/generate. */
  text: string;
  /** Signature from /api/generate; without it the server refuses to speak. */
  sig: string | null;
  /** Plan language code ("ml" | "hi" | "ta"); undefined means English. */
  lang?: string;
  /** Start speaking as soon as the text arrives. */
  autoplay?: boolean;
}

export default function ReadAloud({ text, sig, lang, autoplay }: ReadAloudProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [announcement, setAnnouncement] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  /** The text we already autoplayed — never autoplay the same answer twice. */
  const autoplayedFor = useRef<string | null>(null);

  const stop = useCallback((announce = true) => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPhase("idle");
    if (announce) setAnnouncement("Stopped reading.");
  }, []);

  /** Last-resort voice: the browser's own synthesis, in the right locale. */
  const speakWithBrowser = useCallback((): boolean => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return false;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LOCALES[lang ?? "en"] ?? "en-IN";
    utterance.onend = () => setPhase("idle");
    utterance.onerror = () => setPhase("idle");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setPhase("playing");
    setAnnouncement("Reading aloud.");
    return true;
  }, [text, lang]);

  const play = useCallback(async () => {
    if (!sig) return;
    stop(false);
    setPhase("loading");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sig }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("tts unavailable");
      const url = URL.createObjectURL(await res.blob());
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => stop();
      await audio.play();
      setPhase("playing");
      setAnnouncement("Reading aloud.");
    } catch {
      if (controller.signal.aborted) return;
      // Gemini voice unavailable or playback blocked — browser voice next;
      // if that's also unavailable, rest in idle for a manual retry.
      if (!speakWithBrowser()) setPhase("idle");
    }
  }, [text, sig, stop, speakWithBrowser]);

  // Autoplay once per distinct answer.
  useEffect(() => {
    if (autoplay && sig && text && autoplayedFor.current !== text) {
      autoplayedFor.current = text;
      void play();
    }
  }, [autoplay, sig, text, play]);

  // New text or unmount: silence everything, release resources.
  useEffect(() => () => stop(false), [text, stop]);

  if (!sig) return null;

  return (
    <div className="read-aloud mt-3 flex items-center gap-2">
      <button
        type="button"
        onClick={phase === "playing" ? () => stop() : () => void play()}
        disabled={phase === "loading"}
        aria-pressed={phase === "playing"}
        aria-busy={phase === "loading"}
        className="sun-button sun-button-glass lift inline-flex items-center gap-2 !px-4 !py-1.5 text-sm"
      >
        <span aria-hidden="true">{phase === "playing" ? "◼" : "🔊"}</span>
        {phase === "loading"
          ? "Preparing…"
          : phase === "playing"
            ? "Stop"
            : "Listen"}
      </button>
      {phase === "playing" && (
        <span aria-hidden="true" className="read-aloud-wave motion-reduce:hidden">
          {[0, 1, 2].map((i) => (
            <i
              key={i}
              className="inline-block h-3 w-0.5 animate-pulse rounded-full bg-primary align-middle"
              style={{ animationDelay: `${i * 160}ms`, marginRight: 3 }}
            />
          ))}
        </span>
      )}
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
