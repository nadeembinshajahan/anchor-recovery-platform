import type { Metadata } from "next";
import PreventClient from "./PreventClient";

export const metadata: Metadata = {
  title: "Plan ahead",
  description:
    "Prevention planning: name an upcoming high-risk situation and get a personal before-and-day-of plan, an exit line, and an ally ask.",
};

export default function PreventPage() {
  return <PreventClient />;
}
