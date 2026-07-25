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
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-surface-2 bg-surface hover:border-primary hover:text-primary"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={requestLocation}
          disabled={location.status === "locating"}
          className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-soft disabled:opacity-60"
        >
          {location.status === "locating" ? "Locating…" : "Use my location"}
        </button>
        <p aria-live="polite" className="text-sm text-muted">
          {location.status === "granted" &&
            "Using your location for more precise results."}
          {location.status === "denied" &&
            "Location unavailable — showing general results; the search still works."}
          {(location.status === "idle" || location.status === "locating") &&
            "Optional: share your location for more precise results."}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-2 bg-surface">
        <iframe
          key={embedSrc}
          src={embedSrc}
          title={`Map showing ${category.label.toLowerCase()} near you`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="h-[420px] w-full border-0"
        />
      </div>
      <p className="text-sm">
        <a
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline"
        >
          Open in Google Maps
        </a>{" "}
        <span className="text-muted">
          (opens in a new tab — use this if the map above does not load)
        </span>
      </p>
    </section>
  );
}
