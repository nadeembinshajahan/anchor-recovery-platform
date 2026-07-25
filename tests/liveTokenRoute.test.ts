import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/live-token/route";
import { createLiveToken } from "@/lib/gemini";

vi.mock("@/lib/gemini", () => ({
  generateText: vi.fn(),
  createLiveToken: vi.fn(async () => "auth_tokens/abc123"),
}));

const mockedToken = vi.mocked(createLiveToken);

function makeReq(key: string): Request {
  return {
    headers: new Headers({ "x-forwarded-for": key }),
  } as unknown as Request;
}

describe("POST /api/live-token", () => {
  beforeEach(() => {
    mockedToken.mockClear();
    mockedToken.mockResolvedValue("auth_tokens/abc123");
  });

  it("mints an ephemeral token", async () => {
    const res = await POST(makeReq(`mint-${Math.random()}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ token: "auth_tokens/abc123" });
  });

  it("applies the stricter 6/min limit with Retry-After", async () => {
    const key = `voice-${Math.random()}`;
    for (let i = 0; i < 6; i++) {
      expect((await POST(makeReq(key))).status).toBe(200);
    }
    const blocked = await POST(makeReq(key));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBe("30");
  });

  it("returns a friendly 502 when token minting fails", async () => {
    mockedToken.mockRejectedValueOnce(new Error("v1alpha rejected: internal"));
    const res = await POST(makeReq(`fail-${Math.random()}`));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBe("Voice session is temporarily unavailable.");
    expect(JSON.stringify(json)).not.toMatch(/internal/);
  });
});
