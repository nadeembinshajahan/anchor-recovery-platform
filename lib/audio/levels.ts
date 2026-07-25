"use client";

/**
 * Amplitude metering for the voice visualizer: converts AnalyserNode
 * time-domain windows into smoothed 0..1 levels suitable for driving
 * transforms once per animation frame.
 */

/**
 * Rough loudness of an analyser's current window: RMS of the time-domain
 * signal, boosted into a perceptually useful 0..1 range for visuals
 * (conversational speech RMS rarely exceeds ~0.35).
 */
export function analyserLevel(
  analyser: AnalyserNode,
  scratch: Uint8Array<ArrayBuffer>,
): number {
  analyser.getByteTimeDomainData(scratch);
  let sumSquares = 0;
  for (let i = 0; i < scratch.length; i++) {
    const centered = (scratch[i] - 128) / 128;
    sumSquares += centered * centered;
  }
  const rms = Math.sqrt(sumSquares / scratch.length);
  return Math.min(1, rms * 2.8);
}

/**
 * Asymmetric exponential smoothing for animation: rises quickly with the
 * voice (attack) and decays gently (release) so motion feels organic
 * instead of flickering with every syllable.
 */
export function smooth(previous: number, target: number): number {
  const factor = target > previous ? 0.5 : 0.12;
  return previous + (target - previous) * factor;
}

/**
 * Stateful reader combining both analysers into the `getLevels()` shape
 * the UI polls per frame. Returns zeros once `isActive` reports false.
 */
export function createLevelReader(opts: {
  getInputAnalyser: () => AnalyserNode | null;
  outputAnalyser: AnalyserNode;
  isActive: () => boolean;
}): () => { input: number; output: number } {
  const scratch = new Uint8Array(1024);
  let inputLevel = 0;
  let outputLevel = 0;
  return () => {
    if (!opts.isActive()) return { input: 0, output: 0 };
    const inputAnalyser = opts.getInputAnalyser();
    inputLevel = smooth(
      inputLevel,
      inputAnalyser ? analyserLevel(inputAnalyser, scratch) : 0,
    );
    outputLevel = smooth(outputLevel, analyserLevel(opts.outputAnalyser, scratch));
    return { input: inputLevel, output: outputLevel };
  };
}
