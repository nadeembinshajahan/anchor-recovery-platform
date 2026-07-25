import type { Metadata } from "next";
import Companion from "./Companion";

export const metadata: Metadata = {
  title: "Talk it out",
  description:
    "A hands-free AI voice companion for hard moments — talk in real time, or tap a phrase if voice isn't available.",
};

export default function CompanionPage() {
  return <Companion />;
}
