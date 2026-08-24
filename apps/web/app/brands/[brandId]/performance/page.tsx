import Link from "next/link";
import {
  getBrand,
  getExperiments,
  getLearnings,
  getPerformance,
  type PerformanceMetricView,
} from "../../../../src/lib/kairo-api";
import { KairoProductShell, KairoScopePicker } from "../../../kairo-product-shell";
import { reviewLearningAction } from "./actions";
import { buildPerformanceFeedback } from "../../../../src/lib/performance-feedback-view-model";
import { PerformanceFeedback } from "../../../performance-feedback";
import "../../../performance.css";
import "./insights-v2.css";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string; asset?: string }>;

export default async function InsightsPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { brandId } = await params;
  const messages = await searchParams;
  const [brand, metrics, learnings, experiments] = await Promise.all([
    getBrand(brandId),
    getPerformance(brandId),
    getLearnings(brandId),
    getExperiments(brandId),
  ]);
  if (!brand) return null;

  const posts = groupMetrics(metrics);
  const available = metrics.filter((metric): metric is PerformanceMetricView & { value: number } => metric.status === "available" && typeof metric.value === "number");
  const unavailable = metrics.length - available.length;
  const strongestLearning = learnings.find((learning) => learning.status === "accepted") ?? learnings[0];
  const nextExperiment = experiments.find((experiment) => experiment.status === "draft") ?? experiments[0];
  const feedback = buildPerformanceFeedback(metrics, learnings);

  return (
    <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Performance">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main insights-main">
        <header className="insights-hero">
          <div>
            <p className="eyebrow">Insights</p>
            <h1>See what happened. Decide what to try next.</h1>
            <p className="lede">Kairo separates measured outcomes, cautious interpretation and the next experiment so correlation never becomes an automatic Brand truth.</p>
          </div>
          <KairoScopePicker brandName={brand.name} meta="Brand-scoped evidence" />
        </header>

        {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
        {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

        <section className="insights-summary" aria-label="Insights summary">
          <p>
            <strong>{posts.size}</strong> measured {posts.size === 1 ? "post" : "posts"}
            <span aria-hidden="true"> · </span>
            <strong>{available.length}</strong> reliable {available.length === 1 ? "observation" : "observations"}
            {unavailable ? <><span aria-hidden="true"> · </span><strong>{unavailable}</strong> unavailable</> : null}
          </p>
          <small>{latest(metrics) === "Not collected" ? "No channel evidence collected yet." : `Latest capture ${latest(metrics)}.`}</small>
        </section>

        <section className="insights-story" aria-labelledby="insights-story-title">
          <div className="insights-story-heading">
            <div>
              <p className="eyebrow">Decision brief</p>
              <h2 id="insights-story-title">What should inform the next content decision?</h2>
            </div>
            <div className="insights-actions">
              <Link className="secondary-button" href={`/brands/${encodeURIComponent(brand.id)}/calendar`}>Open Calendar</Link>
              <Link className="primary-button" href={`/brands/${encodeURIComponent(brand.id)}/content`}>Open Content</Link>
            </div>
          </div>

          <article className="insights-step">
            <span>01</span>
            <div>
              <p>What happened?</p>
              <h3>{posts.size ? `${posts.size} published post${posts.size === 1 ? "" : "s"} produced ${available.length} reliable observation${available.length === 1 ? "" : "s"}.` : "There is not enough measured evidence yet."}</h3>
              <small>{latest(metrics) === "Not collected" ? "Publish and measure comparable content before drawing a conclusion." : `Latest evidence was captured ${latest(metrics)}.`}</small>
            </div>
          </article>

          <article className="insights-step">
            <span>02</span>
            <div>
              <p>Why might it have happened?</p>
              <h3>{strongestLearning?.interpretation ?? "Kairo needs repeated, comparable evidence before proposing a Brand pattern."}</h3>
              <small>{strongestLearning ? `${label(strongestLearning.status)} Learning · ${Math.round(strongestLearning.confidence * 100)}% confidence.` : "No causal claim is inferred from a single result."}</small>
            </div>
          </article>

          <article className="insights-step next">
            <span>03</span>
            <div>
              <p>What should we try next?</p>
              <h3>{nextExperiment?.hypothesis ?? "Publish a comparable variant and choose one primary metric before changing strategy."}</h3>
              <small>{nextExperiment ? `${label(nextExperiment.status)} Experiment · primary metric: ${label(nextExperiment.primaryMetric)}.` : "Experiments remain separate from accepted Brand Learning until evidence supports them."}</small>
            </div>
          </article>
        </section>

        <PerformanceFeedback brandId={brand.id} feedback={feedback} />

        <section className="insights-secondary" aria-labelledby="learning-title">
          <div className="insights-section-heading">
            <div>
              <p className="eyebrow">Brand Learning</p>
              <h2 id="learning-title">Patterns that still require your judgement</h2>
              <p>Accept only a cautious pattern you want Kairo to remember for this Brand.</p>
            </div>
            <span>{learnings.length} total</span>
          </div>
          {learnings.length ? <div className="insights-list">{learnings.map((learning) => (
            <article className="insights-list-item" key={learning.id}>
              <div>
                <span className={`learning-status ${learning.status}`}>{label(learning.status)}</span>
                <h3>{learning.statement}</h3>
                <p>{learning.interpretation}</p>
                <small>{Math.round(learning.confidence * 100)}% confidence · {learning.evidence.length} evidence group{learning.evidence.length === 1 ? "" : "s"} · {learning.applicability.channel ?? "All channels"}</small>
                <details className="supporting-disclosure">
                  <summary>Inspect evidence and scope</summary>
                  <div className="supporting-detail">
                    <p>Period: {new Date(learning.period.from).toLocaleDateString()} – {new Date(learning.period.to).toLocaleDateString()}</p>
                    <p>Supporting posts: {learning.evidence.length || "None"}</p>
                    <p>Contradictions: {learning.contradictions.length || "None recorded"}</p>
                    {learning.applicability.audience ? <p>Audience: {learning.applicability.audience}</p> : null}
                  </div>
                </details>
              </div>
              {learning.status === "candidate" ? (
                <div className="insights-review-actions" aria-label={`Review Learning: ${learning.statement}`}>
                  <form action={reviewLearningAction.bind(null, brand.id, learning.id, learning.version, "accept")}><button className="primary-button">Accept Learning</button></form>
                  <form action={reviewLearningAction.bind(null, brand.id, learning.id, learning.version, "reject")}><button className="tertiary-button">Reject</button></form>
                </div>
              ) : null}
            </article>
          ))}</div> : <div className="insights-empty"><strong>No Candidate Learnings</strong><p>Kairo proposes one only when Brand-scoped evidence supports a cautious pattern.</p></div>}
        </section>

        <section className="insights-secondary" aria-labelledby="experiments-title">
          <div className="insights-section-heading">
            <div>
              <p className="eyebrow">Experiments</p>
              <h2 id="experiments-title">Intentional tests, not automatic conclusions</h2>
              <p>Use one hypothesis and one primary metric to make the next comparison interpretable.</p>
            </div>
            <span>{experiments.length} total</span>
          </div>
          {experiments.length ? <div className="insights-list">{experiments.map((experiment) => (
            <article className="insights-list-item" key={experiment.id}>
              <div>
                <span className={`experiment-status ${experiment.status}`}>{label(experiment.status)}</span>
                <h3>{experiment.hypothesis}</h3>
                <p>{experiment.resultSummary ?? `Primary metric: ${label(experiment.primaryMetric)}. Result not recorded yet.`}</p>
              </div>
              <details className="supporting-disclosure"><summary>Inspect variants</summary><ul>{experiment.variants.map((variant) => <li key={variant.id}>{variant.description}{experiment.winnerVariantId === variant.id ? " · Winner" : ""}</li>)}</ul></details>
            </article>
          ))}</div> : <div className="insights-empty"><strong>No experiments yet</strong><p>Keep publishing comparable content until there is a useful hypothesis worth testing.</p></div>}
        </section>

        <section className="insights-evidence" aria-labelledby="evidence-title">
          <div className="insights-section-heading">
            <div>
              <p className="eyebrow">Evidence</p>
              <h2 id="evidence-title">Measured channel observations</h2>
              <p>Raw metrics stay inspectable without becoming the primary decision surface.</p>
            </div>
            <span>{available.length} available</span>
          </div>
          {posts.size ? <div className="insights-list">{[...posts].map(([postId, items]) => {
            const availableForPost = items.filter((item) => item.status === "available").length;
            return (
              <article className="insights-list-item evidence" key={postId}>
                <div>
                  <code>{postId}</code>
                  <h3>{availableForPost} of {items.length} observations available</h3>
                  <small>{fresh(items[0]!.capturedAt) ? "Fresh evidence" : "Older evidence"}</small>
                </div>
                <details className="supporting-disclosure">
                  <summary>Inspect measurements</summary>
                  <div className="insights-metrics">
                    {items.map((metric) => (
                      <div key={metric.id}>
                        <span>{label(metric.name)}</span>
                        <strong>{metric.status === "available" ? format(metric.value) : "Unavailable"}</strong>
                        <small>{metric.status === "available" ? new Date(metric.capturedAt).toLocaleString() : label(metric.reason ?? "provider-did-not-return")}</small>
                      </div>
                    ))}
                  </div>
                </details>
              </article>
            );
          })}</div> : <div className="insights-empty">No channel evidence collected yet.</div>}
        </section>
      </main>
    </KairoProductShell>
  );
}

function groupMetrics(metrics: PerformanceMetricView[]) {
  const groups = new Map<string, PerformanceMetricView[]>();
  for (const metric of metrics) groups.set(metric.publishedPostId, [...(groups.get(metric.publishedPostId) ?? []), metric]);
  return groups;
}

function fresh(value: string) { return Date.now() - Date.parse(value) <= 86_400_000; }
function latest(metrics: PerformanceMetricView[]) { return metrics.length ? new Date(Math.max(...metrics.map((metric) => Date.parse(metric.capturedAt)))).toLocaleString() : "Not collected"; }
function label(value: string) { return value.replace(/([A-Z])/g, " $1").replaceAll("-", " ").replace(/^./, (character) => character.toUpperCase()); }
function format(value?: number) { return typeof value === "number" ? new Intl.NumberFormat().format(value) : "Unavailable"; }
