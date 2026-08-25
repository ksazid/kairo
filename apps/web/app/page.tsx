import Link from "next/link";
import { redirect } from "next/navigation";
import { KairoProductShell } from "./kairo-product-shell";
import { KairoIcon } from "./kairo-icons";
import { MyIdeaComposer } from "./my-idea-composer";
import {
  getBrandNotifications,
  getBrands,
  getChannelAccounts,
  getOpportunities,
  getPerformance,
  getSession,
  type PerformanceMetricView,
} from "../src/lib/kairo-api";
import {
  buildAttentionItems,
  buildForYou,
  type HomeCreationFormat,
  type HomeForYouItem,
} from "../src/lib/home-intelligence";
import styles from "./home-vs85.module.css";

type SearchParams = Promise<{ workspace?: string; brand?: string; notice?: string; error?: string; idea?: string }>;
type RecommendationScores = { overall: number; audienceFit: number; status: string };
type HomeMetric = { label: "Reach" | "Saves" | "Shares" | "Engagement rate"; value?: number };

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?returnTo=/");
  if (session.workspaces.length === 0) redirect("/onboarding");

  const params = await searchParams;
  const workspace = session.workspaces.find((item) => item.id === params.workspace) ?? session.workspaces[0];
  if (!workspace) redirect("/onboarding");

  const brands = await getBrands(workspace.id);
  const brand = brands.find((item) => item.id === params.brand) ?? brands[0] ?? null;

  if (!brand) {
    return (
      <KairoProductShell workspaceId={workspace.id} active="Home">
        <main id="kairo-main-content" tabIndex={-1} className={styles.home}>
          <h1 className={styles.srOnly}>Home</h1>
          <section className={styles.emptyBrand}>
            <h2>Give Kairo something to learn from.</h2>
            <p>One public Brand URL is enough to start.</p>
            <Link className={styles.primaryAction} href={`/brands/new?workspace=${encodeURIComponent(workspace.id)}`}>Add Brand</Link>
          </section>
        </main>
      </KairoProductShell>
    );
  }

  const [opportunities, performance, notificationResult, channelResult] = await Promise.all([
    getOpportunities(brand.id).catch(() => []),
    getPerformance(brand.id).catch(() => []),
    getBrandNotifications(brand.id).catch(() => ({ brandId: brand.id, items: [] })),
    getChannelAccounts(brand.id).then((items) => ({ available: true as const, items })).catch(() => ({ available: false as const, items: [] })),
  ]);

  const hasConnectedChannel = channelResult.available ? channelResult.items.some((channel) => channel.status === "connected") : true;
  const attention = buildAttentionItems({ brandId: brand.id, notifications: notificationResult.items, hasConnectedChannel })[0];
  const forYou = buildForYou(opportunities);
  const scores = new Map<string, RecommendationScores>(opportunities.map((item) => [item.id, { overall: item.scores.overall, audienceFit: item.scores.audienceFit, status: item.status }]));
  const metrics = buildHomeMetrics(performance);

  return (
    <KairoProductShell brandId={brand.id} workspaceId={workspace.id} active="Home">
      <main id="kairo-main-content" tabIndex={-1} className={styles.home}>
        <h1 className={styles.srOnly}>Home</h1>

        {params.notice ? <p className={styles.notice} role="status">{params.notice}</p> : null}
        {params.error ? <p className={`${styles.notice} ${styles.error}`} role="alert">{params.error}</p> : null}

        <section className={styles.attentionSection} aria-label="Needs attention">
          {attention ? (
            <article className={styles.attentionCard}>
              <div className={styles.attentionLabel}><KairoIcon name="warning" /><span>Needs attention</span></div>
              <div className={styles.attentionCopy}>
                <h2>{attention.title}</h2>
                <p>{attention.detail}</p>
              </div>
              <Link className={styles.retryButton} href={attention.href}>{attention.actionLabel}</Link>
              <Link className={styles.attentionChevron} href={attention.href} aria-label={`${attention.actionLabel}: ${attention.title}`}><KairoIcon name="chevron" /></Link>
            </article>
          ) : (
            <article className={`${styles.attentionCard} ${styles.attentionClear}`}>
              <div className={styles.attentionLabel}><KairoIcon name="shield" /><span>All clear</span></div>
              <div className={styles.attentionCopy}><h2>Nothing needs you right now.</h2><p>Kairo will surface the next blocker here when your input is required.</p></div>
            </article>
          )}
        </section>

        <section id="my-idea" className={styles.ideaSection} aria-labelledby="home-my-idea-title">
          <div className={styles.sectionHeading}>
            <h2 id="home-my-idea-title">My idea</h2>
            <p>Share your thought and let Kairo recommend the best format.</p>
          </div>
          <MyIdeaComposer brandId={brand.id} initialText={params.idea ?? ""} />
        </section>

        <section className={styles.forYouSection} aria-labelledby="home-for-you-title">
          <div className={styles.sectionHeadingRow}>
            <div className={styles.sectionHeading}>
              <h2 id="home-for-you-title">For you</h2>
              <p>Smart recommendations based on your brand and goals.</p>
            </div>
            <span className={styles.viewAll}>View all <KairoIcon name="chevron" /></span>
          </div>

          {forYou.length ? (
            <>
              <div className={styles.recommendationRail}>
                {forYou.map((item) => <RecommendationCard key={item.id} item={item} scores={scores.get(item.id)} workspaceId={workspace.id} brandId={brand.id} />)}
              </div>
              <div className={styles.railProgress} aria-hidden="true"><span /></div>
            </>
          ) : (
            <div className={styles.compactEmpty}><strong>No recommendation is ready yet.</strong><span>Use My idea while Kairo gathers enough signal to rank suggestions.</span></div>
          )}
        </section>

        <section className={styles.workingSection} aria-labelledby="home-working-title">
          <div className={styles.workingHeadingRow}>
            <div className={styles.sectionHeading}>
              <h2 id="home-working-title">What&apos;s working</h2>
              <p>A quick pulse of your content performance.</p>
            </div>
            <label className={styles.periodControl}>
              <span className={styles.srOnly}>Performance period</span>
              <select disabled aria-label="Performance period"><option>Last 7 days</option></select>
            </label>
          </div>
          <div className={styles.metricGrid} aria-label="Latest available Brand performance">
            {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
          </div>
        </section>
      </main>
    </KairoProductShell>
  );
}

