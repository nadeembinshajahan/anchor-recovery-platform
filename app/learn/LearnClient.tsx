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
    <section aria-labelledby="learn-topics-heading" className="topic-library">
      <div className="section-heading topic-library-heading">
        <div>
          <p className="eyebrow">Take one topic at a time</p>
          <h2 id="learn-topics-heading">What would you like to understand?</h2>
        </div>
        <p>Every note is short, practical, and available without AI.</p>
      </div>
      <ul className="topic-list">
        {LEARN_TOPICS.map((topic, i) => {
          const state = ai[topic.id] ?? { status: "idle" };
          return (
            <li
              key={topic.id}
              className="topic-list-item animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <details className="topic-accordion group">
                <summary className="topic-summary lift cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span aria-hidden="true" className="topic-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="topic-title">{topic.title}</span>
                  <span aria-hidden="true" className="topic-toggle">
                    <i />
                    <i />
                  </span>
                </summary>
                <div className="topic-body">
                  <p className="topic-summary-copy">{topic.summary}</p>
                  <ul className="topic-keypoints">
                    {topic.keyPoints.map((point) => (
                      <li key={point}>
                        <span aria-hidden="true" className="topic-keypoint-mark">
                          ✓
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <div
                    aria-busy={state.status === "loading"}
                    aria-live="polite"
                    className="topic-ai"
                  >
                    {state.status === "idle" && (
                      <button
                        type="button"
                        onClick={() => explain(topic.id, topic.title, topic.summary)}
                        className="sun-button sun-button-glass topic-explain lift"
                      >
                        <span aria-hidden="true" className="topic-spark">
                          ✦
                        </span>
                        Explain this simply
                      </button>
                    )}
                    {state.status === "loading" && (
                      <p className="topic-ai-status text-sm text-muted">
                        <span aria-hidden="true" className="topic-thinking-dot" />
                        Writing a simpler explanation…
                      </p>
                    )}
                    {state.status === "done" && (
                      <div className="topic-ai-answer">
                        <p className="eyebrow mb-2">Generated live with Gemini</p>
                        <AiText text={state.text} />
                      </div>
                    )}
                    {state.status === "error" && (
                      <p className="topic-ai-status text-sm text-muted">
                        The AI explainer is unavailable right now — the notes above have
                        you covered.
                      </p>
                    )}
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
