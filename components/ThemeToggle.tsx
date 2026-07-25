"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const THEME_KEY = "pulari.theme";
const THEME_EVENT = "pulari:theme-changed";

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light");
  const dark = theme === "dark";

  const toggleTheme = () => {
    const next: Theme = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem(THEME_KEY, next);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
      aria-pressed={dark}
      className="theme-toggle lift"
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {dark ? "☀" : "☾"}
      </span>
      <span>{dark ? "Light" : "Dark"}</span>
    </button>
  );
}
