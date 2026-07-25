import "server-only";

/**
 * Server-side Gemini access. The API key never leaves this module: clients
 * talk to our route handlers, and the Live voice feature receives a
 * short-lived ephemeral token instead of the real key.
 */
import { GoogleGenAI } from "@google/genai";
import { GEMINI_LIVE_MODEL, GEMINI_TEXT_MODEL } from "./config";
import { buildPrompt, type GenerateRequest } from "./prompts";

function client(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateText(req: GenerateRequest): Promise<string> {
  const { system, user } = buildPrompt(req);
  const response = await client().models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: user,
    config: {
      systemInstruction: system,
      temperature: 0.7,
      maxOutputTokens: 800,
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
      },
      httpOptions: { apiVersion: "v1alpha" },
    },
  });
  if (!token.name) {
    throw new Error("Failed to mint ephemeral token");
  }
  return token.name;
}
