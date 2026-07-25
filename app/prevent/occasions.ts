/**
 * Common high-risk occasions a user can tap (zero typing) and the offline
 * prevention plan shown instantly while — or instead of — a personalized
 * one arrives from Gemini.
 */

export const OCCASIONS = [
  { id: "party", emoji: "🎉", label: "A party or celebration", detail: "Drinks or substances will probably be around." },
  { id: "wedding", emoji: "💍", label: "A wedding in the family", detail: "Long days, expectations, and toasts everywhere." },
  { id: "old-friends", emoji: "🕰️", label: "Meeting old using friends", detail: "People connected to the times I used." },
  { id: "payday", emoji: "💸", label: "Payday / money in hand", detail: "Extra cash has been a trigger before." },
  { id: "festival", emoji: "🪔", label: "A festival weekend", detail: "Celebrations, crowds, and old habits colliding." },
  { id: "travel", emoji: "🧳", label: "Travelling alone", detail: "Unstructured time away from my routines." },
] as const;

export const FALLBACK_PLAN = `Before:
1. Decide your no-thanks drink or snack order in advance and rehearse it once out loud.
2. Plan your own transport so you can leave the moment you want to.
3. Eat and sleep properly the day before — HALT states make everything harder.

On the day:
1. Arrive late, leave early, and keep your phone charged.
2. Keep a drink you chose in your hand so nobody offers you one.
3. Step outside for two minutes of slow breathing whenever the noise rises.

Tell one person you trust where you'll be and ask them to check in on you once during the event.`;
