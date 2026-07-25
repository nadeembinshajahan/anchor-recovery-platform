import type { Metadata } from "next";
import LearnClient from "./LearnClient";

export const metadata: Metadata = {
  title: "Understand recovery",
  description:
    "Plain-language education on cravings, triggers, withdrawal, relapse, and supporting recovery — with AI explanations on demand.",
};

export default function LearnPage() {
  return (
    <div className="route-page route-page-learn mx-auto max-w-4xl">
      <header className="route-intro route-intro-learn">
        <div className="route-intro-copy">
          <p className="eyebrow">Education</p>
          <h1>Understand recovery</h1>
          <p className="route-intro-lede">
            Short, honest explanations of what recovery actually involves. Open a topic,
            and if anything feels unclear, tap <strong>Explain this simply</strong> for a
            fresh plain-language take.
          </p>
        </div>
        <div className="route-intro-art learn-intro-art" aria-hidden="true">
          <span className="learn-sun" />
          <span className="learn-page-sheet learn-page-sheet-back" />
          <span className="learn-page-sheet learn-page-sheet-front">
            <i />
            <i />
            <i />
          </span>
        </div>
      </header>
      <LearnClient />
    </div>
  );
}
