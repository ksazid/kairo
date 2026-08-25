import {
  getBrand,
  getExperiments,
  getLearnings,
  getPerformance,
  type ExperimentView,
  type LearningView,
  type PerformanceMetricView,
} from "../../../../src/lib/kairo-api";
import { KairoProductShell } from "../../../kairo-product-shell";
import "./insights-v2.css";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string; period?: string; metric?: string }>;
type Period = "30d" | "90d" | "365d" | "all";
type AvailableMetric = PerformanceMetricView & { value: number };

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "365d", label: "Last 12 months" },
  { value: "all", label: "All time" },
];

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

  const period = normalisePeriod(messages.period);
  const periodMetrics = filterByPeriod(metrics, period);
  const available = periodMetrics.filter((metric): metric is AvailableMetric => metric.status === "available" && typeof metric.value === "number");
  const metricNames = unique(periodMetrics.map((metric) => metric.name));
  const selectedMetric = metricNames.includes(messages.metric ?? "") ? messages.metric! : chooseTrendMetric(metricNames);
  const metricGroups = groupAvailableMetrics(available);
  const summaryNames = rankSummaryMetrics([...metricGroups.keys()]).slice(0, 4);
  const trendSeries = selectedMetric ? metricGroups.get(selectedMetric) ?? [] : [];
  const measuredContent = new Set(periodMetrics.map((metric) => metric.publishedPostId)).size;
  const strongestLearning = chooseExplanation(learnings);
  const rankedActions = rankNextActions(experiments);

  return (
    <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Performance" pageLabel="Insights">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main insights-main">
        <header className="insights-hero">
          <div>
            <h1>Insights</h1>
            <p className="lede">See what&apos;s working, why, and what to do next.</p>
          </div>
        </header>

        {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
        {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

        <form className="insights-filters" method="get" aria-label="Filter Insights">
          <label>
            <span>Date range</span>
            <select name="period" defaultValue={period}>
              {PERIODS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            <span>Metric</span>
            <select name="metric" defaultValue={selectedMetric} disabled={!metricNames.length}>
              {metricNames.length
                ? metricNames.map((name) => <option key={name} value={name}>{metricLabel(name)}</option>)
                : <option value="">No metrics available</option>}
            </select>
          </label>
          <button className="secondary-button" type="submit">Apply</button>
        </form>

        <section className="insights-context" aria-label="Results coverage">
          <p><strong>{measuredContent}</strong> measured {measuredContent === 1 ? "content item" : "content items"} · <strong>{available.length}</strong> available {available.length === 1 ? "result" : "results"}</p>
          <small>{latestCapture(periodMetrics)}</small>
        </section>

        <section className="insights-metric-grid" aria-label="Performance summary">
          {summaryNames.length ? summaryNames.map((name) => {
            const series = metricGroups.get(name) ?? [];
            const latest = series.at(-1);
            return (
              <article className="insights-metric-card" key={name}>
                <span>{metricLabel(name)}</span>
                <strong>{latest ? formatMetric(latest.value) : "Unavailable"}</strong>
                <Sparkline values={series.map((item) => item.value)} label={`${metricLabel(name)} trend`} />
                <small>{latest ? `Updated ${shortDate(latest.capturedAt)}` : "No measured value in this period"}</small>
              </article>
            );
          }) : (
            <div className="insights-empty compact">
              <strong>No measured results in this period</strong>
              <p>Performance metrics will appear here when connected channels return real results.</p>
            </div>
          )}
        </section>

        <section className="insights-flow" aria-label="What the results mean">
          <article className="insights-flow-section">
            <div className="insights-flow-heading">
              <span>01</span>
              <div>
                <p>What happened</p>
                <h2>{measuredContent ? `${measuredContent} published ${measuredContent === 1 ? "item has" : "items have"} measurable results.` : "There is not enough measured data yet."}</h2>
              </div>
            </div>
            {selectedMetric && trendSeries.length ? (
              <div className="insights-trend-card">
                <div className="insights-trend-heading">
                  <div>
                    <span>{metricLabel(selectedMetric)}</span>
                    <strong>{formatMetric(trendSeries.at(-1)!.value)}</strong>
                  </div>
                  <small>{periodLabel(period)}</small>
                </div>
                <TrendChart values={trendSeries.map((item) => item.value)} label={`${metricLabel(selectedMetric)} over ${periodLabel(period).toLowerCase()}`} />
                <div className="insights-trend-axis" aria-hidden="true">
                  <span>{shortDate(trendSeries[0]!.capturedAt)}</span>
                  <span>{shortDate(trendSeries.at(-1)!.capturedAt)}</span>
                </div>
              </div>
            ) : (
              <div className="insights-empty"><strong>No trend available yet</strong><p>At least one real metric capture is required before Kairo can show a performance trend.</p></div>
            )}
          </article>

          <article className="insights-flow-section">
            <div className="insights-flow-heading">
              <span>02</span>
              <div>
                <p>Why it may have happened</p>
                <h2>Evidence-backed explanation</h2>
              </div>
            </div>
            {strongestLearning ? (
              <div className="insights-explanation">
                <h3>{strongestLearning.interpretation}</h3>
                <p>{explanationSupport(strongestLearning)}</p>
              </div>
            ) : (
              <div className="insights-empty"><strong>No reliable explanation yet</strong><p>Kairo needs repeated, comparable results before suggesting why performance changed.</p></div>
            )}
          </article>

          <article className="insights-flow-section next">
            <div className="insights-flow-heading">
              <span>03</span>
              <div>
                <p>What to try next</p>
                <h2>Ranked next actions</h2>
              </div>
            </div>
            {rankedActions.length ? (
              <ol className="insights-next-actions">
                {rankedActions.map((action, index) => <li key={`${action}-${index}`}><span>{index + 1}</span><p>{action}</p></li>)}
              </ol>
            ) : (
              <div className="insights-empty"><strong>No ranked action yet</strong><p>Keep publishing comparable content until there is enough evidence to recommend the next move.</p></div>
            )}
          </article>
        </section>

        <section className="insights-secondary-grid" aria-label="Additional result breakdowns">
          <article className="insights-secondary-card">
            <div>
              <p className="eyebrow">Channel comparison</p>
              <h2>Compare where content performs best</h2>
            </div>
            <div className="insights-unavailable-state">
              <strong>Channel-level results are not available yet.</strong>
              <p>This comparison will populate only when performance observations include real channel attribution.</p>
            </div>
          </article>
          <article className="insights-secondary-card">
            <div>
              <p className="eyebrow">Top content</p>
              <h2>See which content is leading</h2>
            </div>
            <div className="insights-unavailable-state">
              <strong>Top-content ranking is not available yet.</strong>
              <p>This section will populate only when measured results can be matched to user-facing content details.</p>
            </div>
          </article>
        </section>
      </main>
    </KairoProductShell>
  );
}

function normalisePeriod(value?: string): Period {
  return value === "30d" || value === "90d" || value === "365d" || value === "all" ? value : "30d";
}

function filterByPeriod(metrics: PerformanceMetricView[], period: Period): PerformanceMetricView[] {
  if (period === "all") return [...metrics].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  const days = period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const cutoff = Date.now() - days * 86_400_000;
  return metrics.filter((metric) => Date.parse(metric.capturedAt) >= cutoff).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
}

function groupAvailableMetrics(metrics: AvailableMetric[]): Map<string, AvailableMetric[]> {
  const groups = new Map<string, AvailableMetric[]>();
  for (const metric of metrics) groups.set(metric.name, [...(groups.get(metric.name) ?? []), metric]);
  return groups;
}

function rankSummaryMetrics(names: string[]): string[] {
  const priority = ["reach", "save", "share", "engagement"];
  return [...names].sort((a, b) => {
    const ai = priority.findIndex((key) => a.toLowerCase().includes(key));
    const bi = priority.findIndex((key) => b.toLowerCase().includes(key));
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function chooseTrendMetric(names: string[]): string {
  return rankSummaryMetrics(names)[0] ?? "";
}

function chooseExplanation(learnings: LearningView[]): LearningView | null {
  return learnings
    .filter((learning) => learning.evidence.length > 0)
    .sort((a, b) => b.evidence.length - a.evidence.length || b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

function rankNextActions(experiments: ExperimentView[]): string[] {
  return unique(
    [...experiments]
      .sort((a, b) => (a.status === b.status ? b.createdAt.localeCompare(a.createdAt) : a.status === "draft" ? -1 : 1))
      .map((experiment) => experiment.hypothesis)
      .filter(Boolean),
  ).slice(0, 3);
}

function explanationSupport(learning: LearningView): string {
  const supporting = learning.evidence.length;
  const conflicting = learning.contradictions.length;
  if (conflicting) return `Supported by ${supporting} measured ${supporting === 1 ? "result" : "results"}, with ${conflicting} conflicting ${conflicting === 1 ? "result" : "results"} still visible.`;
  return `Supported by ${supporting} measured ${supporting === 1 ? "result" : "results"}.`;
}

function latestCapture(metrics: PerformanceMetricView[]): string {
  if (!metrics.length) return "No channel results collected in this period.";
  const latest = metrics.reduce((max, metric) => Math.max(max, Date.parse(metric.capturedAt)), 0);
  return `Latest result ${new Date(latest).toLocaleString()}.`;
}

function periodLabel(period: Period): string {
  return PERIODS.find((option) => option.value === period)?.label ?? "Last 30 days";
}

function metricLabel(value: string): string {
  return value.replace(/([A-Z])/g, " $1").replaceAll("-", " ").replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
}

function formatMetric(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function chartPoints(values: number[], width: number, height: number, padding: number): string {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (value - min) / span) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (!values.length) return <div className="insights-sparkline empty" aria-label={`${label}: unavailable`} />;
  const points = chartPoints(values, 160, 42, 4);
  return (
    <svg className="insights-sparkline" viewBox="0 0 160 42" role="img" aria-label={label} preserveAspectRatio="none">
      <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" />
      {values.length === 1 ? <circle cx="80" cy="21" r="2.5" /> : null}
    </svg>
  );
}

function TrendChart({ values, label }: { values: number[]; label: string }) {
  const points = chartPoints(values, 720, 220, 16);
  return (
    <svg className="insights-trend-chart" viewBox="0 0 720 220" role="img" aria-label={label} preserveAspectRatio="none">
      <line x1="16" y1="204" x2="704" y2="204" />
      <line x1="16" y1="110" x2="704" y2="110" />
      <line x1="16" y1="16" x2="704" y2="16" />
      <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" />
      {values.length === 1 ? <circle cx="360" cy="110" r="4" /> : null}
    </svg>
  );
}
