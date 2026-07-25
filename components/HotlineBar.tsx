import { HELPLINES } from "@/lib/config";

/**
 * Persistent crisis-help strip. Always visible, always one tap to a human —
 * the app never positions AI as a replacement for real help.
 */
export default function HotlineBar() {
  return (
    <aside
      aria-label="Crisis helplines"
      className="w-full bg-danger-soft text-foreground border-t border-danger/30 px-4 py-2"
    >
      <p className="text-sm text-center">
        <span className="font-semibold">In immediate danger? Call </span>
        <a href="tel:112" className="font-bold underline text-danger">
          112
        </a>
        <span className="mx-1" aria-hidden="true">
          ·
        </span>
        {HELPLINES.map((h, i) => (
          <span key={h.tel}>
            {i > 0 && (
              <span className="mx-1" aria-hidden="true">
                ·
              </span>
            )}
            <a href={`tel:${h.tel}`} className="underline whitespace-nowrap" title={h.name}>
              {h.display}
            </a>
          </span>
        ))}
      </p>
    </aside>
  );
}
