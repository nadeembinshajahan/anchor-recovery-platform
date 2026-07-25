import { describe, expect, it } from "vitest";
import { MAX_INPUT_CHARS } from "@/lib/config";
import { catalogueForPrompt } from "@/lib/sources";
import {
  buildPrompt,
  parseGenerateRequest,
  RESPONSE_LANGUAGES,
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

  it("omits the coping-tools line for an empty array without leaking a falsy '0'", () => {
    const { user } = buildPrompt({
      ...base,
      profile: { name: "Asha", copingTools: [] },
    });
    expect(user).not.toContain("Coping tools");
    // `copingTools?.length &&` yields 0 for []; ensure it is filtered, not printed.
    expect(user).not.toMatch(/^0$/m);
    expect(user).toContain("Their name: Asha");
  });
});

describe("citation rules", () => {
  it("accepts prevention-plan as a valid task type", () => {
    expect(TASK_TYPES).toContain("prevention-plan");
    expect(
      parseGenerateRequest({ task: "prevention-plan", context: "A wedding on Saturday" }),
    ).not.toBeNull();
  });

  it("injects the verified catalogue and only-from-catalogue rule for cited tasks", () => {
    for (const task of ["explain-topic", "caregiver-script", "prevention-plan"] as const) {
      const { system } = buildPrompt({ task, context: "test" });
      expect(system).toContain(catalogueForPrompt());
      expect(system).toContain("never invent sources");
    }
  });

  it("keeps crisis and companion prompts citation-free", () => {
    for (const task of ["emergency-script", "companion-reply"] as const) {
      const { system } = buildPrompt({ task, context: "test" });
      expect(system).not.toContain(catalogueForPrompt());
      expect(system).not.toContain("[S1]");
    }
  });
});

describe("response language", () => {
  it("accepts a catalogue language code", () => {
    const parsed = parseGenerateRequest({
      task: "explain-topic",
      context: "cravings",
      profile: { language: "ml" },
    });
    expect(parsed?.profile?.language).toBe("ml");
  });

  it("silently drops unknown or non-string language values", () => {
    for (const language of ["xx", "en-GB", 7, null]) {
      const parsed = parseGenerateRequest({
        task: "explain-topic",
        context: "cravings",
        profile: { language },
      });
      expect(parsed).not.toBeNull();
      expect(parsed?.profile?.language).toBeUndefined();
    }
  });

  it("instructs the model to respond in the requested language", () => {
    for (const [code, names] of Object.entries(RESPONSE_LANGUAGES)) {
      const { system } = buildPrompt({
        task: "explain-topic",
        context: "test",
        profile: { language: code },
      });
      expect(system).toContain(`Respond entirely in ${names.native}`);
      expect(system).toContain(names.english);
    }
  });

  it("adds no language rule for English or absent language", () => {
    const noProfile = buildPrompt({ task: "explain-topic", context: "test" });
    const enProfile = buildPrompt({
      task: "explain-topic",
      context: "test",
      profile: { name: "Asha" },
    });
    expect(noProfile.system).not.toContain("Respond entirely in");
    expect(enProfile.system).not.toContain("Respond entirely in");
  });
});
