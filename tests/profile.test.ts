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
});
