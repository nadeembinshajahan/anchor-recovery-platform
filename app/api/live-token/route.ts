import { NextResponse } from "next/server";
import { createLiveToken } from "@/lib/gemini";
import { clientKey, isRateLimited } from "@/lib/rateLimit";

/**
 * Mints a single-use, short-lived ephemeral token so the browser can open
 * a Gemini Live voice session without ever receiving the real API key.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (isRateLimited(clientKey(request), 6)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  try {
    const token = await createLiveToken();
    return NextResponse.json({ token });
  } catch (err) {
    console.error("live-token failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Voice session is temporarily unavailable." },
      { status: 502 },
    );
  }
}
