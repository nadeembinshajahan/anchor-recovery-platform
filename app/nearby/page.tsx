import type { Metadata } from "next";
import { HELPLINES } from "@/lib/config";
import NearbyClient from "./NearbyClient";

export const metadata: Metadata = {
  title: "Find help nearby",
  description:
    "Locate de-addiction centres, hospitals, pharmacies and counselling services around you, plus 24x7 helplines.",
};

export default function NearbyPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Find help nearby</h1>
        <p className="max-w-2xl text-muted">
          Tap a category to see real places around you — no typing needed. Sharing your
          location is optional and makes results more precise.
        </p>
      </div>

      <NearbyClient />

      <section aria-labelledby="helplines-heading" className="space-y-4">
        <h2 id="helplines-heading" className="text-2xl font-semibold">
          24x7 helplines — talk to a person now
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {HELPLINES.map((h) => (
            <li key={h.tel}>
              <a
                href={`tel:${h.tel}`}
                className="block h-full rounded-2xl border border-primary/30 bg-surface p-5 transition hover:border-primary hover:shadow-md"
              >
                <span className="block text-sm text-muted">{h.name}</span>
                <span className="mt-2 block text-xl font-bold text-primary">
                  {h.display}
                </span>
                <span className="mt-1 block text-sm font-medium text-muted">
                  Tap to call
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
