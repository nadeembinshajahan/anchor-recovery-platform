import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { TtlLruCache } from "@/lib/cache";
import { generateSpeech } from "@/lib/gemini";
import { verifyText } from "@/lib/sign";
import { clientKey, isRateLimited } from "@/lib/rateLimit";
import { extractCitations } from "@/lib/sources";

/**
 * Read-aloud endpoint. Only text SIGNED by /api/generate is ever spoken
 * (see lib/sign.ts for the threat model) — this can never be used as a
 * general-purpose TTS proxy for arbitrary text.
 */

/** TTS is expensive; stricter per-client budget than text generation. */
const TTS_RATE_LIMIT = 8;
const MAX_BODY_BYTES = 32 * 1024;
/** Spoken length cap — answers are ≤~1.2k chars by prompt design anyway. */
const MAX_SPEECH_CHARS = 1500;

/**
 * Audio responses are ~1-2 MB of WAV each, so the cache is small but still
 * covers the common case: replaying the same answer, or a cached generation
 * being listened to by several users.
 */
const audioCache = new TtlLruCache<Uint8Array>({
  maxEntries: 24,
  ttlMs: 60 * 60 * 1000, // 1 hour
});

/** Trim to the cap at the last sentence boundary so speech never stops mid-word. */
function truncateAtSentence(text: string, max: number): string {
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const lastStop = Math.max(
    head.lastIndexOf("."),
    head.lastIndexOf("!"),
    head.lastIndexOf("?"),
    head.lastIndexOf("।"),
  );
  return lastStop > 0 ? head.slice(0, lastStop + 1) : head;
}

/** Wrap raw 24 kHz mono PCM16 in a standard 44-byte WAV header. */
function toWav(pcm: Uint8Array): Uint8Array {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // linear PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(24000, 24); // sample rate
  header.writeUInt32LE(48000, 28); // byte rate (24k * 2)
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function POST(request: Request): Promise<NextResponse> {
  if (isRateLimited(clientKey(request), TTS_RATE_LIMIT)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": "30" } },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { text, sig } = (body ?? {}) as { text?: unknown; sig?: unknown };
  if (typeof text !== "string" || typeof sig !== "string" || !text.trim()) {
    return NextResponse.json(
      { error: "Invalid request. Expected { text, sig }." },
      { status: 400 },
    );
  }

  // Only our own model's words get a voice. The signature covers the exact
  // text as returned by /api/generate.
  if (!verifyText(text, sig)) {
    return NextResponse.json({ error: "Signature invalid." }, { status: 403 });
  }

  // Speak the reader-facing form: citation markers stripped (nobody wants
  // "[S3]" read aloud), capped at a sentence boundary.
  const speakable = truncateAtSentence(extractCitations(text).display, MAX_SPEECH_CHARS);
  const key = createHash("sha256").update(speakable).digest("hex");

  const headers = {
    "Content-Type": "audio/wav",
    "Cache-Control": "private, max-age=3600",
  };

  const cached = audioCache.get(key);
  if (cached !== undefined) {
    return new NextResponse(Buffer.from(cached), { headers });
  }

  try {
    const wav = toWav(await generateSpeech(speakable));
    audioCache.set(key, wav);
    return new NextResponse(Buffer.from(wav), { headers });
  } catch (err) {
    // Never leak internals; the client falls back to browser speech.
    console.error("tts failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Read-aloud is temporarily unavailable." },
      { status: 502 },
    );
  }
}
