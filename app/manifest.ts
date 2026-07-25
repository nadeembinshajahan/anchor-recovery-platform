import type { MetadataRoute } from "next";

/**
 * PWA manifest so the app is installable and behaves like a native tool on a
 * home screen — one tap from lock screen to crisis support.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pulari — Recovery & Prevention",
    short_name: "Pulari",
    description:
      "GenAI-powered recovery and prevention companion for people navigating substance use disorders and their caregivers: zero-typing crisis support, voice companion, and contextual safety tools.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f0df",
    theme_color: "#9b481f",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
