import type { Metadata } from "next";
import PlanForm from "./PlanForm";

export const metadata: Metadata = {
  title: "My safety plan",
  description:
    "Store your coping tools and trusted contact on this device to personalize every intervention.",
};

export default function PlanPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My safety plan</h1>
        <p className="text-muted">
          A few details make your SOS scripts and voice companion personal — your name,
          your go-to coping tools, the person you trust. Everything here is stored{" "}
          <strong className="text-foreground">only on this device</strong>: it is never
          uploaded, and you can clear it anytime.
        </p>
      </div>
      <PlanForm />
    </div>
  );
}
