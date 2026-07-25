/**
 * Minimal in-memory sliding-window rate limiter. Suitable for a single
 * serverless instance / demo deployment; swap for Redis in production.
 */
import { RATE_LIMIT_PER_MINUTE } from "./config";

const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, limit = RATE_LIMIT_PER_MINUTE): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  // Opportunistic cleanup so the map cannot grow without bound.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

/** Extract a best-effort client key from request headers. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "local";
}
