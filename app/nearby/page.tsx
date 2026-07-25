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
    <div className="space-y-6">
      <header className="glass p-8">
        <p className="eyebrow">Contextual safety</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Find help nearby</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Tap a category to see real places around you — no typing needed. Sharing your
          location is optional and makes results more precise.
        </p>
      </header>

      <NearbyClient />

      <section aria-labelledby="helplines-heading" className="space-y-4">
        <div className="px-2">
          <p className="eyebrow">Talk to a person now</p>
          <h2 id="helplines-heading" className="mt-1 text-2xl font-semibold tracking-tight">
            24×7 helplines
          </h2>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {HELPLINES.map((h) => (
            <li key={h.tel}>
              <a href={`tel:${h.tel}`} className="glass lift group block h-full p-6">
                <span className="block text-sm leading-snug text-muted">{h.name}</span>
                <span className="mt-3 block text-2xl font-bold tracking-tight text-primary">
                  {h.display}
                </span>
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Tap to call
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
