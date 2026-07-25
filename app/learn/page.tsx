import type { Metadata } from "next";
import LearnClient from "./LearnClient";

export const metadata: Metadata = {
  title: "Understand recovery",
  description:
    "Plain-language education on cravings, triggers, withdrawal, relapse, and supporting recovery — with AI explanations on demand.",
};

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="glass p-8">
        <p className="eyebrow">Education</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Understand recovery</h1>
        <p className="mt-3 text-muted">
          Short, honest explanations of what recovery actually involves. Open a topic, and
          if anything feels unclear, tap <strong>Explain this simply</strong> for a fresh
          plain-language take.
        </p>
      </div>
      <LearnClient />
    </div>
  );
}
