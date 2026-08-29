import Link from "next/link";
import { redirect } from "next/navigation";
import { KairoProductShell } from "./kairo-product-shell";
import { KairoIcon } from "./kairo-icons";
import { MyIdeaComposer } from "./my-idea-composer";
import { ForYouCreateAction } from "./for-you-create-action";
import { ForYouRecommendationsAction } from "./for-you-recommendations-action";
import { ForYouBookmarkAction } from "./for-you-bookmark-action";
import { RecommendationSeen } from "./recommendation-seen";
import { ForYouBatchAction } from "./for-you-batch-action";
import { ForYouSelectCheckbox } from "./for-you-select-checkbox";
import { RecommendationRail } from "./recommendation-rail";
import { HomeFormatPicker } from "./home-format-picker";
import {
  getBrandNotifications,
  getBrands,
  getChannelAccounts,
  getCampaigns,
  getIdeas,
  getOpportunities,
  getPerformance,
  getSession,
  type PerformanceMetricView,
} from "../src/lib/kairo-api";
import { getBrandPresenter } from "../src/lib/presenter-api";
import { homeFormatLabel, type HomeCreationFormat } from "../src/lib/home-creation-format";
import {
  buildAttentionItems,
  buildForYou,
  type HomeForYouItem,
  buildContinue,
} from "../src/lib/home-intelligence";
import styles from "./home-vs85.module.css";

