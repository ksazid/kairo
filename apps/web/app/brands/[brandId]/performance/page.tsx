import Link from "next/link";
import {
  getBrand,
  getExperiments,
  getLearnings,
  getPerformance,
  type LearningView,
} from "../../../../src/lib/kairo-api";
import {
  buildApprovedInsightsMetrics,
  type ApprovedMetricPoint,
  type ApprovedMetricSlot,
} from "../../../../src/lib/approved-insights-view-model";
import { KairoProductShell } from "../../../kairo-product-shell";
import { KairoIcon } from "../../../kairo-icons";
import styles from "./insights-approved.module.css";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string; period?: string }>;

type PatternCard = {
  title: string;
  body: string;
  kind: "trend" | "timing";
  available: boolean;
};

const PERIODS = [7, 30, 90] as const;

export default async function InsightsPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { brandId } = await params;
  const messages = await searchParams;
  const periodDays = parsePeriod(messages.period);
  const [brand, metrics, learnings, experiments] = await Promise.all([
    getBrand(brandId),
    getPerformance(brandId),
    getLearnings(brandId),
    getExperiments(brandId),
  ]);
  if (!brand) return null;

  const metricView = buildApprovedInsightsMetrics(metrics, periodDays);
  const patterns = buildPatternCards(learnings);
  const nextExperiment = experiments.find((experiment) => experiment.status === "draft") ?? experiments[0] ?? null;
  const nextTitle = nextExperiment?.hypothesis || "Create another comparable post";
  const nextBody = nextExperiment
    ? `Treat this as a test and compare the same primary metric: ${readable(nextExperiment.primaryMetric)}.`
    : "Keep the format, audience and primary metric comparable so the next result adds useful evidence.";
  const homeHref = `/?workspace=${encodeURIComponent(brand.workspaceId)}&brand=${encodeURIComponent(brand.id)}`;

  return (
    <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Performance" pageLabel="Home" variant="portrait-reference">
      <main id="kairo-main-content" tabIndex={-1} className={styles.main}>
        <header className={styles.pageHeader}>
          <div>
            <h1>Insights</h1>
            <p>What happened, why it happened, and what to do next.</p>
          </div>
          <details className={styles.periodControl}>
            <summary>{metricView.periodLabel}<KairoIcon name="chevron" /></summary>
            <div className={styles.periodMenu}>
              {PERIODS.map((days) => (
                <Link key={days} href={`/brands/${encodeURIComponent(brand.id)}/performance?period=${days}`} data-active={days === periodDays || undefined}>{`Last ${days} days`}</Link>
              ))}
            </div>
          </details>
        </header>

        {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
        {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

        <section className={styles.panel} aria-labelledby="what-happened-title">
          <h2 className={styles.panelTitle} id="what-happened-title">What happened</h2>
          <div className={styles.metricGrid}>
            {metricView.slots.map((slot) => <MetricCard key={slot.key} slot={slot} periodDays={periodDays} />)}
          </div>
        </section>

        <section className={styles.trendPanel} aria-labelledby="engagement-trend-title">
          <header className={styles.trendHeader}>
            <h2 id="engagement-trend-title">Engagement trend <KairoIcon name="info" /></h2>
            <span className={styles.legend}>Engagement rate</span>
          </header>
          <div className={styles.chartWrap}>
            <EngagementChart series={metricView.engagementSeries} />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="why-title">
          <h2 id="why-title">Why it happened</h2>
          <div className={styles.patternList}>
            {patterns.map((pattern, index) => (
              <article className={styles.patternCard} data-kind={pattern.kind} key={`${pattern.kind}-${index}`} aria-label={pattern.available ? pattern.title : "Insight unavailable"}>
                <span className={styles.patternIcon}>{pattern.kind === "timing" ? <ClockPatternIcon /> : <TrendPatternIcon />}</span>
                <div className={styles.patternCopy}>
                  <h3>{pattern.title}</h3>
                  <p>{pattern.body}</p>
                </div>
                <span className={styles.patternChevron} aria-hidden="true"><KairoIcon name="chevron" /></span>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="next-title">
          <h2 id="next-title">What to do next</h2>
          <article className={styles.nextCard}>
            <div className={styles.nextTop}>
              <span className={styles.nextIcon}><MagicWandIcon /></span>
              <div className={styles.nextCopy}>
                <h3>{nextTitle}</h3>
                <p>{nextBody}</p>
              </div>
              <span className={styles.patternChevron} aria-hidden="true"><KairoIcon name="chevron" /></span>
            </div>
            <Link className={styles.nextButton} href={homeHref}>Create similar</Link>
          </article>
        </section>
      </main>
    </KairoProductShell>
  );
}

function MetricCard({ slot, periodDays }: { slot: ApprovedMetricSlot; periodDays: number }) {
  const comparison = comparisonView(slot.changePct);
  return (
    <article className={styles.metricCard}>
      <span className={styles.metricLabel}>{slot.label}<KairoIcon name="info" /></span>
      <strong className={styles.metricValue} data-unavailable={slot.value == null || undefined}>{slot.formattedValue}</strong>
      <div className={styles.metricComparison}>
        {comparison ? <strong data-direction={comparison.direction}>{comparison.arrow} {comparison.value}</strong> : null}
        <span>{comparison ? `vs prior ${periodDays} days` : "No comparable prior period"}</span>
      </div>
      {slot.series.length >= 2 ? <Sparkline series={slot.series} /> : <div className={styles.sparklinePlaceholder}>Trend unavailable</div>}
    </article>
  );
}

function Sparkline({ series }: { series: ApprovedMetricPoint[] }) {
  const points = scaledPoints(series, 120, 44, 2);
  return (
    <svg className={styles.sparkline} viewBox="0 0 120 44" preserveAspectRatio="none" role="img" aria-label="Observed trend">
      <polyline points={points.map(([x, y]) => `${x},${y}`).join(" ")} />
    </svg>
  );
}

function EngagementChart({ series }: { series: ApprovedMetricPoint[] }) {
  if (series.length < 2) return <div className={styles.chartEmpty}>Engagement trend will appear when at least two real engagement-rate observations are available for this period.</div>;

  const width = 640;
  const height = 235;
  const left = 38;
  const right = 8;
  const top = 16;
  const bottom = 34;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxValue = Math.max(...series.map((point) => point.value), 0);
  const step = Math.max(1, Math.ceil(maxValue / 3));
  const axisMax = step * 3;
  const linePoints = series.map((point, index) => {
    const x = left + (series.length === 1 ? plotWidth / 2 : (index / (series.length - 1)) * plotWidth);
    const y = top + plotHeight - (Math.max(0, point.value) / axisMax) * plotHeight;
    return [x, y] as const;
  });
  const areaPoints = `${left},${top + plotHeight} ${linePoints.map(([x, y]) => `${x},${y}`).join(" ")} ${left + plotWidth},${top + plotHeight}`;
  const yTicks = [3, 2, 1, 0].map((multiplier) => multiplier * step);
  const xTicks = axisDateTicks(series, 5);

  return (
    <svg className={styles.chart} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Engagement rate observations over time">
      <defs>
        <linearGradient id="insightsAreaGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7060ef" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#7060ef" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((tick) => {
        const y = top + plotHeight - (tick / axisMax) * plotHeight;
        return <g key={tick}><line className={styles.chartGrid} x1={left} x2={left + plotWidth} y1={y} y2={y} /><text className={styles.chartLabel} x="0" y={y + 4}>{formatRateTick(tick)}</text></g>;
      })}
      <polygon className={styles.chartArea} points={areaPoints} />
      <polyline className={styles.chartLine} points={linePoints.map(([x, y]) => `${x},${y}`).join(" ")} />
      {xTicks.map(({ index, label }) => {
        const x = left + (index / (series.length - 1)) * plotWidth;
        return <text className={styles.chartLabel} key={`${index}-${label}`} x={x} y={height - 7} textAnchor={index === 0 ? "start" : index === series.length - 1 ? "end" : "middle"}>{label}</text>;
      })}
    </svg>
  );
}

function buildPatternCards(learnings: LearningView[]): PatternCard[] {
  const ordered = [...learnings].sort((a, b) => {
    const statusDelta = learningStatusRank(a.status) - learningStatusRank(b.status);
    if (statusDelta) return statusDelta;
    return b.confidence - a.confidence;
  });
  const cards = ordered.slice(0, 2).map((learning) => ({
    title: learning.statement,
    body: learning.interpretation,
    kind: learning.patterns.some((pattern) => pattern.dimension === "timing") ? "timing" as const : "trend" as const,
    available: true,
  }));
  if (cards.length === 0) {
    cards.push({
      title: "Not enough repeated evidence yet",
      body: "Kairo needs comparable published content before suggesting a reliable performance pattern.",
      kind: "trend",
      available: false,
    });
  }
  if (cards.length === 1) {
    cards.push({
      title: "Timing pattern not established",
      body: "More comparable publishing times are needed before timing can be treated as a useful pattern.",
      kind: "timing",
      available: false,
    });
  }
  return cards;
}

function learningStatusRank(status: LearningView["status"]): number {
  if (status === "accepted") return 0;
  if (status === "candidate") return 1;
  if (status === "superseded") return 2;
  return 3;
}

function comparisonView(value: number | null): { arrow: string; value: string; direction: "up" | "down" | "flat" } | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (Math.abs(value) < 0.05) return { arrow: "→", value: "0%", direction: "flat" };
  const magnitude = `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(Math.abs(value))}%`;
  return value > 0
    ? { arrow: "↑", value: magnitude, direction: "up" }
    : { arrow: "↓", value: magnitude, direction: "down" };
}

