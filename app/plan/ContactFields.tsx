"use client";

/**
 * Section 01 of the safety plan: personal context and the trusted
 * contact. The phone number is validated by the parent on save; this
 * component only reports input changes.
 */
import type { SafetyPlan } from "@/lib/profile";
import { FIELD_CLASSES } from "./planFields";

interface ContactFieldsProps {
  current: SafetyPlan;
  phoneError: boolean;
  set: (patch: Partial<SafetyPlan>) => void;
  onPhoneInput: (value: string) => void;
}

export default function ContactFields({
  current,
  phoneError,
  set,
  onPhoneInput,
}: ContactFieldsProps) {
  return (
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
            onChange={(e) => onPhoneInput(e.target.value)}
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
  );
}
