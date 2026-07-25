import { HELPLINES } from "@/lib/config";

/**
 * Persistent crisis-help strip. Always visible, always one tap to a human —
 * the app never positions AI as a replacement for real help.
 */
export default function HotlineBar() {
  return (
    <aside
      aria-label="Crisis helplines"
      className="glass w-full rounded-none border-x-0 border-b-0 border-t border-danger/20 px-4 py-2.5"
      style={{ background: "var(--danger-soft)" }}
    >
      <p className="text-center text-sm">
        <span className="font-semibold">In immediate danger? Call </span>
        <a href="tel:112" className="font-bold text-danger underline underline-offset-2">
          112
        </a>
        <span className="mx-1.5 text-muted" aria-hidden="true">
          ·
        </span>
        {HELPLINES.map((h, i) => (
          <span key={h.tel}>
            {i > 0 && (
              <span className="mx-1.5 text-muted" aria-hidden="true">
                ·
              </span>
            )}
            <a
              href={`tel:${h.tel}`}
              className="whitespace-nowrap font-medium underline underline-offset-2 hover:text-danger"
              title={h.name}
            >
              {h.display}
            </a>
          </span>
        ))}
      </p>
    </aside>
  );
}
