import { HELPLINES } from "@/lib/config";

/**
 * Persistent crisis-help strip. Always visible, always one tap to a human —
 * the app never positions AI as a replacement for real help.
 */
export default function HotlineBar() {
  return (
    <aside
      aria-label="Crisis helplines"
      className="hotline-dock"
    >
      <div className="hotline-inner">
        <span className="human-help">
          <span className="human-help-dot" aria-hidden="true" />
          Human help is always here
        </span>
        <span className="hotline-divider" aria-hidden="true" />
        <span className="emergency-copy">
          In immediate danger?{" "}
          <a href="tel:112">
            Call 112
          </a>
        </span>
        <div className="hotline-links" aria-label="Additional helplines">
          {HELPLINES.map((h) => (
            <a
              key={h.tel}
              href={`tel:${h.tel}`}
              className="hotline-link"
              title={h.name}
              aria-label={`${h.name}: ${h.display}`}
            >
              {h.display}
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
