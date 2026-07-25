/**
 * Prompt construction and request validation for every generation task the
 * app supports. Keeping this in one module makes the AI surface auditable:
 * nothing reaches the model that is not built here.
 */
import { MAX_INPUT_CHARS } from "./config";

export const TASK_TYPES = [
  "emergency-script",
  "caregiver-script",
  "explain-topic",
  "companion-reply",
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

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
  };
}

const BASE_GUARDRAILS = `You are Anchor, a calm recovery-support companion inside a
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
export const COMPANION_SYSTEM_PROMPT = `You are Anchor, a warm voice companion
inside a substance-use recovery app, having a real-time spoken conversation.
- You are not a clinician. Never diagnose, never give medication or dosage advice.
- Speak in 1-3 short, natural sentences per reply. Ask at most one gentle question.
- Never lecture, never judge. Meet the person where they are.
- If they mention overdose, self-harm, or a medical emergency, tell them first to
  call 112 (India) or the KIRAN helpline 1800-599-0019 right away.`;

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
};

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

  return {
    system: `${BASE_GUARDRAILS}\n\n${TASK_INSTRUCTIONS[req.task]}`,
    user: `${profileLines ? profileLines + "\n\n" : ""}Situation: ${req.context}`,
  };
}
