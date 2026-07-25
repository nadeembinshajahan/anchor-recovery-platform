"use client";

/**
 * Editor for the on-device safety plan. Coping tools are preset toggle
 * chips (zero typing for the common case) with an optional free-text add.
 * Clearing data uses a two-tap confirm instead of window.confirm, which
 * would block the page.
 */
import { useState } from "react";
import { useSafetyPlan, type SafetyPlan } from "@/lib/profile";

const PRESET_TOOLS = [
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

function isValidPhone(value: string): boolean {
  if (!value) return true; // optional field
  const digits = value.replace(/\D/g, "");
  return PHONE_PATTERN.test(value) && digits.length >= 7 && digits.length <= 15;
}

export default function PlanForm() {
  const { plan, update, clear, ready } = useSafetyPlan();
  const [draft, setDraft] = useState<SafetyPlan | null>(null);
  const [customTool, setCustomTool] = useState("");
  const [phoneError, setPhoneError] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [clearArmed, setClearArmed] = useState(false);

  // Wait for localStorage before rendering values to avoid a hydration
  // mismatch between server (empty plan) and client (stored plan).
  if (!ready) {
    return (
      <p role="status" className="text-muted">
        Loading your plan…
      </p>
    );
  }

  const current = draft ?? plan;

  const set = (patch: Partial<SafetyPlan>) => {
    setDraft({ ...current, ...patch });
    setSavedMessage("");
  };

  const toggleTool = (tool: string) => {
    const has = current.copingTools.includes(tool);
    set({
      copingTools: has
        ? current.copingTools.filter((t) => t !== tool)
        : [...current.copingTools, tool],
    });
  };

  const addCustomTool = () => {
    const tool = customTool.trim().slice(0, 100);
    if (!tool || current.copingTools.includes(tool)) return;
    set({ copingTools: [...current.copingTools, tool] });
    setCustomTool("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = !isValidPhone(current.supporterPhone);
    setPhoneError(invalid);
    if (invalid) return;
    update(current);
    setDraft(null);
    setSavedMessage("Saved on this device.");
  };

  const handleClear = () => {
    if (!clearArmed) {
      setClearArmed(true);
      return;
    }
    clear();
    setDraft(null);
    setClearArmed(false);
    setSavedMessage("All data cleared from this device.");
  };

  const customTools = current.copingTools.filter(
    (t) => !PRESET_TOOLS.includes(t as (typeof PRESET_TOOLS)[number]),
  );

  return (
    <form onSubmit={handleSave} noValidate className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="plan-name" className="block font-medium">
            Your name
          </label>
          <input
            id="plan-name"
            type="text"
            value={current.name}
            onChange={(e) => set({ name: e.target.value })}
            maxLength={100}
            autoComplete="given-name"
            className="w-full rounded-lg border border-surface-2 bg-surface px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="plan-substance" className="block font-medium">
            What you&apos;re moving away from
          </label>
          <input
            id="plan-substance"
            type="text"
            value={current.substance}
            onChange={(e) => set({ substance: e.target.value })}
            maxLength={100}
            placeholder="e.g. alcohol"
            className="w-full rounded-lg border border-surface-2 bg-surface px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="plan-supporter" className="block font-medium">
            Trusted person&apos;s name
          </label>
          <input
            id="plan-supporter"
            type="text"
            value={current.supporter}
            onChange={(e) => set({ supporter: e.target.value })}
            maxLength={100}
            placeholder="e.g. my brother Arun"
            className="w-full rounded-lg border border-surface-2 bg-surface px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="plan-phone" className="block font-medium">
            Their phone number
          </label>
          <input
            id="plan-phone"
            type="tel"
            value={current.supporterPhone}
            onChange={(e) => {
              set({ supporterPhone: e.target.value });
              if (phoneError) setPhoneError(!isValidPhone(e.target.value));
            }}
            maxLength={17}
            autoComplete="tel"
            aria-invalid={phoneError}
            aria-describedby={phoneError ? "plan-phone-error" : undefined}
            placeholder="+91 98765 43210"
            className={`w-full rounded-lg border bg-surface px-3 py-2 ${
              phoneError ? "border-danger" : "border-surface-2"
            }`}
          />
          {phoneError && (
            <p id="plan-phone-error" role="alert" className="text-sm font-medium text-danger">
              That doesn&apos;t look like a phone number — use 7 to 15 digits, e.g. +91 98765 43210.
            </p>
          )}
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="font-medium">Coping tools that work for you</legend>
        <div className="flex flex-wrap gap-2">
          {PRESET_TOOLS.map((tool) => {
            const active = current.copingTools.includes(tool);
            return (
              <button
                key={tool}
                type="button"
                onClick={() => toggleTool(tool)}
                aria-pressed={active}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-surface-2 bg-surface hover:border-primary hover:text-primary"
                }`}
              >
                {tool}
              </button>
            );
          })}
          {customTools.map((tool) => (
            <button
              key={tool}
              type="button"
              onClick={() => toggleTool(tool)}
              aria-pressed={true}
              title="Tap to remove"
              className="rounded-full border border-primary bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              {tool} ✕
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <label htmlFor="plan-custom-tool" className="sr-only">
            Add your own coping tool
          </label>
          <input
            id="plan-custom-tool"
            type="text"
            value={customTool}
            onChange={(e) => setCustomTool(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTool();
              }
            }}
            maxLength={100}
            placeholder="Add your own…"
            className="w-full max-w-xs rounded-lg border border-surface-2 bg-surface px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addCustomTool}
            className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-soft"
          >
            Add
          </button>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="rounded-xl bg-primary px-6 py-3 font-bold text-white hover:bg-primary-strong"
        >
          Save my plan
        </button>
        <button
          type="button"
          onClick={handleClear}
          onBlur={() => setClearArmed(false)}
          className={`rounded-xl border px-6 py-3 font-semibold transition ${
            clearArmed
              ? "border-danger bg-danger text-white"
              : "border-surface-2 text-muted hover:border-danger hover:text-danger"
          }`}
        >
          {clearArmed ? "Tap again to confirm" : "Clear my data"}
        </button>
        <p aria-live="polite" className="text-sm font-medium text-primary">
          {savedMessage}
        </p>
      </div>
    </form>
  );
}
