import { NextResponse } from "next/server";
import { stableCacheKey, TtlLruCache } from "@/lib/cache";
import { generateText } from "@/lib/gemini";
import { parseGenerateRequest, type TaskType } from "@/lib/prompts";
import { clientKey, isRateLimited } from "@/lib/rateLimit";

/**
 * Response cache for deterministic-enough tasks: two users tapping
 * "Explain this simply" on the same topic (or one user re-tapping a crisis
 * button) get an instant answer instead of a duplicate model call.
 * "companion-reply" is deliberately NOT cached — it is conversational, and
 * a repeated canned reply would feel robotic exactly where warmth matters.
 */
const CACHEABLE_TASKS: ReadonlySet<TaskType> = new Set([
  "emergency-script",
  "caregiver-script",
  "explain-topic",
]);

const responseCache = new TtlLruCache<string>({
  maxEntries: 300,
  ttlMs: 60 * 60 * 1000, // 1 hour
});

export async function POST(request: Request): Promise<NextResponse> {
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseGenerateRequest(body);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid request. Expected { task, context, profile? }." },
      { status: 400 },
    );
  }

  const cacheable = CACHEABLE_TASKS.has(parsed.task);
  // Key covers everything that shapes the output, including the profile —
  // personalized scripts must never leak between different users/plans.
  const key = cacheable ? stableCacheKey(parsed) : null;

  if (key) {
    const cached = responseCache.get(key);
    if (cached !== undefined) {
      return NextResponse.json({ text: cached, cached: true });
    }
  }

  try {
    const text = await generateText(parsed);
    if (key) responseCache.set(key, text);
    return NextResponse.json({ text });
  } catch (err) {
    // Never leak internals to the client; log server-side only.
    console.error("generate failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Generation is temporarily unavailable." },
      { status: 502 },
    );
  }
}
