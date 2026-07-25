"use client";

/**
 * Renders model output as safe plain text with light structure (paragraphs,
 * numbered/bulleted lines). Deliberately NOT an HTML/markdown renderer —
 * model output is never injected as HTML, which removes a whole class of
 * XSS risk.
 *
 * Memoized on both levels: parsing runs only when `text` changes (useMemo),
 * and the component skips re-rendering entirely when its props are unchanged
 * (React.memo) — it often sits inside pages with unrelated state churn
 * (loading flags, voice status).
 */
import { memo, useMemo } from "react";
import { extractCitations } from "@/lib/sources";

interface Block {
  kind: "list" | "paragraph";
  lines: string[];
}

/** Pure text → structure step, exported for direct unit testing. */
export function parseBlocks(text: string): Block[] {
  return text
    .replace(/\*\*/g, "")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const isList =
        lines.length > 1 && lines.every((l) => /^([-*•]|\d+[.)])\s/.test(l));
      return { kind: isList ? "list" : "paragraph", lines } as Block;
    });
}

function AiText({ text }: { text: string }) {
  // Citations first (strips [S#] markers, resolves only catalogue ids —
  // an invented source can never render), then structural parsing.
  const { blocks, sources } = useMemo(() => {
    const { display, sources } = extractCitations(text);
    return { blocks: parseBlocks(display), sources };
  }, [text]);

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.kind === "list") {
          return (
            <ol key={i} className="list-none space-y-2">
              {block.lines.map((line, j) => (
                <li key={j} className="flex gap-2">
                  <span aria-hidden="true" className="font-semibold text-primary">
                    {line.match(/^\d+/) ? `${line.match(/^\d+/)![0]}.` : "•"}
                  </span>
                  <span>{line.replace(/^([-*•]|\d+[.)])\s*/, "")}</span>
                </li>
              ))}
            </ol>
          );
        }
        return <p key={i}>{block.lines.join(" ")}</p>;
      })}
      {sources.length > 0 && (
        <footer className="ai-sources border-t border-card-border pt-3">
          <p className="eyebrow mb-1.5">Sources</p>
          <ul className="space-y-1 text-xs text-muted">
            {sources.map((s) => (
              <li key={s.id}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  {s.label} — {s.org}
                </a>
              </li>
            ))}
          </ul>
        </footer>
      )}
    </div>
  );
}

export default memo(AiText);
