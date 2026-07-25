"use client";

/**
 * First screen of the prevention flow: hero, tappable occasion grid, and
 * the one optional free-text field (planning happens at calm times, so
 * typing is acceptable here — chips stay primary). Selection state lives
 * in PreventClient.
 */
import { useState } from "react";
import { OCCASIONS } from "./occasions";

interface OccasionPickerProps {
  loading: boolean;
  onChoose: (label: string, detail: string) => void;
  onCustom: (text: string) => void;
}

export default function OccasionPicker({
  loading,
  onChoose,
  onCustom,
}: OccasionPickerProps) {
  const [custom, setCustom] = useState("");

  const submitCustom = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = custom.trim();
    if (trimmed) onCustom(trimmed);
  };

  return (
    <div className="space-y-7">
      <section className="glass overflow-hidden px-6 py-9 text-center sm:px-10 sm:py-11">
        <p className="eyebrow">Prevention beats willpower</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Something risky coming up?
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          Make the plan now, while you&apos;re steady. Tap what&apos;s ahead and
          we&apos;ll prepare it together.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {OCCASIONS.map((o, i) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChoose(o.label, o.detail)}
            className="glass lift animate-fade-up group flex min-h-32 items-start gap-4 p-5 text-left sm:p-6"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-xl"
            >
              {o.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-semibold">{o.label}</span>
              <span className="mt-1.5 block text-sm leading-relaxed text-muted">
                {o.detail}
              </span>
            </span>
          </button>
        ))}
      </div>

      <form
        onSubmit={submitCustom}
        className="glass flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:p-6"
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="custom-occasion" className="mb-1.5 block text-sm font-semibold">
            Something else coming up?
          </label>
          <input
            id="custom-occasion"
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            maxLength={200}
            placeholder="e.g. My cousin's engagement next Friday"
            className="w-full rounded-xl border border-card-border bg-surface-2 px-4 py-3"
          />
        </div>
        <button
          type="submit"
          disabled={!custom.trim() || loading}
          className="lift shrink-0 rounded-full bg-primary px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          Build my plan
        </button>
      </form>
    </div>
  );
}
