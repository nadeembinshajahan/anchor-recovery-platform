import "server-only";

/**
 * Server-side Gemini access. The API key never leaves this module: clients
 * talk to our route handlers, and the Live voice feature receives a
 * short-lived ephemeral token instead of the real key.
 */
import { EndSensitivity, GoogleGenAI, StartSensitivity, ThinkingLevel } from "@google/genai";
import { GEMINI_LIVE_MODEL, GEMINI_TEXT_MODEL } from "./config";
import { buildPrompt, COMPANION_SYSTEM_PROMPT, type GenerateRequest } from "./prompts";

/**
 * Lazy singleton. The SDK client is stateless and safe to share, so we build
 * it once on first use instead of per request. The key check stays at call
 * time (not import time) so `next build` succeeds in CI with a placeholder.
 */
let cachedClient: GoogleGenAI | null = null;

function client(): GoogleGenAI {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

/** Upstream calls are abandoned after this long so a slow model response
 *  can never pin a connection open indefinitely. */
const GENERATION_TIMEOUT_MS = 30_000;

export async function generateText(req: GenerateRequest): Promise<string> {
  const { system, user } = buildPrompt(req);
  const response = await client().models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: user,
    config: {
      systemInstruction: system,
      // Note: temperature/topP are deprecated on Gemini 3.x text models and
      // deliberately omitted.
      // Thinking is capped at the lowest level: replies here are short,
      // structured support scripts where latency beats deliberation — and
      // thinking tokens count against maxOutputTokens, which previously
      // truncated answers mid-sentence.
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      maxOutputTokens: 2048,
      abortSignal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
    },
  });
  const text = response.text;
  if (!text) {
    throw new Error("Model returned an empty response");
  }
  return text.trim();
}

/**
 * Mint a single-use ephemeral token the browser can use to open a Gemini
 * Live session directly, without ever seeing the real API key.
 *
 * IMPORTANT (measured 2026-07-25): on ephemeral-token sessions the server
 * ignores parts of the connect-time config (a `realtimeInputConfig` sent at
 * connect had no effect; explicit-activity mode then failed with 1007
 * "not supported when automatic activity detection is enabled"). Session
 * config must therefore ride INSIDE the token's liveConnectConstraints.
 * The guardrail system prompt is pinned here for the same reason.
 */
export async function createLiveToken(): Promise<string> {
  const now = Date.now();
  const token = await client().authTokens.create({
    config: {
      uses: 1,
      expireTime: new Date(now + 30 * 60_000).toISOString(),
      newSessionExpireTime: new Date(now + 2 * 60_000).toISOString(),
      liveConnectConstraints: {
        model: GEMINI_LIVE_MODEL,
        config: {
          systemInstruction: COMPANION_SYSTEM_PROMPT,
          // Faster end-of-speech detection. Harness medians (speech-end →
          // first reply audio, 3 runs each): default VAD 5.2-6.8s; this
          // tuning 4.7-5.0s. Floor with VAD fully bypassed is ~4.1-4.7s
          // (model generation itself), so this captures most of the
          // available headroom without clipping slow speakers.
          realtimeInputConfig: {
            automaticActivityDetection: {
              startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
              endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
              prefixPaddingMs: 40,
              silenceDurationMs: 350,
            },
          },
        },
      },
      httpOptions: { apiVersion: "v1alpha" },
    },
  });
  if (!token.name) {
    throw new Error("Failed to mint ephemeral token");
  }
  return token.name;
}
