import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clientKey, isRateLimited } from "@/lib/rateLimit";

describe("isRateLimited", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit, then blocks", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(isRateLimited(key, 5)).toBe(false);
    }
    expect(isRateLimited(key, 5)).toBe(true);
    expect(isRateLimited(key, 5)).toBe(true);
  });

  it("tracks keys independently", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    for (let i = 0; i < 3; i++) isRateLimited(a, 3);
    expect(isRateLimited(a, 3)).toBe(true);
    expect(isRateLimited(b, 3)).toBe(false);
  });

  it("frees the budget after the window expires", () => {
    const key = `window-${Math.random()}`;
    for (let i = 0; i < 3; i++) isRateLimited(key, 3);
    expect(isRateLimited(key, 3)).toBe(true);

    vi.advanceTimersByTime(61_000);
    expect(isRateLimited(key, 3)).toBe(false);
  });
});

describe("clientKey", () => {
  it("uses the first x-forwarded-for entry", () => {
    const req = new Request("http://localhost/api", {
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    });
    expect(clientKey(req)).toBe("203.0.113.9");
  });

  it("falls back to 'local' when the header is missing", () => {
    const req = new Request("http://localhost/api");
    expect(clientKey(req)).toBe("local");
  });
});
