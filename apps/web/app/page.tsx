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

type SearchParams = Promise<{
  workspace?: string;
  brand?: string;
  notice?: string;
  error?: string;
  idea?: string;
}>;

type RecommendationScores = {
  overall: number;
  audienceFit: number;
  status: string;
};

type HomeMetric = {
  label: "Reach" | "Saves" | "Shares" | "Engagement rate";
  value?: number;
  capturedAt?: string;
};

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
        <main id="kairo-main-content" tabIndex={-1} className={`${styles.home} workspace-main`}>
          <header className={styles.header}>
            <h1>Home</h1>
            <p>What needs you, what to create next, and what Kairo is handling.</p>
          </header>
          <section className={styles.emptyBrand}>
            <span className={styles.sectionLabel}>First step</span>
            <h2>Give Kairo something to learn from.</h2>
            <p>One public Brand URL is enough to start.</p>
            <Link className="primary-button" href={`/brands/new?workspace=${encodeURIComponent(workspace.id)}`}>Add Brand</Link>
          </section>
        </main>
      </KairoProductShell>
    );
  }

  const [opportunities, performance, notificationResult, channelResult] = await Promise.all([
    getOpportunities(brand.id).catch(() => []),
    getPerformance(brand.id).catch(() => []),
    getBrandNotifications(brand.id).catch(() => ({ brandId: brand.id, items: [] })),
    getChannelAccounts(brand.id)
      .then((items) => ({ available: true as const, items }))
      .catch(() => ({ available: false as const, items: [] })),
  ]);

  const hasConnectedChannel = channelResult.available
    ? channelResult.items.some((channel) => channel.status === "connected")
    : true;
  const attention = buildAttentionItems({
    brandId: brand.id,
    notifications: notificationResult.items,
    hasConnectedChannel,
  })[0];
  const forYou = buildForYou(opportunities);
  const recommendationScores = new Map<string, RecommendationScores>(
    opportunities.map((item) => [
      item.id,
      {
        overall: item.scores.overall,
        audienceFit: item.scores.audienceFit,
        status: item.status,
      },
    ]),
  );
  const metrics = buildHomeMetrics(performance);

  return (
    <KairoProductShell brandId={brand.id} workspaceId={workspace.id} active="Home">
      <main id="kairo-main-content" tabIndex={-1} className={`${styles.home} workspace-main`}>
        <header className={styles.header}>
          <h1>Home</h1>
          <p>What needs you, what to create next, and what Kairo is handling.</p>
        </header>

        {params.notice ? <p className="notice success" role="status">{params.notice}</p> : null}
        {params.error ? <p className="notice error" role="alert">{params.error}</p> : null}

        <section className={`${styles.section} ${styles.attentionSection}`} aria-labelledby="home-attention-title">
          <SectionHeading label="Needs Attention" title="The one thing that needs you now." id="home-attention-title" />
          {attention ? (
            <article className={styles.attentionCard}>
              <div>
                <span className={styles.statusPill}>Needs you</span>
                <h3>{attention.title}</h3>
                <p>{attention.detail}</p>
              </div>
              <Link className="primary-button" href={attention.href}>{attention.actionLabel}</Link>
            </article>
          ) : (
            <div className={styles.quietState} role="status">
              <strong>Nothing needs you right now.</strong>
              <span>Kairo will surface the next blocker here when your input is required.</span>
            </div>
          )}
        </section>

        <section id="my-idea" className={`${styles.section} ${styles.ideaSection}`} aria-labelledby="home-my-idea-title">
          <SectionHeading
            label="My Idea"
            title="Have something in mind?"
            id="home-my-idea-title"
            detail="Share the thought or source. Kairo will recommend the strongest format before creating anything."
          />
          <MyIdeaComposer brandId={brand.id} initialText={params.idea ?? ""} />
        </section>

        <section className={`${styles.section} ${styles.forYouSection}`} aria-labelledby="home-for-you-title">
          <div className={styles.sectionHeadingRow}>
            <SectionHeading
              label="For You"
              title="Ideas worth creating next."
              id="home-for-you-title"
              detail="Ranked from current Brand and opportunity signals."
            />
            <button className={styles.viewAllButton} type="button" disabled title="A dedicated recommendations view is not connected yet">View all</button>
          </div>

          {forYou.length ? (
            <div className={styles.recommendationRail}>
              {forYou.map((item) => (
                <RecommendationCard
                  key={item.id}
                  item={item}
                  scores={recommendationScores.get(item.id)}
                  workspaceId={workspace.id}
                  brandId={brand.id}
                />
              ))}
            </div>
          ) : (
            <div className={styles.quietState}>
              <strong>No recommendation is ready yet.</strong>
              <span>Use My Idea while Kairo gathers enough real signal to rank suggestions.</span>
            </div>
          )}
        </section>

        <section className={`${styles.section} ${styles.workingSection}`} aria-labelledby="home-working-title">
          <div className={styles.sectionHeadingRow}>
            <SectionHeading
              label="What's Working"
              title="A quick read on real performance."
              id="home-working-title"
              detail="Only observations Kairo can verify are shown."
            />
            <label className={styles.periodControl}>
              <span className={styles.srOnly}>Performance period</span>
              <select disabled aria-label="Performance period">
                <option>Last 30 days</option>
              </select>
            </label>
          </div>

          <div className={styles.metricGrid} aria-label="Latest available Brand performance">
            {metrics.map((metric) => (
              <article className={styles.metricCard} key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value === undefined ? "Unavailable" : formatNumber(metric.value)}</strong>
                <small>{metric.capturedAt ? `Observed ${formatObservedDate(metric.capturedAt)}` : "No verified observation yet"}</small>
                <div className={styles.sparklineUnavailable} aria-hidden="true" />
              </article>
            ))}
          </div>
          <div className={styles.sectionFooter}>
            <Link className={styles.textLink} href={`/brands/${encodeURIComponent(brand.id)}/performance`}>View Insights</Link>
          </div>
        </section>
      </main>
    </KairoProductShell>
  );
}