function RecommendationCard({ item, scores, workspaceId, brandId }: { item: HomeForYouItem; scores?: RecommendationScores; workspaceId: string; brandId: string }) {
  const format = item.format ? formatLabel(item.format) : "Idea";
  const tone = item.format === "reel" ? "reel" : item.format === "image" ? "post" : "carousel";
  return (
    <article className={styles.recommendationCard}>
      <div className={styles.recommendationThumb} data-tone={tone} aria-label="Recommendation preview unavailable">
        <KairoIcon name={item.format === "reel" ? "video" : "image"} />
        <span className={styles.formatPill}>{format}</span>
        <button className={styles.bookmarkButton} type="button" disabled aria-label={`Save recommendation: ${item.title}`} aria-pressed={scores?.status === "saved"}><KairoIcon name="bookmark" /></button>
      </div>
      <div className={styles.recommendationBody}>
        <h3>{item.title}</h3>
        <p>{item.reason}</p>
        <div className={styles.indicators}>
          <span data-tone={impactTone(scores?.overall)}><KairoIcon name="eye" />{scores ? impactLabel(scores.overall) : "Impact"}</span>
          <span data-tone="fit">{scores ? fitLabel(scores.audienceFit) : "Fit"}</span>
        </div>
        <Link className={styles.useIdeaLink} href={seedIdeaHref(workspaceId, brandId, item.title)} aria-label={`Use idea: ${item.title}`} />
      </div>
    </article>
  );
}

function MetricCard({ metric }: { metric: HomeMetric }) {
  return (
    <article className={styles.metricCard}>
      <span>{metric.label}</span>
      <strong>{metric.value === undefined ? "—" : formatNumber(metric.value)}</strong>
      <div className={styles.metricTrendPlaceholder} aria-hidden="true" />
    </article>
  );
}

function buildHomeMetrics(metrics: PerformanceMetricView[]): HomeMetric[] {
  return [
    { label: "Reach", names: ["reach"] },
    { label: "Saves", names: ["saves", "saved"] },
    { label: "Shares", names: ["shares", "shared"] },
    { label: "Engagement rate", names: ["engagement rate", "engagement_rate", "engagement-rate"] },
  ].map(({ label, names }) => {
    const metric = metrics.filter((item) => item.status === "available" && typeof item.value === "number").filter((item) => names.includes(item.name.trim().toLowerCase())).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0];
    return { label: label as HomeMetric["label"], ...(metric ? { value: metric.value } : {}) };
  });
}

function seedIdeaHref(workspaceId: string, brandId: string, idea: string) {
  const query = new URLSearchParams({ workspace: workspaceId, brand: brandId, idea });
  return `/?${query.toString()}#my-idea`;
}
function formatLabel(format: HomeCreationFormat) { return format === "image" ? "Post" : format.charAt(0).toUpperCase() + format.slice(1); }
function impactTone(value?: number) { if (value === undefined) return "neutral"; const n = value <= 1 ? value * 100 : value; return n >= 75 ? "high" : n >= 50 ? "medium" : "neutral"; }
function impactLabel(value: number) { const n = value <= 1 ? value * 100 : value; return n >= 75 ? "High impact" : n >= 50 ? "Medium impact" : "Impact"; }
function fitLabel(value: number) { const n = value <= 1 ? value * 100 : value; return n >= 80 ? "Best match" : n >= 60 ? "Great fit" : "Good fit"; }
function formatNumber(value: number) { if (!Number.isFinite(value)) return "—"; return new Intl.NumberFormat("en", { notation: Math.abs(value) >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value); }
