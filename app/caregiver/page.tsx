import type { Metadata } from "next";
import CaregiverClient from "./CaregiverClient";

export const metadata: Metadata = {
  title: "For caregivers",
  description:
    "Say-this-not-that scripts, boundaries, and practical steps for families and caregivers of people navigating substance use recovery.",
};

export default function CaregiverPage() {
  return (
    <div className="route-page route-page-caregiver mx-auto max-w-4xl">
      <header className="route-intro route-intro-caregiver">
        <div className="route-intro-copy">
          <p className="eyebrow">Support crew</p>
          <h1>For caregivers</h1>
          <p className="route-intro-lede">
            You matter too. Loving someone through recovery is hard, skilled work — pick
            the situation you&apos;re facing and get a practical script for it. No typing
            needed.
          </p>
        </div>
        <div className="route-intro-art caregiver-intro-art" aria-hidden="true">
          <span className="caregiver-sun" />
          <span className="caregiver-figure caregiver-figure-one" />
          <span className="caregiver-figure caregiver-figure-two" />
          <span className="caregiver-connection" />
        </div>
      </header>
      <CaregiverClient />
    </div>
  );
}
