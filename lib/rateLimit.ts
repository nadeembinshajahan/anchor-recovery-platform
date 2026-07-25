/**
 * O(1) token-bucket rate limiter.
 *
 * Each client key owns a bucket with `capacity = limit` tokens that refills
 * continuously at `limit` tokens per minute. A request spends one token;
 * an empty bucket means the request is limited. The available balance is
 * derived lazily from the timestamp of the last refill — no timers, no
 * per-request array scans.
 *
 * Why token bucket over the previous sliding-window-log approach:
 * - Time:   O(1) per request (two arithmetic ops) vs O(n) re-filtering a
 *           timestamp array on every hit.
 * - Memory: O(1) per key (two numbers) vs O(limit) timestamps per key.
 * - UX:     tokens refill continuously, so a client that briefly bursts is
 *           readmitted gradually instead of waiting for a full window reset.
 *
 * State is in-memory and per-instance — the right trade-off for a single-VM
 * demo deployment; swap the Map for Redis (same algorithm) to scale out.
 */
import { RATE_LIMIT_PER_MINUTE } from "./config";

const WINDOW_MS = 60_000;
/** Hard cap on tracked keys so hostile traffic cannot grow memory unbounded. */
const MAX_KEYS = 5000;

interface Bucket {
  /** Tokens currently available (fractional between refills). */
  tokens: number;
  /** Timestamp of the last lazy refill. */
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Returns true when `key` has exhausted its budget of `limit` requests per
 * minute. Consumes one token on success.
 */
export function isRateLimited(key: string, limit = RATE_LIMIT_PER_MINUTE): boolean {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    if (buckets.size >= MAX_KEYS) evictStale(now);
    bucket = { tokens: limit, lastRefill: now };
    buckets.set(key, bucket);
  } else {
    // Lazy continuous refill: elapsed time earns fractional tokens.
    const earned = ((now - bucket.lastRefill) / WINDOW_MS) * limit;
    bucket.tokens = Math.min(limit, bucket.tokens + earned);
    bucket.lastRefill = now;
  }

  if (bucket.tokens < 1) return true;
  bucket.tokens -= 1;
  return false;
}

/**
 * Drops buckets that have been idle long enough to be full again — they are
 * indistinguishable from brand-new buckets, so removing them is lossless.
 * Falls back to clearing everything in the pathological case where all keys
 * are simultaneously active at the cap (fail-open keeps the API usable).
 */
function evictStale(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill >= WINDOW_MS) buckets.delete(key);
  }
  if (buckets.size >= MAX_KEYS) buckets.clear();
}

/** Extract a best-effort client key from request headers. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "local";
}