function scaledPoints(series: ApprovedMetricPoint[], width: number, height: number, padding: number): Array<readonly [number, number]> {
  const values = series.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return series.map((point, index) => {
    const x = padding + (index / (series.length - 1)) * (width - padding * 2);
    const y = padding + ((max - point.value) / range) * (height - padding * 2);
    return [x, y] as const;
  });
}

function axisDateTicks(series: ApprovedMetricPoint[], count: number): Array<{ index: number; label: string }> {
  const indexes = new Set<number>();
  for (let tick = 0; tick < count; tick += 1) indexes.add(Math.round((tick / (count - 1)) * (series.length - 1)));
  return [...indexes].sort((a, b) => a - b).map((index) => ({
    index,
    label: new Date(`${series[index]!.at}T00:00:00.000Z`).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" }),
  }));
}

function formatRateTick(value: number): string {
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value)}%`;
}

function parsePeriod(value?: string): 7 | 30 | 90 {
  const parsed = Number(value);
  return parsed === 7 || parsed === 90 ? parsed : 30;
}

function readable(value: string): string {
  return value.replace(/([A-Z])/g, " $1").replaceAll("-", " ").replaceAll("_", " ").trim().replace(/^./, (character) => character.toUpperCase());
}

function TrendPatternIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4 17 5-5 4 3 7-8" /><path d="M15 7h5v5" /></svg>;
}

function ClockPatternIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3.5 2" /></svg>;
}

function MagicWandIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 19 10-10 3 3L8 22H5v-3Z" /><path d="m14 5 .7-2 .7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7ZM6 9l.5-1.5L7 9l1.5.5L7 10l-.5 1.5L6 10l-1.5-.5L6 9Z" /></svg>;
}
