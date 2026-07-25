/**
 * The six crisis situations a user can tap (zero typing) and the offline
 * grounding script shown instantly while — or instead of — a personalized
 * one arrives from Gemini.
 */

export const SITUATIONS = [
  { id: "craving", emoji: "🌊", label: "I'm having a craving", detail: "An intense urge to use is building right now." },
  { id: "overwhelmed", emoji: "🌀", label: "I'm overwhelmed", detail: "Panic, anxiety or racing thoughts are taking over." },
  { id: "risky-place", emoji: "📍", label: "I'm somewhere risky", detail: "I am near people or places connected to using." },
  { id: "lonely", emoji: "🫂", label: "I feel alone", detail: "Isolation and low mood are pulling me down." },
  { id: "slipped", emoji: "🌱", label: "I slipped", detail: "I used and I am scared or ashamed. I need next steps, not judgment." },
  { id: "cant-sleep", emoji: "🌙", label: "I can't sleep", detail: "It is late, I am restless and my thoughts are loud." },
] as const;

export type Situation = (typeof SITUATIONS)[number];

export const FALLBACK_SCRIPT = `1. You are safe in this moment. Put both feet flat on the floor.
2. Take one slow breath in through your nose for four counts.
3. Hold it gently for four counts, then let it out for six.
4. Name five things you can see around you, out loud or in your head.
5. This feeling is a wave — it rises, peaks, and always passes.
6. Stay with the breathing circle below until it settles.

You reached out. That is the strongest thing you could do right now.`;
