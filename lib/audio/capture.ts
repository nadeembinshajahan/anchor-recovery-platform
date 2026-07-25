"use client";

/**
 * Microphone capture side of the voice pipeline:
 *
 *   getUserMedia ─▶ AudioContext(16 kHz) ─▶ AudioWorklet (64 ms batches)
 *     ─▶ Float32 frames ─▶ caller encodes ─▶ WebSocket
 *
 * The worklet is inlined and loaded via a Blob URL so the app needs no
 * extra static asset. The render quantum is 128 samples (8 ms at 16 kHz);
 * forwarding every quantum would mean ~125 postMessages + socket sends per
 * second, so the worklet accumulates 1024 samples (64 ms) before posting —
 * an 8x reduction in overhead, still well inside conversational latency.
 */

/** Sample rate required by the Live API for microphone input. */
export const INPUT_RATE = 16000;

const WORKLET_SOURCE = `
class PcmForwarder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(1024);
    this.offset = 0;
  }
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;
    let i = 0;
    while (i < channel.length) {
      const n = Math.min(channel.length - i, this.buffer.length - this.offset);
      this.buffer.set(channel.subarray(i, i + n), this.offset);
      this.offset += n;
      i += n;
      if (this.offset === this.buffer.length) {
        this.port.postMessage(this.buffer.slice(0));
        this.offset = 0;
      }
    }
    return true;
  }
}
registerProcessor("pcm-forwarder", PcmForwarder);
`;

/** Convert a Float32 [-1, 1] frame to base64-encoded little-endian PCM16. */
export function encodePcm16Base64(frame: Float32Array): string {
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

/**
 * Request the microphone and prepare a capture context with the PCM
 * forwarder worklet loaded. On any setup failure the mic is released and
 * the context closed — a leaked mic keeps the browser's recording
 * indicator on and blocks other apps from the device.
 */
export async function openMicCapture(): Promise<{
  mic: MediaStream;
  captureCtx: AudioContext;
}> {
  const mic = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });

  const captureCtx = new AudioContext({ sampleRate: INPUT_RATE });
  try {
    const workletUrl = URL.createObjectURL(
      new Blob([WORKLET_SOURCE], { type: "application/javascript" }),
    );
    try {
      await captureCtx.audioWorklet.addModule(workletUrl);
    } finally {
      URL.revokeObjectURL(workletUrl);
    }
  } catch (err) {
    mic.getTracks().forEach((t) => t.stop());
    void captureCtx.close();
    throw err instanceof Error ? err : new Error("Audio setup failed.");
  }
  return { mic, captureCtx };
}

/**
 * Wire the mic through the worklet and start forwarding Float32 frames to
 * the caller. An AnalyserNode taps the signal in parallel — it never
 * alters what is sent — and is returned for level visualization.
 */
export function startPcmForwarding(
  captureCtx: AudioContext,
  mic: MediaStream,
  onFrame: (frame: Float32Array) => void,
): AnalyserNode {
  const source = captureCtx.createMediaStreamSource(mic);
  const inputAnalyser = captureCtx.createAnalyser();
  inputAnalyser.fftSize = 1024;
  source.connect(inputAnalyser);

  const worklet = new AudioWorkletNode(captureCtx, "pcm-forwarder");
  worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
    onFrame(event.data);
  };
  source.connect(worklet);
  // Worklets need a destination to keep pulling; route through zero gain.
  const silent = captureCtx.createGain();
  silent.gain.value = 0;
  worklet.connect(silent).connect(captureCtx.destination);

  return inputAnalyser;
}
