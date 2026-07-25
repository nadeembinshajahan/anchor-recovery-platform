/**
 * Renders model output as safe plain text with light structure (paragraphs,
 * numbered/bulleted lines). Deliberately NOT an HTML/markdown renderer —
 * model output is never injected as HTML, which removes a whole class of
 * XSS risk.
 */
export default function AiText({ text }: { text: string }) {
  const blocks = text
    .replace(/\*\*/g, "")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const isList = lines.length > 1 && lines.every((l) => /^([-*•]|\d+[.)])\s/.test(l));
        if (isList) {
          return (
            <ol key={i} className="list-none space-y-2">
              {lines.map((line, j) => (
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
        return <p key={i}>{lines.join(" ")}</p>;
      })}
    </div>
  );
}
