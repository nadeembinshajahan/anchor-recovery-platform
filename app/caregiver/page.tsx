import type { Metadata } from "next";
import CaregiverClient from "./CaregiverClient";

export const metadata: Metadata = {
  title: "For caregivers",
  description:
    "Say-this-not-that scripts, boundaries, and practical steps for families and caregivers of people navigating substance use recovery.",
};

export default function CaregiverPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">For caregivers</h1>
        <p className="text-muted">
          You matter too. Loving someone through recovery is hard, skilled work — pick the
          situation you&apos;re facing and get a practical script for it. No typing needed.
        </p>
      </div>
      <CaregiverClient />
    </div>
  );
}
