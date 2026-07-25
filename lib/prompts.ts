/**
 * Prompt construction and request validation for every generation task the
 * app supports. Keeping this in one module makes the AI surface auditable:
 * nothing reaches the model that is not built here.
 */
import { MAX_INPUT_CHARS } from "./config";
import { catalogueForPrompt } from "./sources";

export const TASK_TYPES = [
  "emergency-script",
  "caregiver-script",
  "explain-topic",
  "companion-reply",
  "prevention-plan",
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

/**
 * Reply languages the API honors, mapped to the names used in the prompt.
 * Must stay in sync with PLAN_LANGUAGES in lib/profile.ts (kept separate
 * because this module is imported server-side and profile.ts is a client
 * module).
 */
export const RESPONSE_LANGUAGES: Record<
  string,
  { native: string; english: string }
> = {
  ml: { native: "മലയാളം", english: "Malayalam" },
  hi: { native: "हिन्दी", english: "Hindi" },
  ta: { native: "தமிழ்", english: "Tamil" },
};

export interface GenerateRequest {
  task: TaskType;
  /** Situation/topic selected in the UI (from fixed choices, zero typing). */
  context: string;
  /** Optional personalization from the on-device safety plan. */
  profile?: {
    name?: string;
    substance?: string;
    supporter?: string;
    copingTools?: string[];
    /** Preferred reply language code (validated against RESPONSE_LANGUAGES). */
    language?: string;
  };
}

const BASE_GUARDRAILS = `You are Pulari, a calm recovery-support companion inside a
substance-use recovery app. Rules you must always follow:
- You are not a clinician. Never diagnose, never give medication or dosage advice.
- Never be judgmental. Use plain, warm, short sentences (the reader is under stress).
- If the situation sounds like a medical emergency or overdose, your FIRST line must
  tell the person to call local emergency services (112 in India) immediately.
- Keep responses under 180 words unless asked otherwise.`;

/**
 * System prompt for the real-time voice companion (Gemini Live). Spoken
 * replies must stay short: long answers feel like lectures when read aloud.
 */
export const COMPANION_SYSTEM_PROMPT = `You are Pulari, a warm voice companion
inside a substance-use recovery app, having a real-time spoken conversation.
- You are not a clinician. Never diagnose, never give medication or dosage advice.
- Speak in 1-3 short, natural sentences per reply. Ask at most one gentle question.
- Never lecture, never judge. Meet the person where they are.
- Language: speak English by default. If the person speaks to you in Malayalam,
  Hindi, Tamil, or another Indian language, reply in that same language and stay
  in it until they switch. Never respond in a language the person has not used.
- If they mention overdose, self-harm, or a medical emergency, tell them first to
  call 112 (India) or the national de-addiction helpline 14446 right away.`;

const TASK_INSTRUCTIONS: Record<TaskType, string> = {
  "emergency-script": `The user tapped a crisis button and cannot type much.
Write a personal, step-by-step grounding script for the situation described.
Format: 4-6 numbered micro-steps, each one sentence, each doable in under a
minute, then one closing line of encouragement. Address the user by name if given.`,
  "caregiver-script": `The reader is a family member or caregiver of someone in
recovery. Give them a short "say this, not that" script for the situation:
3 things to say (quoted), 3 things to avoid saying (quoted), and 2 concrete
actions to take. Be practical and non-clinical.`,
  "explain-topic": `Explain the recovery topic below to a stressed non-expert.
Use at most 5 short paragraphs or bullets, no jargon, reading level ~grade 7.
End with one practical takeaway starting with "Try this:".`,
  "companion-reply": `Continue a supportive voice conversation. Reply in 2-4
short spoken-style sentences. Ask at most one gentle question. Never lecture.`,
  "prevention-plan": `The user named an upcoming high-risk situation (a party,
a wedding, meeting old friends, payday). Build them a compact prevention plan:
"Before" — 3 numbered preparation steps; "On the day" — 3 numbered in-the-moment
steps; one polite exit line they can say word-for-word (quoted); one specific
ask they can send a trusted ally (quoted); and 2 early warning signs that mean
"leave now". Keep every item to one sentence.`,
};

/**
 * Tasks whose answers may include factual/clinical claims get the verified
 * source catalogue and are told to cite ONLY from it. Crisis scripts and
 * companion chat stay citation-free — nobody needs footnotes mid-panic.
 */
const CITED_TASKS: ReadonlySet<TaskType> = new Set([
  "explain-topic",
  "caregiver-script",
  "prevention-plan",
]);

function citationRules(): string {
  return `\n\nWhen you state a factual or clinical claim, append a citation id
like [S2] chosen ONLY from this verified catalogue (never invent sources or
cite anything outside it; if no catalogue entry fits, make no citation):
${catalogueForPrompt()}`;
}

/** Type guard + sanitation for incoming API payloads. */
export function parseGenerateRequest(body: unknown): GenerateRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.task !== "string" || !TASK_TYPES.includes(b.task as TaskType)) {
    return null;
  }
  if (typeof b.context !== "string" || b.context.trim().length === 0) {
    return null;
  }
  const context = b.context.trim().slice(0, MAX_INPUT_CHARS);

  let profile: GenerateRequest["profile"];
  if (typeof b.profile === "object" && b.profile !== null) {
    const p = b.profile as Record<string, unknown>;
    profile = {
      name: clean(p.name),
      substance: clean(p.substance),
      supporter: clean(p.supporter),
      copingTools: Array.isArray(p.copingTools)
        ? p.copingTools.filter((t): t is string => typeof t === "string").map((t) => t.slice(0, 100)).slice(0, 10)
        : undefined,
      // Only catalogue languages pass through; anything else is dropped
      // silently — the client is never trusted to steer the prompt freely.
      language:
        typeof p.language === "string" && p.language in RESPONSE_LANGUAGES
          ? p.language
          : undefined,
    };
  }
  return { task: b.task as TaskType, context, profile };
}

function clean(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, 100) : undefined;
}

/** Build the final prompt pair sent to Gemini. */
export function buildPrompt(req: GenerateRequest): {
  system: string;
  user: string;
} {
  const profileLines = req.profile
    ? [
        req.profile.name && `Their name: ${req.profile.name}`,
        req.profile.substance && `They are recovering from: ${req.profile.substance}`,
        req.profile.supporter && `Trusted supporter they can call: ${req.profile.supporter}`,
        req.profile.copingTools?.length &&
          `Coping tools that have worked for them before: ${req.profile.copingTools.join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const language = req.profile?.language
    ? RESPONSE_LANGUAGES[req.profile.language]
    : undefined;
  const languageRule = language
    ? `\n\nRespond entirely in ${language.native} (${language.english}). Keep
helpline numbers and citation ids like [S2] exactly as they are.`
    : "";

  return {
    system: `${BASE_GUARDRAILS}\n\n${TASK_INSTRUCTIONS[req.task]}${
      CITED_TASKS.has(req.task) ? citationRules() : ""
    }${languageRule}`,
    user: `${profileLines ? profileLines + "\n\n" : ""}Situation: ${req.context}`,
  };
}
