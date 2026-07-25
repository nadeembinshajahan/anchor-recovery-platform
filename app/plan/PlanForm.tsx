"use client";

/**
 * Editor for the on-device safety plan. Field groups live in sibling
 * components (ContactFields, CopingToolPicker, LanguagePicker); this
 * component owns form state, validation, and persistence. Clearing data
 * uses a two-tap confirm instead of window.confirm, which would block
 * the page.
 */
import { useState } from "react";
import { useSafetyPlan, type SafetyPlan } from "@/lib/profile";
import ContactFields from "./ContactFields";
import CopingToolPicker from "./CopingToolPicker";
import LanguagePicker from "./LanguagePicker";
import { isValidPhone } from "./planFields";

export default function PlanForm() {
  const { plan, update, clear, ready } = useSafetyPlan();
  const [draft, setDraft] = useState<SafetyPlan | null>(null);
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

  const handlePhoneInput = (value: string) => {
    set({ supporterPhone: value });
    if (phoneError) setPhoneError(!isValidPhone(value));
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

  return (
    <form onSubmit={handleSave} noValidate aria-busy={!ready} className="plan-form">
      {!ready && (
        <p role="status" className="plan-ready-status">
          <span aria-hidden="true" className="plan-ready-dot" />
          Loading saved details from this device…
        </p>
      )}

      <ContactFields
        current={current}
        phoneError={phoneError}
        set={set}
        onPhoneInput={handlePhoneInput}
      />

      <CopingToolPicker
        copingTools={current.copingTools}
        onToggle={toggleTool}
        onAdd={(tool) => set({ copingTools: [...current.copingTools, tool] })}
      />

      <LanguagePicker
        language={current.language}
        onSelect={(language) => set({ language })}
      />

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
