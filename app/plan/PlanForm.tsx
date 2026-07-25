"use client";

/**
 * Editor for the on-device safety plan. Coping tools are preset toggle
 * chips (zero typing for the common case) with an optional free-text add.
 * Clearing data uses a two-tap confirm instead of window.confirm, which
 * would block the page.
 */
import { useState } from "react";
import {
  PLAN_LANGUAGES,
  useSafetyPlan,
  type SafetyPlan,
} from "@/lib/profile";

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

const FIELD_CLASSES =
  "plan-input w-full text-foreground placeholder:text-muted/70 transition";

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
    <form
      onSubmit={handleSave}
      noValidate
      aria-busy={!ready}
      className="plan-form"
    >
      {!ready && (
        <p role="status" className="plan-ready-status">
          <span aria-hidden="true" className="plan-ready-dot" />
          Loading saved details from this device…
        </p>
      )}
      <section aria-labelledby="plan-details-heading" className="plan-section plan-details-section">
        <div className="plan-section-heading">
          <span aria-hidden="true" className="plan-step">
            01
          </span>
          <div>
            <p className="eyebrow">A little context</p>
            <h2 id="plan-details-heading">Make support feel like yours</h2>
          </div>
        </div>

        <div className="plan-field-grid">
          <div className="plan-field">
            <label htmlFor="plan-name">Your name</label>
            <input
              id="plan-name"
              type="text"
              value={current.name}
              onChange={(e) => set({ name: e.target.value })}
              maxLength={100}
              autoComplete="given-name"
              className={FIELD_CLASSES}
            />
          </div>
          <div className="plan-field">
            <label htmlFor="plan-substance">What you&apos;re moving away from</label>
            <input
              id="plan-substance"
              type="text"
              value={current.substance}
              onChange={(e) => set({ substance: e.target.value })}
              maxLength={100}
              placeholder="e.g. alcohol"
              className={FIELD_CLASSES}
            />
          </div>
          <div className="plan-field">
            <label htmlFor="plan-supporter">Trusted person&apos;s name</label>
            <input
              id="plan-supporter"
              type="text"
              value={current.supporter}
              onChange={(e) => set({ supporter: e.target.value })}
              maxLength={100}
              placeholder="e.g. my brother Arun"
              className={FIELD_CLASSES}
            />
          </div>
          <div className="plan-field">
            <label htmlFor="plan-phone">Their phone number</label>
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
              aria-describedby={
                phoneError
                  ? "plan-phone-privacy plan-phone-error"
                  : "plan-phone-privacy"
              }
              placeholder="+91 98765 43210"
              className={`${FIELD_CLASSES} ${phoneError ? "plan-input-error" : ""}`}
            />
            <p id="plan-phone-privacy" className="plan-field-note text-sm text-muted">
              This number stays on this device and is never sent to Gemini.
            </p>
            {phoneError && (
              <p id="plan-phone-error" role="alert" className="plan-field-error">
                That doesn&apos;t look like a phone number — use 7 to 15 digits, e.g. +91
                98765 43210.
              </p>
            )}
          </div>
        </div>
      </section>

      <fieldset className="plan-section plan-tools-section">
        <legend className="plan-section-heading">
          <span aria-hidden="true" className="plan-step">
            02
          </span>
          <span className="plan-legend-copy">
            <span className="eyebrow">Your go-to actions</span>
            <strong>Coping tools that work for you</strong>
          </span>
        </legend>
        <div className="plan-tools">
          {PRESET_TOOLS.map((tool) => {
            const active = current.copingTools.includes(tool);
            return (
              <button
                key={tool}
                type="button"
                onClick={() => toggleTool(tool)}
                aria-pressed={active}
                className={`plan-tool lift ${active ? "plan-tool-active" : ""}`}
              >
                <span aria-hidden="true" className="plan-tool-check">
                  ✓
                </span>
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
              aria-label={`Remove coping tool: ${tool}`}
              title="Tap to remove"
              className="plan-tool plan-tool-active plan-tool-custom lift"
            >
              <span aria-hidden="true" className="plan-tool-check">
                ✓
              </span>
              {tool}
              <span aria-hidden="true" className="plan-tool-remove">
                ×
              </span>
            </button>
          ))}
        </div>
        <div className="plan-custom-tool">
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
            className={`${FIELD_CLASSES} plan-custom-input`}
          />
          <button
            type="button"
            onClick={addCustomTool}
            className="plan-add-tool lift"
          >
            <span aria-hidden="true">+</span>
            Add
          </button>
        </div>
      </fieldset>

      <fieldset className="plan-section plan-language-section">
        <legend className="plan-section-heading">
          <span aria-hidden="true" className="plan-step">
            03
          </span>
          <span className="plan-legend-copy">
            <span className="eyebrow">Response language</span>
            <strong>Pulari replies in</strong>
          </span>
        </legend>
        <div
          role="radiogroup"
          aria-label="Language for AI replies"
          className="plan-tools"
        >
          {PLAN_LANGUAGES.map((option) => {
            const active = current.language === option.code;
            return (
              <button
                key={option.code}
                type="button"
                role="radio"
                aria-checked={active}
                lang={option.code}
                onClick={() => set({ language: option.code })}
                className={`plan-tool lift ${active ? "plan-tool-active" : ""}`}
              >
                <span aria-hidden="true" className="plan-tool-check">
                  ✓
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="plan-field-note text-sm text-muted">
          Crisis scripts, plans, and explanations arrive in this language. The
          voice companion also understands you if you simply speak it.
        </p>
      </fieldset>

      <div className="plan-actions">
        <div className="plan-actions-buttons">
          <button type="submit" className="sun-button sun-button-primary plan-save lift">
            Save my plan
            <span aria-hidden="true">→</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            onBlur={() => setClearArmed(false)}
            className={`plan-clear lift ${clearArmed ? "plan-clear-armed" : ""}`}
          >
            {clearArmed ? "Tap again to confirm" : "Clear my data"}
          </button>
        </div>
        <p
          aria-live="polite"
          className={`plan-save-status ${savedMessage ? "plan-save-status-visible" : ""}`}
        >
          {savedMessage && <span aria-hidden="true">✓</span>}
          {savedMessage}
        </p>
      </div>
    </form>
  );
}
