"use client";

/**
 * Accordion of curated recovery topics. The static content always renders;
 * "Explain this simply" adds an AI re-explanation underneath and fails soft
 * (friendly message, curated content untouched). Zero typing anywhere.
 */
import { useState } from "react";
import AiText from "@/components/AiText";
import { LEARN_TOPICS } from "@/lib/content";

type AiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; text: string }
  | { status: "error" };

export default function LearnClient() {
  const [ai, setAi] = useState<Record<string, AiState>>({});

  async function explain(topicId: string, title: string, summary: string) {
    setAi((s) => ({ ...s, [topicId]: { status: "loading" } }));
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "explain-topic",
          context: `${title}. ${summary}`,
        }),
      });
      const data = res.ok ? ((await res.json()) as { text?: string }) : null;
      if (data?.text) {
        setAi((s) => ({ ...s, [topicId]: { status: "done", text: data.text! } }));
      } else {
        setAi((s) => ({ ...s, [topicId]: { status: "error" } }));
      }
    } catch {
      setAi((s) => ({ ...s, [topicId]: { status: "error" } }));
    }
  }

  return (
    <ul className="space-y-3">
      {LEARN_TOPICS.map((topic) => {
        const state = ai[topic.id] ?? { status: "idle" };
        return (
          <li key={topic.id}>
            <details className="group rounded-2xl border border-surface-2 bg-surface">
              <summary className="cursor-pointer list-none rounded-2xl px-5 py-4 text-lg font-semibold transition hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
                <span aria-hidden="true" className="mr-2 inline-block text-primary transition group-open:rotate-90">
                  ›
                </span>
                {topic.title}
              </summary>
              <div className="space-y-4 px-5 pb-5">
                <p>{topic.summary}</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {topic.keyPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>

                <div aria-busy={state.status === "loading"} aria-live="polite">
                  {state.status === "idle" && (
                    <button
                      type="button"
                      onClick={() => explain(topic.id, topic.title, topic.summary)}
                      className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary-soft"
                    >
                      Explain this simply
                    </button>
                  )}
                  {state.status === "loading" && (
                    <p className="text-sm text-muted">Writing a simpler explanation…</p>
                  )}
                  {state.status === "done" && (
                    <div className="rounded-xl bg-surface-2 p-4 text-sm">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                        Explained simply
                      </p>
                      <AiText text={state.text} />
                    </div>
                  )}
                  {state.status === "error" && (
                    <p className="text-sm text-muted">
                      The AI explainer is unavailable right now — the notes above have you covered.
                    </p>
                  )}
                </div>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
