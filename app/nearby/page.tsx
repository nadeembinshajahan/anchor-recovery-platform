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
    <div className="route-page route-page-nearby">
      <header className="route-intro route-intro-nearby">
        <div className="route-intro-copy">
          <p className="eyebrow">Contextual safety</p>
          <h1>Find help nearby</h1>
          <p className="route-intro-lede">
            Tap a category to see real places around you — no typing needed. Sharing your
            location is optional and makes results more precise.
          </p>
        </div>
        <div className="route-intro-art nearby-intro-art" aria-hidden="true">
          <span className="nearby-map-orbit nearby-map-orbit-one" />
          <span className="nearby-map-orbit nearby-map-orbit-two" />
          <span className="nearby-map-pin">
            <i />
          </span>
        </div>
      </header>

      <NearbyClient />

      <section aria-labelledby="helplines-heading" className="helpline-section">
        <div className="section-heading helpline-heading">
          <div>
            <p className="eyebrow">Talk to a person now</p>
            <h2 id="helplines-heading">24×7 helplines</h2>
          </div>
          <p>Free, direct support when a conversation would help.</p>
        </div>
        <ul className="helpline-grid">
          {HELPLINES.map((h, index) => (
            <li key={h.tel}>
              <a href={`tel:${h.tel}`} className="helpline-card lift group">
                <span className="helpline-card-top">
                  <span aria-hidden="true" className="helpline-card-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7.8 3.8 5.6 5.3c-1 .7-1.3 2-.8 3.1 2.1 4.8 6 8.7 10.8 10.8 1.1.5 2.4.2 3.1-.8l1.5-2.2-4.4-2-1.3 1.3c-2.5-1.2-4.8-3.5-6-6l1.3-1.3-2-4.4Z" />
                    </svg>
                  </span>
                  <span aria-hidden="true" className="helpline-card-index">
                    0{index + 1}
                  </span>
                </span>
                <span className="helpline-name">{h.name}</span>
                <strong className="helpline-number">{h.display}</strong>
                <span className="helpline-cta">
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
