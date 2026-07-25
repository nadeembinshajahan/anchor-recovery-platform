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
    <ul className="space-y-4">
      {LEARN_TOPICS.map((topic, i) => {
        const state = ai[topic.id] ?? { status: "idle" };
        return (
          <li
            key={topic.id}
            className="animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <details className="glass group overflow-hidden">
              <summary className="lift cursor-pointer list-none rounded-3xl px-6 py-5 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                <span
                  aria-hidden="true"
                  className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-primary transition-transform duration-300 group-open:rotate-90"
                >
                  ›
                </span>
                {topic.title}
              </summary>
              <div className="space-y-5 px-6 pb-6">
                <p className="leading-relaxed">{topic.summary}</p>
                <ul className="space-y-2 text-sm">
                  {topic.keyPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div aria-busy={state.status === "loading"} aria-live="polite">
                  {state.status === "idle" && (
                    <button
                      type="button"
                      onClick={() => explain(topic.id, topic.title, topic.summary)}
                      className="lift rounded-full bg-primary-soft px-5 py-2.5 text-sm font-semibold text-primary-strong hover:bg-primary hover:text-white"
                    >
                      ✨ Explain this simply
                    </button>
                  )}
                  {state.status === "loading" && (
                    <p className="text-sm text-muted">Writing a simpler explanation…</p>
                  )}
                  {state.status === "done" && (
                    <div className="rounded-2xl bg-surface-2 p-5 text-sm">
                      <p className="eyebrow mb-2">Explained simply</p>
                      <AiText text={state.text} />
                    </div>
                  )}
                  {state.status === "error" && (
                    <p className="text-sm text-muted">
                      The AI explainer is unavailable right now — the notes above have you
                      covered.
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
