"use client";

/**
 * Browser-side orchestrator for a Gemini Live voice session. Capture,
 * playback, and level metering live in lib/audio/*; this module owns the
 * session lifecycle. The real Gemini API key never reaches this code: the
 * backend mints a single-use ephemeral token (/api/live-token) and we
 * connect with that. VAD is server-side, so we stream mic audio
 * continuously and flush playback when the server signals interruption.
 */
import { GoogleGenAI, Modality, type Session } from "@google/genai";
import { encodePcm16Base64, INPUT_RATE, openMicCapture, startPcmForwarding } from "./audio/capture";
import { createLevelReader } from "./audio/levels";
import { createPlaybackQueue } from "./audio/playback";
import { GEMINI_LIVE_MODEL } from "./config";
import { loadPlan, PLAN_LANGUAGES } from "./profile";
import { COMPANION_SYSTEM_PROMPT } from "./prompts";

export type LiveStatus =
  | "connecting"
  | "live"
  | "model-speaking"
  | "closed"
  | "error";

export interface LiveSessionHandlers {
  /** Coarse session state changes, suitable for UI status text. */
  onStatus: (status: LiveStatus) => void;
  /** Fatal errors (connection refused, mic denied, …). Session is dead. */
  onError: (message: string) => void;
}

export interface LiveSessionHandle {
  /** Tear down mic, audio contexts and the WebSocket session. Idempotent. */
  stop: () => void;
  /**
   * Smoothed audio amplitudes in [0, 1] for visualization — `input` is the
   * user's microphone, `output` is the model's voice. Designed to be polled
   * once per animation frame.
   */
  getLevels: () => { input: number; output: number };
}

/** True when the current browser can run the full Live pipeline. */
export function supportsLiveVoice(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof AudioWorkletNode !== "undefined"
  );
}

/** Kickoff turn so Pulari speaks first — personalized from the on-device
 *  plan, which is never sent anywhere except this session. */
function greetingTurn(): string {
  const plan = loadPlan();
  const preferred = PLAN_LANGUAGES.find((l) => l.code === plan.language);
  return `[Session start — the user just opened the voice page${
    plan.name ? `; their name is ${plan.name}` : ""
  }${
    preferred && preferred.code !== "en"
      ? `; they prefer to talk in ${preferred.label}`
      : ""
  }. Greet them warmly in one or two short sentences and gently ask how they are right now.]`;
}

/**
 * Open a full-duplex voice session. Resolves once the session is live.
 * Callers MUST invoke the returned `stop()` when done (or on unmount).
 */
export async function startLiveSession(
  handlers: LiveSessionHandlers,
): Promise<LiveSessionHandle> {
  handlers.onStatus("connecting");

  // 1. Short-lived credential from our backend — never the real key.
  const tokenRes = await fetch("/api/live-token", { method: "POST" });
  if (!tokenRes.ok) {
    throw new Error("Could not start a voice session (token refused).");
  }
  const { token } = (await tokenRes.json()) as { token: string };

  // 2. Microphone + capture context (releases itself on setup failure).
  const { mic, captureCtx } = await openMicCapture();

  // 3. Playback queue; "queue drained" returns UI state to listening.
  let stopped = false;
  const playback = createPlaybackQueue(() => {
    if (!stopped) handlers.onStatus("live");
  });

  let session: Session | null = null;
  let inputAnalyser: AnalyserNode | null = null;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    try {
      session?.close();
    } catch {
      /* socket may already be closed */
    }
    inputAnalyser?.disconnect();
    playback.close();
    mic.getTracks().forEach((t) => t.stop());
    void captureCtx.close();
    handlers.onStatus("closed");
  };

  // 4. Connect to Gemini Live with the ephemeral token.
  const ai = new GoogleGenAI({
    apiKey: token,
    httpOptions: { apiVersion: "v1alpha" },
  });
  try {
    session = await ai.live.connect({
      model: GEMINI_LIVE_MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: COMPANION_SYSTEM_PROMPT,
      },
      callbacks: {
        onmessage: (message) => {
          if (message.serverContent?.interrupted) {
            // User started talking over the model: stop playback now.
            playback.flush();
            handlers.onStatus("live");
            return;
          }
          if (message.data) {
            handlers.onStatus("model-speaking");
            playback.enqueue(message.data);
          }
        },
        onerror: () => {
          if (!stopped) {
            handlers.onError("The voice connection failed.");
            stop();
          }
        },
        onclose: () => {
          if (!stopped) stop();
        },
      },
    });
  } catch (err) {
    mic.getTracks().forEach((t) => t.stop());
    void captureCtx.close();
    playback.close();
    throw err instanceof Error ? err : new Error("Voice connection failed.");
  }

  session.sendClientContent({ turns: greetingTurn(), turnComplete: true });

  // 5. Stream mic frames to the session.
  inputAnalyser = startPcmForwarding(captureCtx, mic, (frame) => {
    if (stopped || !session) return;
    try {
      session.sendRealtimeInput({
        audio: {
          data: encodePcm16Base64(frame),
          mimeType: `audio/pcm;rate=${INPUT_RATE}`,
        },
      });
    } catch {
      // Socket mid-close: drop the frame; onclose/onerror handle teardown.
    }
  });

  // 6. Level polling for the visualizer.
  const getLevels = createLevelReader({
    getInputAnalyser: () => inputAnalyser,
    outputAnalyser: playback.analyser,
    isActive: () => !stopped,
  });

  handlers.onStatus("live");
  return { stop, getLevels };
}
