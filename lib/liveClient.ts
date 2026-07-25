"use client";

/**
 * Browser-side wrapper around a Gemini Live voice session.
 *
 * Audio pipeline, end to end:
 *
 *   microphone ─▶ getUserMedia ─▶ AudioContext(16 kHz) ─▶ AudioWorklet
 *     ─▶ Float32 frames ─▶ 16-bit PCM ─▶ base64 ─▶ session.sendRealtimeInput
 *
 *   session.onmessage ─▶ base64 PCM (24 kHz) ─▶ AudioBuffer queue
 *     ─▶ gapless scheduled playback via AudioContext(24 kHz)
 *
 * The real Gemini API key never reaches this code: we ask our own backend
 * (/api/live-token) for a single-use ephemeral token and connect with that.
 * Voice activity detection is handled server-side by the Live API, so we
 * simply stream mic audio continuously and play whatever comes back,
 * flushing the playback queue when the server signals an interruption.
 */
import { GoogleGenAI, Modality, type Session } from "@google/genai";
import { GEMINI_LIVE_MODEL } from "./config";
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
}

/** Sample rates required by the Live API (input) and returned by it (output). */
const INPUT_RATE = 16000;
const OUTPUT_RATE = 24000;

/**
 * AudioWorklet processor source. Inlined and loaded via a Blob URL so the
 * app needs no extra static asset. It forwards raw Float32 mono frames from
 * the mic to the main thread every 128 samples.
 */
const WORKLET_SOURCE = `
class PcmForwarder extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) this.port.postMessage(channel.slice(0));
    return true;
  }
}
registerProcessor("pcm-forwarder", PcmForwarder);
`;

/** Convert a Float32 [-1, 1] frame to base64-encoded little-endian PCM16. */
function floatTo16BitPcmBase64(frame: Float32Array): string {
  const pcm = new Int16Array(frame.length);
  for (let i = 0; i < frame.length; i++) {
    const s = Math.max(-1, Math.min(1, frame[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(pcm.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** Decode base64 PCM16 (24 kHz mono) into an AudioBuffer for playback. */
function base64ToAudioBuffer(b64: string, ctx: AudioContext): AudioBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const pcm = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, pcm.length, OUTPUT_RATE);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 0x8000;
  return buffer;
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

  // 2. Microphone + capture context.
  const mic = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });

  const captureCtx = new AudioContext({ sampleRate: INPUT_RATE });
  const workletUrl = URL.createObjectURL(
    new Blob([WORKLET_SOURCE], { type: "application/javascript" }),
  );
  await captureCtx.audioWorklet.addModule(workletUrl);
  URL.revokeObjectURL(workletUrl);

  // 3. Playback context and a gapless scheduling queue.
  const playbackCtx = new AudioContext({ sampleRate: OUTPUT_RATE });
  let playhead = 0;
  let liveSources: AudioBufferSourceNode[] = [];

  const flushPlayback = () => {
    liveSources.forEach((src) => {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    });
    liveSources = [];
    playhead = playbackCtx.currentTime;
  };

  const enqueueAudio = (b64: string) => {
    const buffer = base64ToAudioBuffer(b64, playbackCtx);
    const source = playbackCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(playbackCtx.destination);
    playhead = Math.max(playhead, playbackCtx.currentTime);
    source.start(playhead);
    playhead += buffer.duration;
    liveSources.push(source);
    source.onended = () => {
      liveSources = liveSources.filter((s) => s !== source);
      if (liveSources.length === 0 && !stopped) handlers.onStatus("live");
    };
  };

  // 4. Connect to Gemini Live with the ephemeral token.
  let session: Session | null = null;
  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    try {
      session?.close();
    } catch {
      /* socket may already be closed */
    }
    mic.getTracks().forEach((t) => t.stop());
    void captureCtx.close();
    void playbackCtx.close();
    handlers.onStatus("closed");
  };

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
            // User started talking over the model: stop playback immediately.
            flushPlayback();
            handlers.onStatus("live");
            return;
          }
          const audio = message.data;
          if (audio) {
            handlers.onStatus("model-speaking");
            enqueueAudio(audio);
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
    void playbackCtx.close();
    throw err instanceof Error ? err : new Error("Voice connection failed.");
  }

  // 5. Start streaming mic frames to the session.
  const source = captureCtx.createMediaStreamSource(mic);
  const worklet = new AudioWorkletNode(captureCtx, "pcm-forwarder");
  worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
    if (stopped || !session) return;
    session.sendRealtimeInput({
      audio: {
        data: floatTo16BitPcmBase64(event.data),
        mimeType: `audio/pcm;rate=${INPUT_RATE}`,
      },
    });
  };
  source.connect(worklet);
  // Worklets need a destination to keep pulling; route through zero gain.
  const silent = captureCtx.createGain();
  silent.gain.value = 0;
  worklet.connect(silent).connect(captureCtx.destination);

  handlers.onStatus("live");
  return { stop };
}
