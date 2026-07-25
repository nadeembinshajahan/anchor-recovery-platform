import type { Metadata } from "next";
import SosFlow from "./SosFlow";

export const metadata: Metadata = {
  title: "Get help now",
  description:
    "Zero-typing crisis support: tap your situation and get a personalized, step-by-step grounding script.",
};

export default function SosPage() {
  return <SosFlow />;
}
