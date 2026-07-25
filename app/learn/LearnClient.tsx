"use client";

/**
 * Accordion of curated recovery topics. The static content always renders;
 * "Explain this simply" adds an AI re-explanation underneath and fails soft
 * (friendly message, curated content untouched). Zero typing anywhere.
 *
 * Each topic is its own component with its own useGenerate instance so two
 * topics can be explained concurrently without aborting each other.
 */
import AiText from "@/components/AiText";
import { LEARN_TOPICS, type LearnTopic } from "@/lib/content";
import { planToProfile, useSafetyPlan } from "@/lib/profile";
import { useGenerate } from "@/lib/useGenerate";

function TopicItem({ topic, index }: { topic: LearnTopic; index: number }) {
  const { generate, text, sig, loading, error } = useGenerate();
  const { plan } = useSafetyPlan();

  return (
    <li
      className="topic-list-item animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <details className="topic-accordion group">
        <summary className="topic-summary lift cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className="topic-number">
            {String(index + 1).padStart(2, "0")}
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

          <div aria-busy={loading} aria-live="polite" className="topic-ai">
            {!text && !loading && !error && (
              <button
                type="button"
                onClick={() =>
                  generate({
                    task: "explain-topic",
                    context: `${topic.title}. ${topic.summary}`,
                    profile: planToProfile(plan),
                  })
                }
                className="sun-button sun-button-glass topic-explain lift"
              >
                <span aria-hidden="true" className="topic-spark">
                  ✦
                </span>
                Explain this simply
              </button>
            )}
            {loading && (
              <p className="topic-ai-status text-sm text-muted">
                <span aria-hidden="true" className="topic-thinking-dot" />
                Writing a simpler explanation…
              </p>
            )}
            {text && (
              <div className="topic-ai-answer">
                <p className="eyebrow mb-2">Generated live with Gemini</p>
                {/* Signed AI answer → read-aloud with autoplay. */}
                <AiText
                  text={text}
                  lang={plan.language}
                  speak={{
                    sig,
                    lang: plan.language !== "en" ? plan.language : undefined,
                    autoplay: true,
                  }}
                />
              </div>
            )}
            {error && !loading && (
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
}

export default function LearnClient() {
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
        {LEARN_TOPICS.map((topic, i) => (
          <TopicItem key={topic.id} topic={topic} index={i} />
        ))}
      </ul>
    </section>
  );
}
