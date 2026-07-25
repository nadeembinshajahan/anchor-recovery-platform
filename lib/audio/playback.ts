"use client";

/**
 * Playback side of the voice pipeline: base64 PCM16 chunks (24 kHz mono)
 * from the Live session are decoded into AudioBuffers and scheduled
 * back-to-back on a shared playhead for gapless speech. All model audio is
 * routed through one gain bus so a single AnalyserNode can observe it for
 * the visualizer.
 */

/** Sample rate of audio returned by the Live API. */
export const OUTPUT_RATE = 24000;

export interface PlaybackQueue {
  /** Analyser observing everything the model says (for level metering). */
  analyser: AnalyserNode;
  /** Decode and schedule one base64 PCM chunk after the current tail. */
  enqueue: (b64: string) => void;
  /** Stop everything scheduled (server signalled an interruption). */
  flush: () => void;
  /** Disconnect the graph and close the context. Idempotent enough. */
  close: () => void;
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

/**
 * Create the playback context and scheduling queue.
 *
 * @param onDrained invoked whenever the last scheduled chunk finishes —
 *   the caller decides what "the model went quiet" means for UI state.
 */
export function createPlaybackQueue(onDrained: () => void): PlaybackQueue {
  const ctx = new AudioContext({ sampleRate: OUTPUT_RATE });
  const bus = ctx.createGain();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  bus.connect(analyser);
  analyser.connect(ctx.destination);

  let playhead = 0;
  let liveSources: AudioBufferSourceNode[] = [];

  const flush = () => {
    liveSources.forEach((src) => {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    });
    liveSources = [];
    playhead = ctx.currentTime;
  };

  const enqueue = (b64: string) => {
    const buffer = base64ToAudioBuffer(b64, ctx);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(bus);
    playhead = Math.max(playhead, ctx.currentTime);
    source.start(playhead);
    playhead += buffer.duration;
    liveSources.push(source);
    source.onended = () => {
      liveSources = liveSources.filter((s) => s !== source);
      if (liveSources.length === 0) onDrained();
    };
  };

  const close = () => {
    analyser.disconnect();
    bus.disconnect();
    void ctx.close();
  };

  return { analyser, enqueue, flush, close };
}
