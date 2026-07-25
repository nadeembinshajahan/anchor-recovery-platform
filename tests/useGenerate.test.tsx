/**
 * Tests for the shared useGenerate hook: success path, HTTP error path,
 * network failure, stale-response supersession, and reset().
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGenerate } from "@/lib/useGenerate";

type FetchResult = { ok: boolean; json: () => Promise<unknown> };

function jsonResponse(body: unknown, ok = true): FetchResult {
  return { ok, json: () => Promise.resolve(body) };
}

/** A fetch stub whose resolution the test controls explicitly. */
function deferredFetch(): {
  promise: Promise<FetchResult>;
  resolve: (r: FetchResult) => void;
} {
  let resolve!: (r: FetchResult) => void;
  const promise = new Promise<FetchResult>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useGenerate", () => {
  it("returns text and stores it on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ text: "hello there" })),
    );
    const { result } = renderHook(() => useGenerate());

    let returned: string | null = null;
    await act(async () => {
      returned = await result.current.generate({ task: "explain-topic", context: "cravings" });
    });

    expect(returned).toBe("hello there");
    expect(result.current.text).toBe("hello there");
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("captures the response signature and clears it on reset", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ text: "signed answer", sig: "a".repeat(64) })),
    );
    const { result } = renderHook(() => useGenerate());

    await act(async () => {
      await result.current.generate({ task: "explain-topic", context: "triggers" });
    });
    expect(result.current.sig).toBe("a".repeat(64));

    act(() => {
      result.current.reset();
    });
    expect(result.current.sig).toBeNull();
  });

  it("leaves sig null when the server omits it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ text: "unsigned answer" })),
    );
    const { result } = renderHook(() => useGenerate());
    await act(async () => {
      await result.current.generate({ task: "explain-topic", context: "halt" });
    });
    expect(result.current.text).toBe("unsigned answer");
    expect(result.current.sig).toBeNull();
  });

  it("sets the server error message and returns null on HTTP failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "Too many requests. Please wait a moment." }, false)),
    );
    const { result } = renderHook(() => useGenerate());

    let returned: string | null = "sentinel";
    await act(async () => {
      returned = await result.current.generate({ task: "emergency-script", context: "craving" });
    });

    expect(returned).toBeNull();
    expect(result.current.text).toBeNull();
    expect(result.current.error).toContain("Too many requests");
    expect(result.current.loading).toBe(false);
  });

  it("sets a friendly error and returns null when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network down")));
    const { result } = renderHook(() => useGenerate());

    let returned: string | null = "sentinel";
    await act(async () => {
      returned = await result.current.generate({ task: "caregiver-script", context: "denial" });
    });

    expect(returned).toBeNull();
    expect(result.current.error).toBeTruthy();
    expect(result.current.loading).toBe(false);
  });

  it("discards a stale response when a newer request supersedes it", async () => {
    const slow = deferredFetch();
    const fast = deferredFetch();
    const fetchMock = vi
      .fn<(...args: unknown[]) => Promise<FetchResult>>()
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fast.promise);
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useGenerate());

    let first: Promise<string | null>;
    let second: Promise<string | null>;
    await act(async () => {
      first = result.current.generate({ task: "explain-topic", context: "old" });
      second = result.current.generate({ task: "explain-topic", context: "new" });
      // Newer request resolves first; the older one lands afterwards, stale.
      fast.resolve(jsonResponse({ text: "fresh answer" }));
      slow.resolve(jsonResponse({ text: "stale answer" }));
      await Promise.all([first, second]);
    });

    await expect(first!).resolves.toBeNull();
    await expect(second!).resolves.toBe("fresh answer");
    expect(result.current.text).toBe("fresh answer");
    expect(result.current.loading).toBe(false);
  });

  it("reset() clears state and invalidates in-flight requests", async () => {
    const slow = deferredFetch();
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(slow.promise));
    const { result } = renderHook(() => useGenerate());

    let pending: Promise<string | null>;
    act(() => {
      pending = result.current.generate({ task: "explain-topic", context: "topic" });
    });
    act(() => {
      result.current.reset();
    });
    await act(async () => {
      slow.resolve(jsonResponse({ text: "late arrival" }));
      await pending;
    });

    await expect(pending!).resolves.toBeNull();
    expect(result.current.text).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