function SectionHeading({ label, title, detail, id }: { label: string; title: string; detail?: string; id: string }) {
  return (
    <div className={styles.sectionHeading}>
      <span className={styles.sectionLabel}>{label}</span>
      <h2 id={id}>{title}</h2>
      {detail ? <p>{detail}</p> : null}
    </div>
  );
}

function RecommendationCard({
  item,
  scores,
  workspaceId,
  brandId,
}: {
  item: HomeForYouItem;
  scores?: RecommendationScores;
  workspaceId: string;
  brandId: string;
}) {
  return (
    <article className={styles.recommendationCard}>
      <div className={styles.recommendationThumb} aria-label="Recommendation preview unavailable">
        <KairoIcon name={item.format === "reel" ? "video" : "image"} />
        <span>Preview unavailable</span>
      </div>
      <div className={styles.recommendationTopline}>
        <span className={styles.formatPill}>{item.format ? formatLabel(item.format) : "Idea"}</span>
        <button
          className={styles.bookmarkButton}
          type="button"
          disabled
          aria-label={scores?.status === "saved" ? `Saved recommendation: ${item.title}` : `Save recommendation: ${item.title}`}
          aria-pressed={scores?.status === "saved"}
          title="Saving from Home is not connected yet"
        >
          <KairoIcon name="bookmark" />
        </button>
      </div>
      <h3>{item.title}</h3>
      <p>{item.reason}</p>
      <div className={styles.indicators}>
        <span><b>Impact</b>{scores ? scoreLabel(scores.overall) : "Unavailable"}</span>
        <span><b>Fit</b>{scores ? scoreLabel(scores.audienceFit) : "Unavailable"}</span>
      </div>
      <Link className={styles.useIdeaLink} href={seedIdeaHref(workspaceId, brandId, item.title)}>Use idea</Link>
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
    const metric = latestAvailableMetric(metrics, names);
    return {
      label: label as HomeMetric["label"],
      ...(metric ? { value: metric.value, capturedAt: metric.capturedAt } : {}),
    };
  });
}

function latestAvailableMetric(metrics: PerformanceMetricView[], names: string[]) {
  return metrics
    .filter((metric) => metric.status === "available" && typeof metric.value === "number")
    .filter((metric) => names.includes(metric.name.trim().toLowerCase()))
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0];
}

function seedIdeaHref(workspaceId: string, brandId: string, idea: string) {
  const query = new URLSearchParams({ workspace: workspaceId, brand: brandId, idea });
  return `/?${query.toString()}#my-idea`;
}

function formatLabel(format: HomeCreationFormat) {
  return format === "image" ? "Post" : format.charAt(0).toUpperCase() + format.slice(1);
}

function scoreLabel(value: number) {
  if (!Number.isFinite(value)) return "Unavailable";
  if (value >= 0 && value <= 1) return `${Math.round(value * 100)}%`;
  return `${Math.round(value)}`;
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "Unavailable";
  return new Intl.NumberFormat("en", { notation: Math.abs(value) >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function formatObservedDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "recently";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}
