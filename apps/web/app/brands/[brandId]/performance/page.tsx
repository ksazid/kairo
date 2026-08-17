import Link from "next/link";
import {
  getBrand,
  getChannelAccounts,
  getExperiments,
  getLearnings,
  getPerformance,
  type ChannelAccountView,
  type PerformanceMetricView,
} from "../../../../src/lib/kairo-api";
import { getInstagramCandidates, type InstagramCandidateView } from "../../../../src/lib/instagram-api";
import { KairoProductShell, KairoScopePicker } from "../../../kairo-product-shell";
import { disconnectInstagramAction, reviewLearningAction, selectInstagramAction } from "./actions";
import "../../../performance.css";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string; instagramIntent?: string }>;

export default async function PerformancePage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { brandId } = await params;
  const messages = await searchParams;
  const [brand, metrics, learnings, experiments, accounts, candidates] = await Promise.all([
    getBrand(brandId),
    getPerformance(brandId),
    getLearnings(brandId),
    getExperiments(brandId),
    getChannelAccounts(brandId),
    safeCandidates(brandId, messages.instagramIntent),
  ]);
  if (!brand) return null;

  const posts = groupMetrics(metrics);
  const available = metrics.filter((metric): metric is PerformanceMetricView & { value: number } => metric.status === "available" && typeof metric.value === "number");
  const instagram = accounts.find((account) => account.channel === "instagram" && account.status !== "disabled");
  const strongestLearning = learnings.find((learning) => learning.status === "accepted") ?? learnings[0];
  const nextExperiment = experiments.find((experiment) => experiment.status === "draft") ?? experiments[0];

  return (
    <KairoProductShell brandId={brand.id} active="Performance" mobileActive="More">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main performance-main">
        <header className="performance-hero">
          <div>
            <p className="eyebrow">Performance Intelligence</p>
            <h1>Turn measured outcomes into the next content decision.</h1>
            <p className="lede">Kairo separates observations, cautious interpretation and experiments so evidence never becomes automatic Brand truth.</p>
          </div>
          <KairoScopePicker brandName={brand.name} meta="Brand-scoped performance memory" />
        </header>

        {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
        {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

        <section className="performance-story" aria-labelledby="performance-story-title">
          <div className="performance-section-heading">
            <div><p className="eyebrow">Decision brief</p><h2 id="performance-story-title">What should this Brand learn from performance?</h2></div>
            <Link className="secondary-button" href={`/brands/${encodeURIComponent(brand.id)}/calendar`}>Open Calendar</Link>
          </div>
          <div className="story-step">
            <span className="story-index">01</span>
            <div><p className="story-question">What happened?</p><strong>{posts.size ? `${posts.size} published post${posts.size === 1 ? "" : "s"} produced ${available.length} reliable observation${available.length === 1 ? "" : "s"}.` : "No reliable channel evidence has been collected yet."}</strong><p>{latest(metrics) === "Not collected" ? "Publish and measure comparable content before drawing a conclusion." : `Latest capture: ${latest(metrics)}.`}</p></div>
          </div>
          <div className="story-step">
            <span className="story-index">02</span>
            <div><p className="story-question">Why might it have happened?</p><strong>{strongestLearning?.interpretation ?? "Kairo needs repeated, comparable evidence before proposing a Brand pattern."}</strong><p>{strongestLearning ? `${label(strongestLearning.status)} Learning · ${Math.round(strongestLearning.confidence * 100)}% confidence.` : "No causal claim is inferred from a single result."}</p></div>
          </div>
          <div className="story-step">
            <span className="story-index">03</span>
            <div><p className="story-question">What should we try next?</p><strong>{nextExperiment?.hypothesis ?? "Publish a comparable variant and choose one primary metric before changing strategy."}</strong><p>{nextExperiment ? `${label(nextExperiment.status)} Experiment · primary metric: ${label(nextExperiment.primaryMetric)}.` : "Experiments stay separate from accepted Brand Learning until evidence supports them."}</p></div>
          </div>
        </section>

        <ChannelConnection brandId={brand.id} account={instagram} intentId={messages.instagramIntent} candidates={candidates} />

        <section className="performance-section" aria-labelledby="learning-title">
          <div className="performance-section-heading"><div><p className="eyebrow">Brand Learning</p><h2 id="learning-title">Patterns that require human judgement</h2><p>Accept only a cautious pattern you want Kairo to remember for this Brand.</p></div><span className="quiet-count">{learnings.length} total</span></div>
          {learnings.length ? <div className="learning-list">{learnings.map((learning) => (
            <article className="learning-item" key={learning.id}>
              <div className="learning-copy">
                <span className={`learning-status ${learning.status}`}>{label(learning.status)}</span>
                <h3>{learning.statement}</h3>
                <p>{learning.interpretation}</p>
                <small>{Math.round(learning.confidence * 100)}% confidence · {learning.evidence.length} supporting evidence group{learning.evidence.length === 1 ? "" : "s"} · {learning.applicability.channel ?? "All channels"}</small>
                <details className="supporting-disclosure">
                  <summary>Inspect evidence and scope</summary>
                  <div className="supporting-detail"><p>Period: {new Date(learning.period.from).toLocaleDateString()} – {new Date(learning.period.to).toLocaleDateString()}</p><p>Supporting posts: {learning.evidence.length || "None"}</p><p>Contradictions: {learning.contradictions.length || "None recorded"}</p>{learning.applicability.audience ? <p>Audience: {learning.applicability.audience}</p> : null}</div>
                </details>
              </div>
              {learning.status === "candidate" ? <div className="learning-actions" aria-label={`Review Learning: ${learning.statement}`}><form action={reviewLearningAction.bind(null, brand.id, learning.id, learning.version, "accept")}><button className="primary-button">Accept Learning</button></form><form action={reviewLearningAction.bind(null, brand.id, learning.id, learning.version, "reject")}><button className="tertiary-button">Reject</button></form></div> : null}
            </article>
          ))}</div> : <div className="performance-empty-inline"><strong>No Candidate Learnings</strong><p>Kairo proposes one only when Brand-scoped evidence supports a cautious pattern.</p></div>}
        </section>

        <section className="performance-section" aria-labelledby="experiments-title">
          <div className="performance-section-heading"><div><p className="eyebrow">Experiments</p><h2 id="experiments-title">Intentional tests, not automatic conclusions</h2><p>Use one hypothesis and one primary metric to make the next comparison interpretable.</p></div><span className="quiet-count">{experiments.length} total</span></div>
          {experiments.length ? <div className="experiment-list">{experiments.map((experiment) => (
            <article className="experiment-item" key={experiment.id}>
              <div><span className={`experiment-status ${experiment.status}`}>{label(experiment.status)}</span><h3>{experiment.hypothesis}</h3><p>{experiment.resultSummary ?? `Primary metric: ${label(experiment.primaryMetric)}. Result not recorded yet.`}</p></div>
              <details className="supporting-disclosure"><summary>Inspect variants</summary><ul>{experiment.variants.map((variant) => <li key={variant.id}>{variant.description}{experiment.winnerVariantId === variant.id ? " · Winner" : ""}</li>)}</ul></details>
            </article>
          ))}</div> : <div className="performance-empty-inline"><strong>No Experiments yet</strong><p>Keep publishing comparable content until there is a useful hypothesis worth testing.</p></div>}
        </section>

        <section className="performance-section evidence-section" aria-labelledby="evidence-title">
          <div className="performance-section-heading"><div><p className="eyebrow">Measured evidence</p><h2 id="evidence-title">Channel observations</h2><p>Raw metrics stay inspectable without becoming the primary decision surface.</p></div><span className="quiet-count">{available.length} available</span></div>
          {posts.size ? <div className="evidence-list">{[...posts].map(([postId, items]) => {
            const availableForPost = items.filter((item) => item.status === "available").length;
            return <article className="evidence-item" key={postId}><div className="evidence-summary"><div><code>{postId}</code><strong>{availableForPost} of {items.length} observations available</strong></div><span className={fresh(items[0]!.capturedAt) ? "freshness fresh" : "freshness stale"}>{fresh(items[0]!.capturedAt) ? "Fresh" : "Stale"}</span></div><details className="metric-disclosure"><summary>Inspect measurements</summary><div className="metric-list">{items.map((metric) => <div className="metric-row" key={metric.id}><div><span>{label(metric.name)}</span><strong>{metric.status === "available" ? format(metric.value) : "Unavailable"}</strong></div><div><small>{metric.status === "available" ? new Date(metric.capturedAt).toLocaleString() : label(metric.reason ?? "provider-did-not-return")}</small><details><summary>Provenance</summary><p>{metric.sourceSnapshotId}<br />{metric.sourceField}<br />{metric.transformationVersion}</p></details></div></div>)}</div></details></article>;
          })}</div> : <div className="performance-empty-inline">No channel evidence collected yet.</div>}
        </section>
      </main>
    </KairoProductShell>
  );
}

function ChannelConnection({ brandId, account, intentId, candidates }: { brandId: string; account?: ChannelAccountView; intentId?: string; candidates: InstagramCandidateView[] }) {
  const connected = account?.status === "connected";
  return <section className="performance-section channel-section" aria-labelledby="channel-title">
    <div className="performance-section-heading"><div><p className="eyebrow">Channel management</p><h2 id="channel-title">Instagram connection</h2><p>{connected ? "Publishing and provider-backed Insights use this secured Professional account." : account?.status === "reconnect-required" ? "Meta permissions need attention before Kairo can publish or collect fresh Insights." : "Connect a Professional account only when this Brand needs supported publishing and measured Insights."}</p></div><Link className="secondary-button" href={`/brands/${encodeURIComponent(brandId)}/channels/groups`}>Account groups</Link></div>
    {account ? <div className="channel-account-row"><div><span className={`channel-state ${connected ? "connected" : "attention"}`}>{label(account.status)}</span><h3>{account.displayName}</h3><p>Instagram · {account.accountRef}</p>{account.capabilities.length ? <small>{account.capabilities.map(label).join(" · ")}</small> : null}</div><div className="channel-actions">{account.status === "reconnect-required" ? <Link className="primary-button" href={`/brands/${encodeURIComponent(brandId)}/channels/instagram/connect`}>Reconnect Instagram</Link> : null}<form action={disconnectInstagramAction.bind(null, brandId, account.id)}><button className="tertiary-button">Disconnect</button></form></div></div> : <div className="channel-account-row"><div><h3>No Instagram account connected</h3><p>Kairo will not infer or substitute a publishing destination.</p></div><Link className="primary-button" href={`/brands/${encodeURIComponent(brandId)}/channels/instagram/connect`}>Connect Instagram</Link></div>}
    {intentId && candidates.length ? <div className="candidate-list"><div><p className="eyebrow">Choose destination</p><h3>Select the Professional account Kairo may use</h3></div>{candidates.map((candidate) => <article className="candidate-row" key={candidate.id}><div><strong>{candidate.username ? `@${candidate.username}` : candidate.displayName}</strong><p>{candidate.pageName}</p><small>Instagram {candidate.accountRef} · Page {candidate.pageRef}</small></div><form action={selectInstagramAction.bind(null, brandId, intentId, candidate.id)}><button className="primary-button">Connect this account</button></form></article>)}</div> : null}
  </section>;
}

async function safeCandidates(brandId: string, intentId?: string) { if (!intentId) return []; try { return await getInstagramCandidates(brandId, intentId); } catch { return []; } }
function groupMetrics(metrics: PerformanceMetricView[]) { const groups = new Map<string, PerformanceMetricView[]>(); for (const metric of metrics) groups.set(metric.publishedPostId, [...(groups.get(metric.publishedPostId) ?? []), metric]); return groups; }
function fresh(value: string) { return Date.now() - Date.parse(value) <= 86_400_000; }
function latest(metrics: PerformanceMetricView[]) { return metrics.length ? new Date(Math.max(...metrics.map((metric) => Date.parse(metric.capturedAt)))).toLocaleString() : "Not collected"; }
function label(value: string) { return value.replace(/([A-Z])/g, " $1").replaceAll("-", " ").replace(/^./, (character) => character.toUpperCase()); }
function format(value?: number) { return typeof value === "number" ? new Intl.NumberFormat().format(value) : "Unavailable"; }
