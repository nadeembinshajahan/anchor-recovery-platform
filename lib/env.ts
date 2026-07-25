import "server-only";

/**
 * Typed, validated access to server environment configuration.
 *
 * Read lazily at call time (never at import time) so builds without secrets
 * — CI, Docker image builds — succeed, and misconfiguration surfaces as a
 * clear error on first use instead of a mystery crash.
 */
import { z } from "zod";

const envSchema = z.object({
  /** Powers all Gemini text generation and Live ephemeral-token minting. */
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is not configured"),
  /** Optional: enables the Maps Embed API on /nearby (keyless fallback otherwise). */
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

/** Parse and return the validated environment. Throws with a readable message. */
export function serverEnv(): ServerEnv {
  return envSchema.parse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });
}

/** Non-throwing check used by the health endpoint. */
export function isConfigured(): boolean {
  return envSchema.safeParse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  }).success;
}
