/**
 * Closed vocabulary of verified educational sources.
 *
 * Anti-hallucination guarantee: the model may only cite ids from this
 * hand-checked catalogue (enforced by prompt + resolved here). A citation id
 * that is not in the catalogue simply fails to resolve and is dropped, so an
 * invented reference can never reach the user. Helpline numbers are never
 * model-generated either — they live in lib/config.ts as static data.
 */
export interface VerifiedSource {
  id: string;
  /** Short human-readable label shown under AI answers. */
  label: string;
  org: string;
  url: string;
}

export const VERIFIED_SOURCES: readonly VerifiedSource[] = [
  {
    id: "S1",
    label: "Substance use disorders fact sheet",
    org: "World Health Organization",
    url: "https://www.who.int/news-room/fact-sheets/detail/opioid-overdose",
  },
  {
    id: "S2",
    label: "Drugs and the brain — how addiction works",
    org: "NIDA (US National Institute on Drug Abuse)",
    url: "https://nida.nih.gov/publications/drugs-brains-behavior-science-of-addiction",
  },
  {
    id: "S3",
    label: "Understanding cravings and relapse prevention",
    org: "NIDA",
    url: "https://nida.nih.gov/publications/principles-drug-addiction-treatment-research-based-guide-third-edition",
  },
  {
    id: "S4",
    label: "Centre for Addiction Medicine",
    org: "NIMHANS, Bengaluru",
    url: "https://nimhans.ac.in/cam/",
  },
  {
    id: "S5",
    label: "Vimukthi de-addiction mission",
    org: "Government of Kerala",
    url: "https://vimukthi.kerala.gov.in/",
  },
  {
    id: "S6",
    label: "Tele-MANAS national tele-mental-health programme",
    org: "Ministry of Health & Family Welfare, India",
    url: "https://telemanas.mohfw.gov.in/",
  },
  {
    id: "S7",
    label: "Nasha Mukt Bharat Abhiyaan (drug-free India campaign)",
    org: "Ministry of Social Justice & Empowerment, India",
    url: "https://nmba.dosje.gov.in/",
  },
  {
    id: "S8",
    label: "Supporting a family member with addiction",
    org: "SAMHSA (US Substance Abuse and Mental Health Services Administration)",
    url: "https://www.samhsa.gov/families",
  },
] as const;

const BY_ID = new Map(VERIFIED_SOURCES.map((s) => [s.id, s]));

/** Compact catalogue rendering for the system prompt. */
export function catalogueForPrompt(): string {
  return VERIFIED_SOURCES.map((s) => `[${s.id}] ${s.label} — ${s.org}`).join("\n");
}

const CITATION_RE = /\[(S\d+)\]/g;

/**
 * Extract citation ids from model text, resolving ONLY ids present in the
 * catalogue (unknown ids are dropped — see module doc). Returns the display
 * text with citation markers removed plus the resolved sources in first-use
 * order.
 */
export function extractCitations(text: string): {
  display: string;
  sources: VerifiedSource[];
} {
  const seen = new Set<string>();
  const sources: VerifiedSource[] = [];
  for (const match of text.matchAll(CITATION_RE)) {
    const source = BY_ID.get(match[1]);
    if (source && !seen.has(source.id)) {
      seen.add(source.id);
      sources.push(source);
    }
  }
  const display = text.replace(CITATION_RE, "").replace(/ {2,}/g, " ");
  return { display, sources };
}
