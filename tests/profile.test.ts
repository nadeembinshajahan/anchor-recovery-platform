import { describe, expect, it } from "vitest";
import { EMPTY_PLAN, planToProfile, type SafetyPlan } from "@/lib/profile";

describe("planToProfile", () => {
  it("never includes the supporter phone number", () => {
    const plan: SafetyPlan = {
      name: "Asha",
      substance: "alcohol",
      supporter: "Ravi",
      supporterPhone: "+911234567890",
      copingTools: ["walking"],
      language: "en",
      updatedAt: "2026-07-25T00:00:00.000Z",
    };
    const profile = planToProfile(plan);
    expect(JSON.stringify(profile)).not.toContain("+911234567890");
    expect(profile).toEqual({
      name: "Asha",
      substance: "alcohol",
      supporter: "Ravi",
      copingTools: ["walking"],
    });
  });

  it("omits empty fields entirely", () => {
    const profile = planToProfile(EMPTY_PLAN);
    expect(profile.name).toBeUndefined();
    expect(profile.substance).toBeUndefined();
    expect(profile.supporter).toBeUndefined();
    expect(profile.copingTools).toBeUndefined();
  });

  it("omits language when it is the English default", () => {
    expect(planToProfile(EMPTY_PLAN).language).toBeUndefined();
    expect(planToProfile({ ...EMPTY_PLAN, language: "en" }).language).toBeUndefined();
  });

  it("includes a non-default language", () => {
    expect(planToProfile({ ...EMPTY_PLAN, language: "ml" }).language).toBe("ml");
  });

  it("defaults the stored plan language to English", () => {
    expect(EMPTY_PLAN.language).toBe("en");
  });
});
