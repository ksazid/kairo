import Link from "next/link";
import { freshnessLabel, type PerformanceFeedbackView } from "../src/lib/performance-feedback-view-model";

export function PerformanceFeedback({
  brandId,
  feedback,
  compact = false,
}: {
  brandId: string;
  feedback: PerformanceFeedbackView;
  compact?: boolean;
}) {
  return (
    <section className={`performance-feedback ${compact ? "compact" : ""}`} aria-labelledby={compact ? "recommendation-feedback-title" : "performance-feedback-title"}>
      <div className="performance-feedback-heading">
        <div>
          <p className="eyebrow">Insights feedback</p>
          <h2 id={compact ? "recommendation-feedback-title" : "performance-feedback-title"}>
            {compact ? "How past evidence may influence what comes next" : "Evidence available to the next recommendation"}
          </h2>
        </div>
        <Link className="tertiary-button" href={`/brands/${encodeURIComponent(brandId)}/performance`}>Open Insights</Link>
      </div>
      <div className="performance-feedback-status" aria-label="Instagram metric status">
        <span className={`freshness ${feedback.freshness}`}>{freshnessLabel(feedback.freshness)}</span>
        <strong>{feedback.availableCount} available Instagram observation{feedback.availableCount === 1 ? "" : "s"}</strong>
        <small>{feedback.latestCapturedAt ? `Latest capture ${new Date(feedback.latestCapturedAt).toLocaleString()}` : "No Instagram metrics collected yet"}{feedback.unavailableCount ? ` · ${feedback.unavailableCount} unavailable` : ""}</small>
      </div>
      {feedback.acceptedLearnings.length ? (
        <div className="learning-influence">
          <strong>{feedback.acceptedLearnings.length} accepted Learning{feedback.acceptedLearnings.length === 1 ? " may" : "s may"} influence ranking</strong>
          <ul>{feedback.acceptedLearnings.slice(0, compact ? 2 : 4).map((learning) => <li key={learning.id}><span>{learning.statement}</span><small>{Math.round(learning.confidence * 100)}% confidence · {learning.scope}</small></li>)}</ul>
        </div>
      ) : <p className="performance-feedback-empty">No accepted Learning influences the next recommendation yet.</p>}
      <p className="human-authority-note"><strong>You remain in control.</strong> Accepted Learnings are advisory evidence. They never replace the owner goal, automatically change Brand Brain, select content, or approve publishing.</p>
    </section>
  );
}