type SearchParams = Promise<{ workspace?: string; brand?: string; notice?: string; error?: string; idea?: string; format?: HomeCreationFormat }>;
type RecommendationScores = { overall: number; audienceFit: number; status: string };
type HomeMetric = { label: "Reach" | "Saves" | "Shares" | "Engagement rate"; value?: number };
type EligiblePresenter = { id: string; displayName: string; mode: string };

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?returnTo=/");
  if (session.workspaces.length === 0) redirect("/onboarding");

  const params = await searchParams;
  const selectedFormat = ["image", "reel", "carousel", "video"].includes(params.format ?? "") ? params.format : undefined;
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

  const [opportunities, performance, notificationResult, channelResult, presenterResult, campaigns, ideas] = await Promise.all([
    getOpportunities(brand.id).catch(() => []),
    getPerformance(brand.id).catch(() => []),
    getBrandNotifications(brand.id).catch(() => ({ brandId: brand.id, items: [] })),
    getChannelAccounts(brand.id).then((items) => ({ available: true as const, items })).catch(() => ({ available: false as const, items: [] })),
    getBrandPresenter(brand.id).catch(() => null),
    getCampaigns(brand.id).catch(() => []),
    getIdeas(brand.id).catch(() => []),
  ]);

  const hasConnectedChannel = channelResult.available ? channelResult.items.some((channel) => channel.status === "connected") : true;
  const attention = buildAttentionItems({ brandId: brand.id, notifications: notificationResult.items, hasConnectedChannel })[0];
  const forYou = buildForYou(opportunities).slice(0, 6);
  const featured = (selectedFormat ? forYou.filter((item) => recommendationFormat(item) === selectedFormat) : forYou)[0] ?? forYou[0];
  const continueItems = buildContinue(brand.id, campaigns, ideas);
  const scores = new Map<string, RecommendationScores>(opportunities.map((item) => [item.id, { overall: item.scores.overall, audienceFit: item.scores.audienceFit, status: item.status }]));
  const metrics = buildHomeMetrics(performance);
  const eligiblePresenter: EligiblePresenter | undefined = presenterResult?.presenter && presenterResult.eligibility?.status === "eligible"
    ? { id: presenterResult.presenter.id, displayName: presenterResult.presenter.displayName, mode: presenterResult.presenter.mode }
    : undefined;

  return (
    <KairoProductShell brandId={brand.id} workspaceId={workspace.id} active="Home">
      <main id="kairo-main-content" tabIndex={-1} className={styles.home}>
        <header className={styles.homeHero}><p className={styles.eyebrow}>Kairo workspace</p><h1>What should we create next?</h1><p>Choose a direction and Kairo will find the strongest opportunity for your Brand.</p><HomeFormatPicker selected={selectedFormat} /></header>

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

        {featured ? <section className={styles.featuredSection} aria-labelledby="home-featured-title">
          <div className={styles.featuredHeading}><div><p className={styles.eyebrow}>Kairo recommends</p><h2 id="home-featured-title">{selectedFormat ? `A strong ${selectedFormat === "image" ? "post" : selectedFormat} opportunity for your Brand` : "A promising opportunity for your Brand"}</h2></div><span className={styles.trendingBadge}>Trending</span><span className={styles.fitBadge}>Great fit</span></div>
          <div className={styles.featuredCard}><div className={styles.featuredVisual}><KairoIcon name={recommendationFormat(featured) === "reel" || recommendationFormat(featured) === "video" ? "video" : "image"} /><span>{homeFormatLabel(recommendationFormat(featured))}</span></div><div className={styles.featuredCopy}><h3>{featured.title}</h3><p>{featured.reason}</p><div className={styles.featuredWhy}><strong>Why this fits your Brand</strong><span>{featured.direction}</span></div><div className={styles.featuredActions}><ForYouCreateAction brandId={brand.id} opportunityId={featured.id} title={featured.title} direction={featured.direction} initialFormat={recommendationFormat(featured)} eligiblePresenter={eligiblePresenter} /><Link className={styles.secondaryAction} href={`/brands/${encodeURIComponent(brand.id)}/opportunities/${encodeURIComponent(featured.id)}`}>View details</Link></div></div></div>
        </section> : null}

        <section id="my-idea" className={styles.ideaSection} aria-labelledby="home-my-idea-title">
          <div className={styles.sectionHeading}>
            <h2 id="home-my-idea-title">Your Idea</h2>
            <p>Add your idea, link or media. Kairo selects a format automatically and you can change it.</p>
          </div>
          <MyIdeaComposer brandId={brand.id} initialText={params.idea ?? ""} eligiblePresenter={eligiblePresenter} />
        </section>

        <section className={styles.forYouSection} aria-labelledby="home-discover-title">
          <div className={styles.sectionHeading}>
            <h2 id="home-discover-title">Discover</h2>
            <p>Smart recommendations based on your brand and goals.</p>
          </div>
          <div className={styles.sectionActionRow} aria-label="Discover actions">
            <ForYouBatchAction brandId={brand.id} items={forYou} />
            <ForYouRecommendationsAction brandId={brand.id} hasRecommendations={forYou.length > 0} />
            <Link className={styles.viewAll} href={`/brands/${encodeURIComponent(brand.id)}/discover`}>View all</Link>
          </div>

          {forYou.length ? (
            <>
              <RecommendationRail count={forYou.length}>
                {forYou.map((item) => <RecommendationCard key={item.id} item={item} scores={scores.get(item.id)} brandId={brand.id} eligiblePresenter={eligiblePresenter} />)}
              </RecommendationRail>
            </>
          ) : (
            <div className={styles.compactEmpty}><strong>No recommendation is ready yet.</strong><span>Use Your Idea or ask Kairo to find worthwhile opportunities for this Brand.</span></div>
          )}
        </section>

        {continueItems.length ? <section className={styles.continueSection} aria-labelledby="home-continue-title"><div className={styles.sectionHeading}><h2 id="home-continue-title">Continue</h2><p>Your unfinished ideas and drafts.</p></div><div className={styles.sectionActionRow} aria-label="Continue actions"><Link className={styles.viewAll} href={`/brands/${encodeURIComponent(brand.id)}/content`}>View all</Link></div><div className={styles.continueGrid}>{continueItems.map((item) => <Link className={styles.continueCard} key={`${item.kind}:${item.id}`} href={item.href}><strong>{item.title}</strong><span>{item.context}</span><small>{item.actionLabel} →</small></Link>)}</div></section> : null}

        <section className={styles.workingSection} aria-labelledby="home-working-title">
          <div className={styles.sectionHeading}>
            <h2 id="home-working-title">What&apos;s working</h2>
            <p>A quick pulse of your content performance.</p>
          </div>
          <div className={styles.sectionActionRow} aria-label="Performance actions">
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

function RecommendationCard({ item, scores, brandId, eligiblePresenter }: { item: HomeForYouItem; scores?: RecommendationScores; brandId: string; eligiblePresenter?: EligiblePresenter }) {
  const format = recommendationFormat(item);
  const tone = format === "reel" || format === "video" ? "reel" : format === "image" ? "post" : "carousel";
  return (
    <article className={styles.recommendationCard}>
      <RecommendationSeen brandId={brandId} opportunityId={item.id} />
      <ForYouSelectCheckbox id={item.id} title={item.title} />
      <div className={styles.recommendationThumb} data-tone={tone} aria-label={`${homeFormatLabel(format)} recommendation`}>
        <KairoIcon name={format === "reel" || format === "video" ? "video" : "image"} />
        <span className={styles.formatPill}>{homeFormatLabel(format)}</span>
        <ForYouBookmarkAction brandId={brandId} opportunityId={item.id} saved={scores?.status === "saved"} />
      </div>
      <div className={styles.recommendationBody}>
        <h3><Link href={`/brands/${encodeURIComponent(brandId)}/opportunities/${encodeURIComponent(item.id)}`}>{item.title}</Link></h3>
        <p>{item.reason}</p>
        <div className={styles.indicators}>
          <span data-tone={impactTone(scores?.overall)}><KairoIcon name="eye" />{scores ? impactLabel(scores.overall) : "Impact"}</span>
          <span data-tone="fit">{scores ? fitLabel(scores.audienceFit) : "Fit"}</span>
        </div>
        <ForYouCreateAction brandId={brandId} opportunityId={item.id} title={item.title} direction={item.direction} initialFormat={format} eligiblePresenter={eligiblePresenter} />
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

function recommendationFormat(item: HomeForYouItem): HomeCreationFormat {
  const value = `${item.title} ${item.direction}`.toLowerCase();
  if (/\b(video|youtube|long-form|long form)\b/.test(value) && !/\b(reel|short-form|short form)\b/.test(value)) return "video";
  if (item.format === "reel" || /\b(reel|short-form|short form|voiceover|motion|demo)\b/.test(value)) return "reel";
  if (item.format === "carousel" || /\b(carousel|slides?|listicle|steps?|breakdown)\b/.test(value)) return "carousel";
  return "image";
}
function impactTone(value?: number) { if (value === undefined) return "neutral"; const n = value <= 1 ? value * 100 : value; return n >= 75 ? "high" : n >= 50 ? "medium" : "neutral"; }
function impactLabel(value: number) { const n = value <= 1 ? value * 100 : value; return n >= 75 ? "High impact" : n >= 50 ? "Medium impact" : "Impact"; }
function fitLabel(value: number) { const n = value <= 1 ? value * 100 : value; return n >= 80 ? "Best match" : n >= 60 ? "Great fit" : "Good fit"; }
function formatNumber(value: number) { if (!Number.isFinite(value)) return "—"; return new Intl.NumberFormat("en", { notation: Math.abs(value) >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value); }
