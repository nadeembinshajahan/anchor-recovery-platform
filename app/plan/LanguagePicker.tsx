"use client";

/**
 * Section 03 of the safety plan: the response-language radiogroup.
 * Native-script chip labels carry their own lang attribute so screen
 * readers pronounce each option correctly.
 */
import { PLAN_LANGUAGES, type PlanLanguage } from "@/lib/profile";

interface LanguagePickerProps {
  language: PlanLanguage;
  onSelect: (language: PlanLanguage) => void;
}

export default function LanguagePicker({ language, onSelect }: LanguagePickerProps) {
  return (
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
      <div role="radiogroup" aria-label="Language for AI replies" className="plan-tools">
        {PLAN_LANGUAGES.map((option) => {
          const active = language === option.code;
          return (
            <button
              key={option.code}
              type="button"
              role="radio"
              aria-checked={active}
              lang={option.code}
              onClick={() => onSelect(option.code)}
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
  );
}
