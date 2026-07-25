/**
 * Central configuration. Model names live here so they can be bumped in one
 * place without touching feature code.
 */
export const GEMINI_TEXT_MODEL = "gemini-3.6-flash";
/**
 * Live voice model. Pinned to the 12-2025 native-audio release: fastest
 * first-reply latency of the working models in direct measurement
 * (2026-07-25). NOT gemini-3.1-flash-live-preview — it accepts connections
 * then drops them with server error 1011 (verified by repro; retested same
 * day, still broken).
 */
export const GEMINI_LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

/** Hard cap on user-supplied text sent to the model (characters). */
export const MAX_INPUT_CHARS = 2000;

/** Requests allowed per IP per minute on generation endpoints. */
export const RATE_LIMIT_PER_MINUTE = 20;

/**
 * Crisis helplines shown throughout the app. India-first (event locale),
 * with an international fallback.
 */
export const HELPLINES = [
  {
    name: "National De-addiction Helpline (India, 24x7)",
    tel: "14446",
    display: "14446",
  },
  {
    name: "Tele-MANAS (India, 24x7)",
    tel: "14416",
    display: "14416",
  },
  {
    name: "Vandrevala Foundation (India, 24x7)",
    tel: "+919999666555",
    display: "+91 99996 66555",
  },
] as const;
