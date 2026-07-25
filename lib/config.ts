/**
 * Central configuration. Model names live here so they can be bumped in one
 * place without touching feature code.
 */
export const GEMINI_TEXT_MODEL = "gemini-2.5-flash";
export const GEMINI_LIVE_MODEL = "gemini-3.1-flash-live-preview";

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
    name: "KIRAN Mental Health Helpline (India, 24x7)",
    tel: "18005990019",
    display: "1800-599-0019",
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
