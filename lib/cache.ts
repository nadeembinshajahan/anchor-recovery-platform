/**
 * Dependency-free TTL + LRU cache for server-side response reuse.
 *
 * Identical generation requests (same task, context, and profile) produce
 * interchangeable responses within a short window, so re-hitting the model
 * for them wastes latency, tokens, and quota. This cache bounds both
 * staleness (TTL) and memory (LRU capacity).
 */

interface CacheEntry<V> {
  value: V;
  /** Absolute epoch-ms timestamp after which the entry is a miss. */
  expiresAt: number;
}

export interface TtlLruCacheOptions {
  /** Maximum number of live entries; the least-recently-used is evicted first. */
  maxEntries: number;
  /** Time-to-live per entry in milliseconds. */
  ttlMs: number;
}

/**
 * LRU is implemented with a plain Map: Maps iterate in insertion order, so
 * deleting and re-inserting a key on every access keeps the first key the
 * least-recently-used one. All operations are O(1).
 */
export class TtlLruCache<V> {
  private readonly entries = new Map<string, CacheEntry<V>>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(options: TtlLruCacheOptions) {
    if (options.maxEntries < 1) {
      throw new Error("maxEntries must be at least 1");
    }
    if (options.ttlMs <= 0) {
      throw new Error("ttlMs must be positive");
    }
    this.maxEntries = options.maxEntries;
    this.ttlMs = options.ttlMs;
  }

  get(key: string): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      // Expired entries are evicted lazily, on access.
      this.entries.delete(key);
      return undefined;
    }
    // Refresh recency: move the key to the end of the iteration order.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V): void {
    // Re-setting a key must also refresh its position, so delete first.
    this.entries.delete(key);
    if (this.entries.size >= this.maxEntries) {
      // First key in iteration order is the least recently used.
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  get size(): number {
    return this.entries.size;
  }
}

/**
 * Deterministically serialize a value for use as a cache key.
 *
 * Plain JSON.stringify is insufficient because object key order follows
 * insertion order: `{a:1,b:2}` and `{b:2,a:1}` describe the same request
 * but would serialize differently and defeat the cache. This helper sorts
 * object keys recursively so equal values always produce equal keys.
 */
export function stableCacheKey(parts: unknown): string {
  return JSON.stringify(sortValue(parts));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    // Array order is meaningful (e.g. ordered coping tools) — preserve it.
    return value.map(sortValue);
  }
  if (typeof value === "object" && value !== null) {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const v = (value as Record<string, unknown>)[key];
      // Match JSON.stringify semantics: undefined properties are omitted.
      if (v !== undefined) sorted[key] = sortValue(v);
    }
    return sorted;
  }
  return value;
}
