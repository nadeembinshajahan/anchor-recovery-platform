"use client";

/**
 * The personal safety plan lives ONLY in the browser (localStorage).
 * Nothing here is ever persisted server-side — a deliberate privacy choice
 * for a sensitive health context. Relevant fields are attached to individual
 * AI requests to personalize responses, and the user can clear the plan at
 * any time.
 */
import { useSyncExternalStore } from "react";

/**
 * Languages Pulari can reply in. Codes are BCP-47 primary subtags; labels
 * are shown in their own script so a reader can recognize their language
 * even when the rest of the UI is not in it.
 */
export const PLAN_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ml", label: "മലയാളം" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
] as const;

export type PlanLanguage = (typeof PLAN_LANGUAGES)[number]["code"];

export interface SafetyPlan {
  name: string;
  substance: string;
  supporter: string;
  supporterPhone: string;
  copingTools: string[];
  /** Preferred language for AI replies. "en" is the default. */
  language: PlanLanguage;
  updatedAt: string;
}

/** Frozen so the shared sentinel can never be mutated by a call site.
 *  Plans stored before `language` existed inherit "en" via the spread in
 *  loadPlan, so no migration is needed. */
export const EMPTY_PLAN: SafetyPlan = Object.freeze({
  name: "",
  substance: "",
  supporter: "",
  supporterPhone: "",
  copingTools: [],
  language: "en",
  updatedAt: "",
});

const KEY = "pulari.safetyPlan.v1";
/** Pre-rename key — read once so plans saved before the Pulari rename survive. */
const LEGACY_KEY = "anchor.safetyPlan.v1";
/** Local event so same-tab writes notify subscribers (the native `storage`
 *  event only fires in OTHER tabs). */
const CHANGE_EVENT = "pulari:plan-changed";

// Snapshot cache: useSyncExternalStore requires getSnapshot to return a
// referentially stable value until the store actually changes.
let cachedRaw: string | null = null;
let cachedPlan: SafetyPlan = EMPTY_PLAN;

export function loadPlan(): SafetyPlan {
  if (typeof window === "undefined") return EMPTY_PLAN;
  const raw =
    window.localStorage.getItem(KEY) ?? window.localStorage.getItem(LEGACY_KEY);
  if (raw === cachedRaw) return cachedPlan;
  cachedRaw = raw;
  try {
    cachedPlan = raw ? { ...EMPTY_PLAN, ...(JSON.parse(raw) as Partial<SafetyPlan>) } : EMPTY_PLAN;
  } catch {
    cachedPlan = EMPTY_PLAN;
  }
  return cachedPlan;
}

function notifyChanged(): void {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function savePlan(plan: SafetyPlan): void {
  window.localStorage.setItem(
    KEY,
    JSON.stringify({ ...plan, updatedAt: new Date().toISOString() }),
  );
  notifyChanged();
}

export function clearPlan(): void {
  window.localStorage.removeItem(KEY);
  notifyChanged();
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange); // cross-tab sync for free
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * React hook exposing the stored plan. Backed by useSyncExternalStore so
 * server render/hydration sees EMPTY_PLAN (`ready` false) and the client
 * syncs to localStorage immediately after — no setState-in-effect needed.
 */
export function useSafetyPlan(): {
  plan: SafetyPlan;
  update: (plan: SafetyPlan) => void;
  clear: () => void;
  ready: boolean;
} {
  const plan = useSyncExternalStore(subscribe, loadPlan, () => EMPTY_PLAN);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return { plan, ready, update: savePlan, clear: clearPlan };
}

/** Shape sent to the API — omits the phone number, which the model never
 *  needs, and omits `language` when it is the "en" default. */
export function planToProfile(plan: SafetyPlan) {
  return {
    name: plan.name || undefined,
    substance: plan.substance || undefined,
    supporter: plan.supporter || undefined,
    copingTools: plan.copingTools.length ? plan.copingTools : undefined,
    language: plan.language && plan.language !== "en" ? plan.language : undefined,
  };
}
