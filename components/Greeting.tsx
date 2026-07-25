"use client";

/**
 * Personal greeting sourced from the on-device safety plan. Renders a
 * neutral greeting on the server snapshot, personalizes after hydration.
 */
import { useSafetyPlan } from "@/lib/profile";

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 5) return "You're up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Greeting() {
  const { plan, ready } = useSafetyPlan();
  const name = ready && plan.name ? `, ${plan.name}` : "";
  return (
    <p className="eyebrow" suppressHydrationWarning>
      {timeOfDay()}
      {name} — you showed up today.
    </p>
  );
}
