/**
 * Direct tests for the /api/tts route handler: signature gating, WAV
 * output, rate limiting, sentence-boundary truncation, and audio caching.
 * generateSpeech is mocked — no real model calls.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/gemini", () => ({
  generateSpeech: vi.fn(async () => new Uint8Array([1, 2, 3, 4])),
}));

import { POST } from "@/app/api/tts/route";
import { generateSpeech } from "@/lib/gemini";
import { signText } from "@/lib/sign";

const speechMock = vi.mocked(generateSpeech);

/** Request stub: real Request forbids setting content-length, so fake it. */
function ttsRequest(body: unknown, clientIp: string): Request {
  const payload = JSON.stringify(body);
  return {
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "x-forwarded-for"
          ? clientIp
          : name.toLowerCase() === "content-length"
            ? String(payload.length)
            : null,
    },
    json: async () => JSON.parse(payload),
  } as unknown as Request;
}

beforeEach(() => {
  speechMock.mockClear();
});

describe("POST /api/tts", () => {
  it("refuses text without a valid signature (403) and never calls the model", async () => {
    const res = await POST(ttsRequest({ text: "arbitrary text", sig: "0".repeat(64) }, "tts-bad-sig"));
    expect(res.status).toBe(403);
    expect(speechMock).not.toHaveBeenCalled();
  });

  it("speaks signed text: 200 audio/wav with a RIFF header", async () => {
    const text = "You are safe. Breathe slowly.";
    const res = await POST(ttsRequest({ text, sig: signText(text) }, "tts-happy"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("audio/wav");
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("RIFF");
    expect(String.fromCharCode(...bytes.slice(8, 12))).toBe("WAVE");
    // 44-byte header + the 4 mocked PCM bytes
    expect(bytes.length).toBe(48);
  });

  it("rejects malformed bodies with 400", async () => {
    const res = await POST(ttsRequest({ text: 42, sig: [] }, "tts-malformed"));
    expect(res.status).toBe(400);
  });

  it("rate limits after 8 requests per client with Retry-After", async () => {
    const text = "Rate limit check sentence.";
    const sig = signText(text);
    let last: Response | null = null;
    for (let i = 0; i < 9; i++) {
      last = await POST(ttsRequest({ text, sig }, "tts-limited"));
    }
    expect(last!.status).toBe(429);
    expect(last!.headers.get("Retry-After")).toBe("30");
  });

  it("truncates long text at a sentence boundary before synthesis", async () => {
    const sentence = "This sentence is exactly forty chars ok. ";
    const text = sentence.repeat(50).trim(); // ~2000 chars, > 1500 cap
    const res = await POST(ttsRequest({ text, sig: signText(text) }, "tts-long"));
    expect(res.status).toBe(200);
    const spoken = speechMock.mock.calls[0][0];
    expect(spoken.length).toBeLessThanOrEqual(1500);
    expect(spoken.endsWith(".")).toBe(true);
  });

  it("serves repeated text from cache — one model call for two requests", async () => {
    const text = "Cache me once, speak me twice.";
    const sig = signText(text);
    const first = await POST(ttsRequest({ text, sig }, "tts-cache-a"));
    const second = await POST(ttsRequest({ text, sig }, "tts-cache-b"));
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(speechMock).toHaveBeenCalledTimes(1);
  });
});
