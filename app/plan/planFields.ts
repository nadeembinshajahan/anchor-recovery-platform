/**
 * Shared constants and validation for the safety-plan form field groups.
 */

export const PRESET_TOOLS = [
  "Cold water on face",
  "Walk outside",
  "Call someone",
  "Music",
  "Prayer / dua",
  "Push-ups",
  "Journaling",
  "Shower",
] as const;

const PHONE_PATTERN = /^\+?[\d\s-]{7,17}$/;

export const FIELD_CLASSES =
  "plan-input w-full text-foreground placeholder:text-muted/70 transition";

export function isValidPhone(value: string): boolean {
  if (!value) return true; // optional field
  const digits = value.replace(/\D/g, "");
  return PHONE_PATTERN.test(value) && digits.length >= 7 && digits.length <= 15;
}
