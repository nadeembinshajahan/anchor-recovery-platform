import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/generate/route";
import { generateText } from "@/lib/gemini";

vi.mock("@/lib/gemini", () => ({
  generateText: vi.fn(async () => "generated response"),
  createLiveToken: vi.fn(),
}));

const mockedGenerate = vi.mocked(generateText);

/**
 * Minimal Request stand-in: the handler only touches `headers` and `json()`.
 * Building it directly avoids undici's forbidden-header rules (a real
 * Request will not let a test set `content-length`).
 */
function makeReq(opts: {
  body?: unknown;
  rawBody?: string;
  key?: string;
  contentLength?: number;
}): Request {
  const headers = new Headers({
    "content-type": "application/json",
    "x-forwarded-for": opts.key ?? `key-${Math.random()}`,
  });
  if (opts.contentLength !== undefined) {
    headers.set("content-length", String(opts.contentLength));
  }
  return {
    headers,
    json: async () => {
      if (opts.rawBody !== undefined) return JSON.parse(opts.rawBody);
      return opts.body;
    },
  } as unknown as Request;
}

function validBody(context: string, task = "explain-topic") {
  return { task, context };
}

describe("POST /api/generate", () => {
  beforeEach(() => {
    mockedGenerate.mockClear();
    mockedGenerate.mockResolvedValue("generated response");
  });

  it("returns the generated text on a valid request", async () => {
    const res = await POST(makeReq({ body: validBody(`happy-${Math.random()}`) }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.text).toBe("generated response");
    // Every successful response is signed for the read-aloud endpoint.
    expect(json.sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await POST(makeReq({ rawBody: "{not json" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/invalid json/i);
  });

  it("rejects schema-invalid payloads with 400", async () => {
    const res = await POST(makeReq({ body: { task: "hack-the-planet", context: "x" } }));
    expect(res.status).toBe(400);
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("rejects oversized bodies with 413 before parsing", async () => {
    const res = await POST(
      makeReq({ body: validBody("too big"), contentLength: 20_000 }),
    );
    expect(res.status).toBe(413);
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("rate limits a single client with 429 + Retry-After, leaving others unaffected", async () => {
    const hotKey = `hot-${Math.random()}`;
    // Default limit is 20/min; unique contexts avoid the response cache.
    for (let i = 0; i < 20; i++) {
      const res = await POST(
        makeReq({ body: validBody(`burst-${hotKey}-${i}`), key: hotKey }),
      );
      expect(res.status).toBe(200);
    }
    const blocked = await POST(
      makeReq({ body: validBody(`burst-${hotKey}-final`), key: hotKey }),
    );
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBe("30");

    const other = await POST(
      makeReq({ body: validBody(`other-${Math.random()}`), key: `cold-${Math.random()}` }),
    );
    expect(other.status).toBe(200);
  });

  it("returns a friendly 502 when generation fails", async () => {
    mockedGenerate.mockRejectedValueOnce(new Error("upstream exploded: secret detail"));
    const res = await POST(makeReq({ body: validBody(`fail-${Math.random()}`) }));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBe("Generation is temporarily unavailable.");
    expect(JSON.stringify(json)).not.toMatch(/secret detail/);
  });

  it("serves repeat cacheable requests from cache with a single model call", async () => {
    const body = validBody(`cacheable-${Math.random()}`);
    const first = await POST(makeReq({ body }));
    const second = await POST(makeReq({ body }));

    expect((await first.json()).cached).toBeUndefined();
    expect((await second.json()).cached).toBe(true);
    expect(mockedGenerate).toHaveBeenCalledTimes(1);
  });

  it("keys the cache on the profile so personalization never leaks", async () => {
    const context = `profiled-${Math.random()}`;
    await POST(makeReq({ body: { task: "emergency-script", context, profile: { name: "Asha" } } }));
    const other = await POST(
      makeReq({ body: { task: "emergency-script", context, profile: { name: "Binu" } } }),
    );
    expect((await other.json()).cached).toBeUndefined();
    expect(mockedGenerate).toHaveBeenCalledTimes(2);
  });

  it("never caches conversational companion replies", async () => {
    const body = validBody(`chat-${Math.random()}`, "companion-reply");
    const first = await POST(makeReq({ body }));
    const second = await POST(makeReq({ body }));

    expect((await first.json()).cached).toBeUndefined();
    expect((await second.json()).cached).toBeUndefined();
    expect(mockedGenerate).toHaveBeenCalledTimes(2);
  });
});
