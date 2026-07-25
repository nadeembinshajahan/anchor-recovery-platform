import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stableCacheKey, TtlLruCache } from "@/lib/cache";

describe("TtlLruCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and retrieves values", () => {
    const cache = new TtlLruCache<string>({ maxEntries: 2, ttlMs: 1000 });
    cache.set("a", "alpha");
    expect(cache.get("a")).toBe("alpha");
    expect(cache.get("missing")).toBeUndefined();
  });

  it("evicts the least-recently-used entry at capacity", () => {
    const cache = new TtlLruCache<string>({ maxEntries: 2, ttlMs: 60_000 });
    cache.set("a", "alpha");
    cache.set("b", "beta");
    cache.set("c", "gamma"); // capacity 2 → "a" (oldest) is evicted

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe("beta");
    expect(cache.get("c")).toBe("gamma");
  });

  it("get() refreshes recency so the read key survives eviction", () => {
    const cache = new TtlLruCache<string>({ maxEntries: 2, ttlMs: 60_000 });
    cache.set("a", "alpha");
    cache.set("b", "beta");
    cache.get("a"); // "a" becomes most recent; "b" is now LRU
    cache.set("c", "gamma");

    expect(cache.get("a")).toBe("alpha");
    expect(cache.get("b")).toBeUndefined();
  });

  it("re-setting an existing key refreshes its recency and value", () => {
    const cache = new TtlLruCache<string>({ maxEntries: 2, ttlMs: 60_000 });
    cache.set("a", "alpha");
    cache.set("b", "beta");
    cache.set("a", "alpha-2"); // refresh, no eviction (size stays 2)
    cache.set("c", "gamma"); // evicts "b", the LRU

    expect(cache.get("a")).toBe("alpha-2");
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe("gamma");
    expect(cache.size).toBe(2);
  });

  it("expires entries after the TTL", () => {
    const cache = new TtlLruCache<string>({ maxEntries: 5, ttlMs: 1000 });
    cache.set("a", "alpha");

    vi.advanceTimersByTime(999);
    expect(cache.get("a")).toBe("alpha");

    vi.advanceTimersByTime(1);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.size).toBe(0); // expired entry was evicted on access
  });

  it("rejects invalid configuration", () => {
    expect(() => new TtlLruCache({ maxEntries: 0, ttlMs: 1000 })).toThrow();
    expect(() => new TtlLruCache({ maxEntries: 1, ttlMs: 0 })).toThrow();
  });
});

describe("stableCacheKey", () => {
  it("is independent of object key order", () => {
    expect(stableCacheKey({ a: 1, b: 2 })).toBe(stableCacheKey({ b: 2, a: 1 }));
  });

  it("sorts keys recursively in nested objects", () => {
    const one = { outer: { x: 1, y: { p: true, q: false } }, list: [1, 2] };
    const two = { list: [1, 2], outer: { y: { q: false, p: true }, x: 1 } };
    expect(stableCacheKey(one)).toBe(stableCacheKey(two));
  });

  it("preserves array order (order is meaningful)", () => {
    expect(stableCacheKey({ tools: ["walk", "music"] })).not.toBe(
      stableCacheKey({ tools: ["music", "walk"] }),
    );
  });

  it("distinguishes genuinely different values", () => {
    expect(stableCacheKey({ task: "explain-topic", context: "cravings" })).not.toBe(
      stableCacheKey({ task: "explain-topic", context: "triggers" }),
    );
  });

  it("omits undefined properties like JSON.stringify does", () => {
    expect(stableCacheKey({ a: 1, b: undefined })).toBe(stableCacheKey({ a: 1 }));
  });
});
