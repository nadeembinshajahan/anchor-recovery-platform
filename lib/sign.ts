import "server-only";

/**
 * HMAC signing for AI-generated text.
 *
 * Threat model: /api/tts converts text to speech through our Gemini API key.
 * Without proof of origin, anyone could POST arbitrary text and use the app
 * as a free (and abusable) TTS service under our billing and our voice.
 * So /api/generate signs every answer it returns, and /api/tts only speaks
 * text that carries a valid signature — the endpoint can only ever read
 * aloud what our own guardrailed model actually said.
 *
 * The secret comes from TTS_SIGNING_SECRET when configured, else a random
 * per-boot secret. Per-boot is an acceptable trade-off for a single-instance
 * deployment: the worst case is that a server restart invalidates signatures
 * held by open tabs, and the client's read-aloud button simply falls back to
 * browser speech synthesis.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SECRET: Buffer = process.env.TTS_SIGNING_SECRET
  ? Buffer.from(process.env.TTS_SIGNING_SECRET, "utf8")
  : randomBytes(32);

/** Sign `text`, returning a hex HMAC-SHA256 tag. */
export function signText(text: string): string {
  return createHmac("sha256", SECRET).update(text, "utf8").digest("hex");
}

/**
 * Constant-time verification. Returns false (never throws) for malformed
 * or wrong-length signatures so callers can treat any failure uniformly.
 */
export function verifyText(text: string, sig: string): boolean {
  if (typeof sig !== "string" || !/^[0-9a-f]{64}$/.test(sig)) return false;
  const expected = Buffer.from(signText(text), "hex");
  const provided = Buffer.from(sig, "hex");
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}
