/**
 * Tests for the HMAC text-signing module that gates /api/tts.
 */
import { describe, expect, it } from "vitest";
import { signText, verifyText } from "@/lib/sign";

describe("signText / verifyText", () => {
  it("round-trips: a signed text verifies", () => {
    const text = "Take one slow breath. You are safe in this moment.";
    expect(verifyText(text, signText(text))).toBe(true);
  });

  it("rejects tampered text", () => {
    const sig = signText("original answer");
    expect(verifyText("original answer!", sig)).toBe(false);
    expect(verifyText("Original answer", sig)).toBe(false);
  });

  it("produces different signatures for different texts", () => {
    expect(signText("one")).not.toBe(signText("two"));
  });

  it("is stable for the same text within a process", () => {
    expect(signText("same text")).toBe(signText("same text"));
  });

  it("returns false (never throws) for malformed signatures", () => {
    expect(verifyText("text", "")).toBe(false);
    expect(verifyText("text", "not-hex")).toBe(false);
    expect(verifyText("text", "abcd")).toBe(false); // wrong length
    expect(verifyText("text", "z".repeat(64))).toBe(false); // non-hex chars
  });

  it("handles multi-byte (Malayalam) text", () => {
    const text = "നദീം, സങ്കടപ്പെടേണ്ട. ഈ നിമിഷം കടന്നുപോകും.";
    expect(verifyText(text, signText(text))).toBe(true);
    expect(verifyText(text + " ", signText(text))).toBe(false);
  });
});
