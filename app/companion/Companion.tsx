"use client";

/**
 * "Talk it out" — a hands-free voice companion.
 *
 * Primary mode: full-duplex Gemini Live audio (see lib/liveClient.ts) with
 * an audio-reactive orb driven by real microphone/model amplitude
 * (VoiceStage). Fallback mode: if the browser can't run the audio pipeline
 * or the Live connection fails, the page degrades to zero-typing quick
 * phrases through /api/generate, read aloud via speech synthesis
 * (CompanionChips). Either way, the user never has to type.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import CompanionChips, { type ReplySource } from "./CompanionChips";
import VoiceStage from "./VoiceStage";
import {
  startLiveSession,
  supportsLiveVoice,
  type LiveSessionHandle,
  type LiveStatus,
} from "@/lib/liveClient";
import { planToProfile, useSafetyPlan } from "@/lib/profile";
import { useGenerate } from "@/lib/useGenerate";

type Mode = "voice" | "chips";

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
          const utterance = new SpeechSynthesisUtterance(text);
          // Full locale steers voice selection toward an Indian-accent /
          // matching-language voice where the OS has one installed.
          utterance.lang = `${plan.language}-IN`;
          window.speechSynthesis.speak(utterance);
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
        <VoiceStage
          status={status}
          voiceActive={voiceActive}
          notice={effectiveNotice}
          onStart={startVoice}
          onStop={stopVoice}
          getLevels={getLevels}
        />
      ) : (
        <CompanionChips
          notice={effectiveNotice}
          busyPhrase={busyPhrase}
          reply={reply}
          replySource={replySource}
          language={plan.language}
          onPhrase={sendPhrase}
        />
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
