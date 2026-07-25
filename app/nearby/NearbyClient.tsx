"use client";

/**
 * Zero-typing "find help around me" map. The user taps a category chip and
 * we render a Google Maps embed for that search. With a Maps Embed API key
 * (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) we use the official Embed API; without
 * one we fall back to the keyless maps embed so the feature always works.
 */
import { useMemo, useState } from "react";

const CATEGORIES = [
  { id: "deaddiction", label: "De-addiction centres", query: "de-addiction centre" },
  { id: "hospitals", label: "Hospitals", query: "hospital emergency" },
  { id: "pharmacies", label: "Pharmacies (open now)", query: "pharmacy open now" },
  { id: "counselling", label: "Counselling centres", query: "counselling centre mental health" },
  { id: "meetings", label: "AA / NA meetings", query: "alcoholics anonymous narcotics anonymous meeting" },
] as const;

type Category = (typeof CATEGORIES)[number];

type LocationState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "granted"; lat: number; lng: number }
  | { status: "denied" };

export default function NearbyClient() {
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [location, setLocation] = useState<LocationState>({ status: "idle" });

  // Geolocation is only requested from this explicit button press — asking
  // for permission on page load is hostile UX and, when the browser
  // auto-dismisses the prompt, fails silently with no way to retry.
  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocation({ status: "denied" });
      return;
    }
    setLocation({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({
          status: "granted",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => setLocation({ status: "denied" }),
      { timeout: 10_000 },
    );
  };

  const { embedSrc, externalHref } = useMemo(() => {
    const near =
      location.status === "granted"
        ? ` near ${location.lat.toFixed(4)},${location.lng.toFixed(4)}`
        : " near me";
    const query = `${category.query}${near}`;
    const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const embedSrc = mapsKey
      ? `https://www.google.com/maps/embed/v1/search?key=${mapsKey}&q=${encodeURIComponent(query)}`
      : `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    const externalHref = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    return { embedSrc, externalHref };
  }, [category, location]);

  return (
    <section aria-labelledby="nearby-map-heading" className="nearby-explorer">
      <div className="nearby-tool-heading">
        <div>
          <p className="eyebrow">Choose what you need</p>
          <h2 id="nearby-map-heading">Support around you</h2>
        </div>
        <p>The map updates with every tap.</p>
      </div>

      <div className="nearby-category-rail">
        <div role="group" aria-label="Choose a category" className="nearby-category-list">
          {CATEGORIES.map((c) => {
            const active = c.id === category.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={active}
                className={`nearby-category lift ${active ? "nearby-category-active" : ""}`}
              >
                <span aria-hidden="true" className="nearby-category-marker" />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="map-shell">
        <div className="map-toolbar">
          <div className="map-location-control">
            <button
              type="button"
              onClick={requestLocation}
              disabled={location.status === "locating"}
              className="map-location-button lift"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              </svg>
              {location.status === "locating" ? "Locating…" : "Use my location"}
            </button>
            <p aria-live="polite" className="map-location-status">
              {location.status === "granted" &&
                "Using your location for more precise results."}
              {location.status === "denied" &&
                "Location unavailable — showing general results; the search still works."}
              {(location.status === "idle" || location.status === "locating") &&
                "Optional: share your location for more precise results."}
            </p>
          </div>
          <a
            href={externalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="map-external-link lift"
          >
            Open in Google Maps ↗
          </a>
        </div>
        <div className="map-frame">
          <iframe
            key={embedSrc}
            src={embedSrc}
            title={`Map showing ${category.label.toLowerCase()} near you`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="map-embed"
          />
          <div className="map-selection-badge" aria-hidden="true">
            <span />
            {category.label}
          </div>
        </div>
      </div>
      <p className="map-fallback-note">
        If the map does not load, use the &ldquo;Open in Google Maps&rdquo; link above —
        it runs the same search in a new tab.
      </p>
    </section>
  );
}
