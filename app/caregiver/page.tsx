import type { Metadata } from "next";
import CaregiverClient from "./CaregiverClient";

export const metadata: Metadata = {
  title: "For caregivers",
  description:
    "Say-this-not-that scripts, boundaries, and practical steps for families and caregivers of people navigating substance use recovery.",
};

export default function CaregiverPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="glass p-8">
        <p className="eyebrow">Support crew</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">For caregivers</h1>
        <p className="mt-3 text-muted">
          You matter too. Loving someone through recovery is hard, skilled work — pick the
          situation you&apos;re facing and get a practical script for it. No typing needed.
        </p>
      </div>
      <CaregiverClient />
    </div>
  );
}
