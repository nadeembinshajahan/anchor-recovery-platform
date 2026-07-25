import type { Metadata } from "next";
import PlanForm from "./PlanForm";

export const metadata: Metadata = {
  title: "My safety plan",
  description:
    "Store your coping tools and trusted contact on this device to personalize every intervention.",
};

export default function PlanPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="glass p-8">
        <p className="eyebrow">Personalization</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">My safety plan</h1>
        <p className="mt-3 text-muted">
          A few details make your SOS scripts and voice companion personal — your name,
          your go-to coping tools, the person you trust. Everything here is stored{" "}
          <strong className="font-semibold text-foreground">only on this device</strong>:
          it is never uploaded, and you can clear it anytime.
        </p>
      </header>
      <PlanForm />
    </div>
  );
}
