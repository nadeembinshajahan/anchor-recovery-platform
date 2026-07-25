import { describe, expect, it } from "vitest";
import { MAX_INPUT_CHARS } from "@/lib/config";
import {
  buildPrompt,
  parseGenerateRequest,
  TASK_TYPES,
  type GenerateRequest,
} from "@/lib/prompts";

describe("parseGenerateRequest", () => {
  it("rejects non-object bodies", () => {
    expect(parseGenerateRequest(null)).toBeNull();
    expect(parseGenerateRequest("string")).toBeNull();
    expect(parseGenerateRequest(42)).toBeNull();
    expect(parseGenerateRequest(undefined)).toBeNull();
  });

  it("rejects unknown task types", () => {
    expect(
      parseGenerateRequest({ task: "hack-the-planet", context: "hello" }),
    ).toBeNull();
  });

  it("rejects missing or empty context", () => {
    expect(parseGenerateRequest({ task: "emergency-script" })).toBeNull();
    expect(
      parseGenerateRequest({ task: "emergency-script", context: "   " }),
    ).toBeNull();
    expect(
      parseGenerateRequest({ task: "emergency-script", context: 7 }),
    ).toBeNull();
  });

  it("accepts every declared task type", () => {
    for (const task of TASK_TYPES) {
      expect(parseGenerateRequest({ task, context: "help" })).toEqual(
        expect.objectContaining({ task, context: "help" }),
      );
    }
  });

  it("trims and caps context length", () => {
    const long = "x".repeat(MAX_INPUT_CHARS + 500);
    const parsed = parseGenerateRequest({
      task: "explain-topic",
      context: `  ${long}  `,
    });
    expect(parsed?.context).toHaveLength(MAX_INPUT_CHARS);
  });

  it("sanitizes the profile", () => {
    const parsed = parseGenerateRequest({
      task: "emergency-script",
      context: "craving",
      profile: {
        name: `  ${"n".repeat(200)}  `,
        substance: "",
        supporter: 99,
        copingTools: ["walk", 123, "music", ...Array(20).fill("tool")],
      },
    });
    expect(parsed?.profile?.name).toHaveLength(100);
    expect(parsed?.profile?.substance).toBeUndefined();
    expect(parsed?.profile?.supporter).toBeUndefined();
    expect(parsed?.profile?.copingTools).toHaveLength(10);
    expect(parsed?.profile?.copingTools).not.toContain(123);
  });

  it("caps coping tool entry length", () => {
    const parsed = parseGenerateRequest({
      task: "emergency-script",
      context: "craving",
      profile: { copingTools: ["t".repeat(500)] },
    });
    expect(parsed?.profile?.copingTools?.[0]).toHaveLength(100);
  });
});

describe("buildPrompt", () => {
  const base: GenerateRequest = {
    task: "emergency-script",
    context: "I'm having a craving",
  };

  it("includes the base guardrails and task instruction", () => {
    const { system } = buildPrompt(base);
    expect(system).toContain("not a clinician");
    expect(system).toContain("grounding script");
  });

  it("has instructions for every task type", () => {
    for (const task of TASK_TYPES) {
      const { system } = buildPrompt({ ...base, task });
      // Guardrails plus a non-empty task-specific block.
      expect(system.length).toBeGreaterThan(300);
    }
  });

  it("includes profile lines when profile is present", () => {
    const { user } = buildPrompt({
      ...base,
      profile: {
        name: "Asha",
        substance: "alcohol",
        supporter: "brother Ravi",
        copingTools: ["cold water", "walking"],
      },
    });
    expect(user).toContain("Their name: Asha");
    expect(user).toContain("recovering from: alcohol");
    expect(user).toContain("brother Ravi");
    expect(user).toContain("cold water, walking");
    expect(user).toContain("Situation: I'm having a craving");
  });

  it("omits the profile block when absent", () => {
    const { user } = buildPrompt(base);
    expect(user).toBe("Situation: I'm having a craving");
  });

  it("omits empty profile fields", () => {
    const { user } = buildPrompt({ ...base, profile: { name: "Asha" } });
    expect(user).toContain("Their name: Asha");
    expect(user).not.toContain("recovering from");
    expect(user).not.toContain("Coping tools");
  });
});
