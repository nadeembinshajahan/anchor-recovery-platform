import { NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
import { parseGenerateRequest } from "@/lib/prompts";
import { clientKey, isRateLimited } from "@/lib/rateLimit";

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

  try {
    const text = await generateText(parsed);
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
