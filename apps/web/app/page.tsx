import Link from "next/link";
import { redirect } from "next/navigation";
import { KairoProductShell } from "./kairo-product-shell";
import { KairoIcon } from "./kairo-icons";
import { MyIdeaComposer } from "./my-idea-composer";
import {
  getBrandNotifications,
  getBrands,
  getChannelAccounts,
  getLearnings,
  getOpportunities,
  getPerformance,
  getSession,
} from "../src/lib/kairo-api";
import {
  buildAttentionItems,
  buildForYou,
  buildWhatsWorking,
  type HomeForYouItem,
  type HomeKpi,
} from "../src/lib/home-intelligence";
import styles from "./home-frozen.module.css";

type SearchParams = Promise<{
  workspace?: string;
  brand?: string;
  notice?: string;
  error?: string;
  idea?: string;
}>;

const WORKING_METRICS = ["Reach", "Saves", "Shares", "Engagement rate"] as const;

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
      <KairoProductShell workspaceId={workspace.id} active="Home" pageLabel="Home">
        <main id="kairo-main-content" tabIndex={-1} className={`${styles.home} workspace-main`}>
          <header className={styles.pageHeader}>
            <h1>Home</h1>
            <p>What needs you, what to create next, and what Kairo is handling.</p>
          </header>
          <section className={styles.emptyBrand}>
            <p className="eyebrow">First step</p>
            <h2>Give Kairo a Brand to learn from.</h2>
            <p>One public Brand URL is enough to start building useful context.</p>
            <Link className="primary-button" href={`/brands/new?workspace=${encodeURIComponent(workspace.id)}`}>Add Brand</Link>
          </section>
        </main>
      </KairoProductShell>
    );
  }

  const [opportunities, performance, learnings, notificationResult, channelResult] = await Promise.all([
    getOpportunities(brand.id).catch(() => []),
    getPerformance(brand.id).catch(() => []),
    getLearnings(brand.id).catch(() => []),
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
  });
  const forYou = buildForYou(opportunities);
  const working = buildWhatsWorking(performance, learnings);

  return (
    <KairoProductShell brandId={brand.id} workspaceId={workspace.id} active="Home" pageLabel="Home">
      <main id="kairo-main-content" tabIndex={-1} className={`${styles.home} workspace-main`}>
        <header className={styles.pageHeader}>
          <h1>Home</h1>
          <p>What needs you, what to create next, and what Kairo is handling.</p>
        </header>

        {params.notice ? <p className="notice success" role="status">{params.notice}</p> : null}
        {params.error ? <p className="notice error" role="alert">{params.error}</p> : null}

        <section className={styles.section} aria-labelledby="home-attention-title">
          <SectionHeading
            title="Needs attention"
            detail="Only the most important thing Kairo cannot finish without you."
            id="home-attention-title"
          />
          {attention[0] ? (
            <article className={styles.attentionCard}>
              <div className={styles.attentionCopy}>
                <div className={styles.attentionTopline}><span className={styles.statusDot} /><span>Needs you</span></div>
                <h3>{attention[0].title}</h3>
                <p>{attention[0].detail}</p>
              </div>
              <Link className="primary-button" href={attention[0].href}>{attention[0].actionLabel}</Link>
            </article>
          ) : (
            <div className={styles.allClear}>
              <KairoIcon name="check" />
              <span>Nothing needs your attention right now.</span>
            </div>
          )}
        </section>

        <section id="my-idea" className={styles.section} aria-labelledby="home-my-idea-title">
          <SectionHeading
            title="My idea"
            detail="Give Kairo the thought. It will recommend the best format before creating anything."
            id="home-my-idea-title"
          />
          <MyIdeaComposer brandId={brand.id} initialText={params.idea ?? ""} />
        </section>

        <section className={styles.section} aria-labelledby="home-for-you-title">
          <SectionHeading
            title="For you"
            detail="Ideas ranked for this Brand using the signals Kairo can currently verify."
            id="home-for-you-title"
            action={<Link className={styles.sectionAction} href={`/brands/${encodeURIComponent(brand.id)}/discover`}>View all</Link>}
          />
          {forYou.length ? (
            <div className={styles.cardsViewport}>
              <div className={styles.recommendationGrid}>
                {forYou.map((item) => (
                  <RecommendationCard key={item.id} item={item} workspaceId={workspace.id} brandId={brand.id} />
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <strong>No recommendations yet.</strong>
              <p>Kairo will show ranked ideas here when it has enough current Brand signal to make a useful recommendation.</p>
            </div>
          )}
        </section>

        <section className={styles.section} aria-labelledby="home-working-title">
          <SectionHeading
            title="What’s working"
            detail="Real performance only. Metrics remain unavailable until a connected channel returns them."
            id="home-working-title"
            action={<Link className={styles.sectionAction} href={`/brands/${encodeURIComponent(brand.id)}/performance`}>View Results</Link>}
          />
          <div className={styles.workingPanel}>
            <div className={styles.workingToolbar}>
              <label>
                <span className="sr-only">Performance period</span>
                <select className={styles.periodSelect} aria-label="Performance period" disabled defaultValue="latest">
                  <option value="latest">Latest available</option>
                </select>
              </label>
            </div>
            <div className={styles.metrics} aria-label="Latest available Brand performance">
              {WORKING_METRICS.map((name) => {
                const metric = findMetric(working.kpis, name);
                return (
                  <div className={styles.metric} key={name}>
                    <span className={styles.metricLabel}>{name}</span>
                    {metric ? (
                      <>
                        <strong>{formatMetric(name, metric.value)}</strong>
                        <small>Latest observed</small>
                      </>
                    ) : (
                      <>
                        <strong className={styles.noMetric}>—</strong>
                        <small>No data yet</small>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </KairoProductShell>
  );
}

function SectionHeading({
  title,
  detail,
  id,
  action,
}: {
  title: string;
  detail?: string;
  id: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.sectionHeading}>
      <div className={styles.sectionHeadingCopy}>
        <h2 id={id}>{title}</h2>
        {detail ? <p>{detail}</p> : null}
      </div>
      {action}
    </div>
  );
}

function RecommendationCard({
  item,
  workspaceId,
  brandId,
}: {
  item: HomeForYouItem;
  workspaceId: string;
  brandId: string;
}) {
  const format = item.format ? formatLabel(item.format) : "Idea";
  return (
    <article className={styles.recommendationCard}>
      <div className={styles.cardMedia}>
        <KairoIcon name={item.format === "reel" ? "video" : "photo"} />
        <span className={styles.formatBadge}>{format}</span>
        <button className={styles.bookmarkButton} type="button" disabled title="Saving recommendations is not configured yet" aria-label={`Save ${item.title}`}>
          <KairoIcon name="bookmark" />
        </button>
      </div>
      <div className={styles.cardBody}>
        <h3>{item.title}</h3>
        <p>{item.reason}</p>
        <div className={styles.cardSignals}>
          <span>Impact {normaliseScore(item.strength)}/100</span>
          <span>Fit {item.format ? format : "To explore"}</span>
        </div>
        <Link className={styles.cardAction} href={seedIdeaHref(workspaceId, brandId, item.title)}>
          Use idea <KairoIcon name="arrow-right" />
        </Link>
      </div>
    </article>
  );
}

function seedIdeaHref(workspaceId: string, brandId: string, idea: string) {
  const query = new URLSearchParams({ workspace: workspaceId, brand: brandId, idea });
  return `/?${query.toString()}#my-idea`;
}

function formatLabel(format: "carousel" | "reel" | "image") {
  return format === "image" ? "Post" : format.charAt(0).toUpperCase() + format.slice(1);
}

function normaliseScore(value: number) {
  const score = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function findMetric(metrics: HomeKpi[], name: (typeof WORKING_METRICS)[number]) {
  const aliases = name === "Engagement rate" ? ["Engagement rate", "Engagement"] : [name];
  return metrics.find((metric) => aliases.some((alias) => metric.name.toLowerCase() === alias.toLowerCase()));
}

function formatMetric(name: (typeof WORKING_METRICS)[number], value: number) {
  if (name === "Engagement rate") {
    const percentage = Math.abs(value) <= 1 ? value * 100 : value;
    return `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(percentage)}%`;
  }
  return new Intl.NumberFormat("en", { notation: value >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}
