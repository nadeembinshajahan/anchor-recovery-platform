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
    <section aria-label="Map of nearby support services" className="space-y-4">
      <div role="group" aria-label="Choose a category" className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const active = c.id === category.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={active}
              className={`lift rounded-full px-4.5 py-2.5 text-sm font-semibold ${
                active
                  ? "bg-primary-soft text-primary-strong shadow-sm ring-1 ring-primary/30"
                  : "glass text-muted hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="glass overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-card-border px-5 py-3.5">
          <button
            type="button"
            onClick={requestLocation}
            disabled={location.status === "locating"}
            className="lift inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
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
          <p aria-live="polite" className="min-w-0 flex-1 text-sm text-muted">
            {location.status === "granted" &&
              "Using your location for more precise results."}
            {location.status === "denied" &&
              "Location unavailable — showing general results; the search still works."}
            {(location.status === "idle" || location.status === "locating") &&
              "Optional: share your location for more precise results."}
          </p>
          <a
            href={externalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm font-semibold text-primary hover:underline"
          >
            Open in Google Maps ↗
          </a>
        </div>
        <iframe
          key={embedSrc}
          src={embedSrc}
          title={`Map showing ${category.label.toLowerCase()} near you`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="h-[440px] w-full border-0"
        />
      </div>
      <p className="px-2 text-sm text-muted">
        If the map does not load, use the &ldquo;Open in Google Maps&rdquo; link above —
        it runs the same search in a new tab.
      </p>
    </section>
  );
}
