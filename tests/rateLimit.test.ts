import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clientKey, isRateLimited } from "@/lib/rateLimit";

describe("isRateLimited (token bucket)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit, then blocks the next one", () => {
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

  it("refills roughly half the budget after half a window", () => {
    const key = `half-${Math.random()}`;
    // Drain the bucket completely.
    for (let i = 0; i < 10; i++) isRateLimited(key, 10);
    expect(isRateLimited(key, 10)).toBe(true);

    // 30s at 10 tokens/60s earns ~5 tokens (minus the one the blocked
    // attempt above could not spend — blocking never consumes tokens).
    vi.advanceTimersByTime(30_000);
    for (let i = 0; i < 5; i++) {
      expect(isRateLimited(key, 10)).toBe(false);
    }
    expect(isRateLimited(key, 10)).toBe(true);
  });

  it("restores the full budget after a complete idle window", () => {
    const key = `full-${Math.random()}`;
    for (let i = 0; i < 3; i++) isRateLimited(key, 3);
    expect(isRateLimited(key, 3)).toBe(true);

    vi.advanceTimersByTime(61_000);
    for (let i = 0; i < 3; i++) {
      expect(isRateLimited(key, 3)).toBe(false);
    }
    expect(isRateLimited(key, 3)).toBe(true);
  });

  it("never exceeds capacity no matter how long the idle period", () => {
    const key = `cap-${Math.random()}`;
    isRateLimited(key, 2);
    vi.advanceTimersByTime(10 * 60_000);
    expect(isRateLimited(key, 2)).toBe(false);
    expect(isRateLimited(key, 2)).toBe(false);
    expect(isRateLimited(key, 2)).toBe(true);
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
