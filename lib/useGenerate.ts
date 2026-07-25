"use client";

/**
 * Shared hook for calling the app's single AI endpoint (/api/generate).
 *
 * Why this exists: four client features (SOS scripts, companion quick
 * phrases, topic explanations, caregiver scripts) previously each carried
 * their own copy of the same fetch/parse/error boilerplate. Centralizing it
 * removes the duplication, gives every call site identical error handling,
 * and adds a stale-response guard the ad-hoc copies lacked.
 *
 * Stale-response guard: users under stress tap fast. If `generate()` is
 * called again while an earlier request is still in flight, the earlier
 * response must not clobber the newer one when it eventually resolves. Each
 * call takes an incrementing id; only the latest id may commit state.
 */
import { useCallback, useRef, useState } from "react";
import type { GenerateRequest, TaskType } from "./prompts";

export interface GenerateArgs {
  task: TaskType;
  context: string;
  profile?: GenerateRequest["profile"];
}

export interface UseGenerateResult {
  /**
   * Fire a generation request. Resolves with the generated text, or null on
   * any failure (state.error is set instead — components never need try/catch).
   */
  generate: (args: GenerateArgs) => Promise<string | null>;
  /** Last successful generation, or null before/after reset. */
  text: string | null;
  loading: boolean;
  /** Friendly, user-displayable message; null while healthy. */
  error: string | null;
  /** Clear text/error/loading back to the initial state. */
  reset: () => void;
}

const FRIENDLY_ERROR =
  "The assistant is unavailable right now. What's on screen still works — please try again in a moment.";

export function useGenerate(): UseGenerateResult {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Monotonic id of the most recent generate() call. */
  const requestId = useRef(0);

  const generate = useCallback(async (args: GenerateArgs): Promise<string | null> => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      const data = (await res.json().catch(() => ({}))) as {
        text?: string;
        error?: string;
      };

      // A newer request superseded this one while it was in flight.
      if (id !== requestId.current) return null;

      if (!res.ok || !data.text) {
        setError(data.error ?? FRIENDLY_ERROR);
        return null;
      }
      setText(data.text);
      return data.text;
    } catch {
      if (id === requestId.current) setError(FRIENDLY_ERROR);
      return null;
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    requestId.current += 1; // invalidate anything still in flight
    setText(null);
    setError(null);
    setLoading(false);
  }, []);

  return { generate, text, loading, error, reset };
}
