import Link from "next/link";
import { redirect } from "next/navigation";
import { KairoProductShell, KairoScopePicker } from "./kairo-product-shell";
import { MyIdeaComposer } from "./my-idea-composer";
import {
  getBrandNotifications,
  getBrands,
  getCalendar,
  getCampaigns,
  getChannelAccounts,
  getIdeas,
  getLearnings,
  getOpportunities,
  getPerformance,
  getSession,
} from "../src/lib/kairo-api";
import {
  buildAttentionItems,
  buildContinue,
  buildForYou,
  buildUpNext,
  buildWhatsWorking,
  type HomeContinueItem,
  type HomeForYouItem,
  type HomeUpNextItem,
} from "../src/lib/home-intelligence";
import styles from "./home-vs85.module.css";

type SearchParams = Promise<{
  workspace?: string;
  brand?: string;
  notice?: string;
  error?: string;
  idea?: string;
}>;

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
            <div><p className="eyebrow">Home</p><h1>Start with your Brand.</h1><p>Kairo needs one Brand before it can recommend what to create.</p></div>
            <KairoScopePicker brandName="No Brand yet" workspaceName={workspace.name} />
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

  const now = Date.now();
  const calendarFrom = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const calendarTo = new Date(now + 31 * 24 * 60 * 60 * 1000).toISOString();

  const [opportunities, campaigns, ideas, commands, performance, learnings, notificationResult, channelResult] = await Promise.all([
    getOpportunities(brand.id).catch(() => []),
    getCampaigns(brand.id).catch(() => []),
    getIdeas(brand.id).catch(() => []),
    getCalendar(brand.id, calendarFrom, calendarTo).catch(() => []),
    getPerformance(brand.id).catch(() => []),
    getLearnings(brand.id).catch(() => []),
    getBrandNotifications(brand.id).catch(() => ({ brandId: brand.id, items: [] })),
    getChannelAccounts(brand.id).then((items) => ({ available: true as const, items })).catch(() => ({ available: false as const, items: [] })),
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
  const campaignNames = new Map(campaigns.map((campaign) => [campaign.id, campaign.name]));
  const upNext = buildUpNext(commands, campaignNames, now);
  const working = buildWhatsWorking(performance, learnings);
  const scheduledOrPublishedCampaignIds = new Set(
    commands
      .filter((command) => ["scheduled", "dispatching", "published"].includes(command.status))
      .map((command) => command.campaignId),
  );
  const continueItems = buildContinue(brand.id, campaigns, ideas)
    .filter((item) => item.kind !== "campaign" || !scheduledOrPublishedCampaignIds.has(item.id))
    .slice(0, 3);

  return (
    <KairoProductShell brandId={brand.id} workspaceId={workspace.id} active="Home">
      <main id="kairo-main-content" tabIndex={-1} className={`${styles.home} workspace-main`}>
        <header className={styles.header}>
          <div>
            <p className="eyebrow">Home</p>
            <h1>{brand.name}</h1>
            <p>What needs you, what to create next, and what Kairo is handling.</p>
          </div>
          <KairoScopePicker brandName={brand.name} workspaceName={workspace.name} />
        </header>

        {params.notice ? <p className="notice success" role="status">{params.notice}</p> : null}
        {params.error ? <p className="notice error" role="alert">{params.error}</p> : null}

        {attention.length ? (
          <section className={`${styles.section} ${styles.attentionSection}`} aria-labelledby="home-attention-title">
            <SectionHeading label="Needs Attention" title="Only the things Kairo cannot finish without you." id="home-attention-title" />
            <div className={styles.attentionLayout}>
              <AttentionSpotlight item={attention[0]!} />
              {attention.length > 1 ? (
                <div className={styles.compactStack}>
                  {attention.slice(1).map((item) => (
                    <Link className={styles.attentionCompact} href={item.href} key={item.id}>
                      <div><strong>{item.title}</strong><span>{item.detail}</span></div>
                      <b>{item.actionLabel} →</b>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section id="my-idea" className={`${styles.section} ${styles.ideaSection}`} aria-labelledby="home-my-idea-title">
          <SectionHeading label="My Idea" title="Have something in mind?" id="home-my-idea-title" detail="Give Kairo the thought. It will recommend the format before it creates anything." />
          <MyIdeaComposer brandId={brand.id} initialText={params.idea ?? ""} />
        </section>

        {forYou.length ? (
          <section className={`${styles.section} ${styles.forYouSection}`} aria-labelledby="home-for-you-title">
            <SectionHeading label="For You" title="Not sure what to create? Start here." id="home-for-you-title" detail="Kairo has already ranked the strongest current ideas for this Brand." />
            <div className={styles.forYouLayout}>
              <ForYouSpotlight item={forYou[0]!} workspaceId={workspace.id} brandId={brand.id} />
              {forYou.length > 1 ? (
                <div className={styles.alternativeList}>
                  {forYou.slice(1).map((item) => <ForYouCompact key={item.id} item={item} workspaceId={workspace.id} brandId={brand.id} />)}
                </div>
              ) : null}
            </div>
            <div className={styles.sectionFooter}>
              <Link className={styles.textLink} href={`/brands/${encodeURIComponent(brand.id)}/discover`}>More ideas →</Link>
            </div>
          </section>
        ) : null}

        {upNext.length ? (
          <section className={`${styles.section} ${styles.upNextSection}`} aria-labelledby="home-up-next-title">
            <SectionHeading label="Up Next" title="What Kairo is handling next." id="home-up-next-title" />
            <div className={styles.upNextLayout}>
              <UpNextSpotlight item={upNext[0]!} brandId={brand.id} />
              {upNext.length > 1 ? (
                <div className={styles.compactStack}>
                  {upNext.slice(1).map((item) => <UpNextCompact item={item} brandId={brand.id} key={item.id} />)}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {working.kpis.length || working.learning ? (
          <section className={`${styles.section} ${styles.workingSection}`} aria-labelledby="home-working-title">
            <SectionHeading label="What's Working" title="See your growth and what's driving it." id="home-working-title" />
            {working.kpis.length ? (
              <div className={styles.kpis} aria-label="Latest available Brand performance">
                {working.kpis.map((kpi) => (
                  <div className={styles.kpi} key={kpi.name}>
                    <span>{kpi.name}</span>
                    <strong>{formatNumber(kpi.value)}</strong>
                    <small>Latest observed</small>
                  </div>
                ))}
              </div>
            ) : null}
            {working.learning ? (
              <div className={styles.learningPanel}>
                <span className={styles.sectionLabel}>What Kairo learned</span>
                <h3>{working.learning.statement}</h3>
                <p>{working.learning.interpretation}</p>
                <div className={styles.inlineActions}>
                  <Link className="primary-button" href={seedIdeaHref(workspace.id, brand.id, `Create a new piece inspired by this proven pattern: ${working.learning.statement}`)}>Create similar</Link>
                  <Link className={styles.textLink} href={`/brands/${encodeURIComponent(brand.id)}/performance`}>View Results →</Link>
                </div>
              </div>
            ) : (
              <div className={styles.sectionFooter}><Link className={styles.textLink} href={`/brands/${encodeURIComponent(brand.id)}/performance`}>View Results →</Link></div>
            )}
          </section>
        ) : null}

        {continueItems.length ? (
          <section className={`${styles.section} ${styles.continueSection}`} aria-labelledby="home-continue-title">
            <SectionHeading label="Continue" title="Pick up where you left off." id="home-continue-title" />
            <div className={styles.continueLayout}>
              <ContinueSpotlight item={continueItems[0]!} />
              {continueItems.length > 1 ? (
                <div className={styles.compactStack}>
                  {continueItems.slice(1).map((item) => <ContinueCompact item={item} key={`${item.kind}:${item.id}`} />)}
                </div>
              ) : null}
            </div>
            <div className={styles.sectionFooter}><Link className={styles.textLink} href={`/brands/${encodeURIComponent(brand.id)}/campaigns`}>View Content →</Link></div>
          </section>
        ) : null}
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

function AttentionSpotlight({ item }: { item: ReturnType<typeof buildAttentionItems>[number] }) {
  return (
    <article className={styles.attentionSpotlight}>
      <div><span className={styles.statusPill}>Needs you</span><h3>{item.title}</h3><p>{item.detail}</p></div>
      <Link className="primary-button" href={item.href}>{item.actionLabel}</Link>
    </article>
  );
}

function ForYouSpotlight({ item, workspaceId, brandId }: { item: HomeForYouItem; workspaceId: string; brandId: string }) {
  return (
    <article className={styles.forYouSpotlight}>
      <div className={styles.spotlightTopline}><span className={styles.topPick}>Top pick</span>{item.format ? <span className={styles.formatPill}>{formatLabel(item.format)}</span> : null}</div>
      <h3>{item.title}</h3>
      <p>{item.reason}</p>
      {item.direction ? <span className={styles.direction}>{item.direction}</span> : null}
      <Link className="primary-button" href={seedIdeaHref(workspaceId, brandId, item.title)}>Use idea</Link>
    </article>
  );
}

function ForYouCompact({ item, workspaceId, brandId }: { item: HomeForYouItem; workspaceId: string; brandId: string }) {
  return (
    <article className={styles.forYouCompact}>
      <div><div className={styles.compactMeta}>{item.format ? formatLabel(item.format) : "Idea"}</div><strong>{item.title}</strong><span>{item.reason}</span></div>
      <Link href={seedIdeaHref(workspaceId, brandId, item.title)} aria-label={`Use idea: ${item.title}`}>Use →</Link>
    </article>
  );
}

function UpNextSpotlight({ item, brandId }: { item: HomeUpNextItem; brandId: string }) {
  const href = item.actionLabel === "Fix" ? `/brands/${encodeURIComponent(brandId)}/calendar` : `/brands/${encodeURIComponent(brandId)}/campaigns/${encodeURIComponent(item.campaignId)}`;
  return (
    <article className={styles.upNextSpotlight}>
      <div className={styles.spotlightTopline}><span className={styles.statusPill}>{item.state}</span><span>{item.channel}</span></div>
      <h3>{item.title}</h3>
      <time dateTime={item.scheduledFor}>{formatDate(item.scheduledFor)}</time>
      <Link className="secondary-button" href={href}>{item.actionLabel}</Link>
    </article>
  );
}

function UpNextCompact({ item, brandId }: { item: HomeUpNextItem; brandId: string }) {
  const href = item.actionLabel === "Fix" ? `/brands/${encodeURIComponent(brandId)}/calendar` : `/brands/${encodeURIComponent(brandId)}/campaigns/${encodeURIComponent(item.campaignId)}`;
  return (
    <Link className={styles.upNextCompact} href={href}>
      <div><span>{item.state} · {item.channel}</span><strong>{item.title}</strong><time dateTime={item.scheduledFor}>{formatDate(item.scheduledFor)}</time></div><b>{item.actionLabel} →</b>
    </Link>
  );
}

function ContinueSpotlight({ item }: { item: HomeContinueItem }) {
  return (
    <article className={styles.continueSpotlight}>
      <div><span className={styles.statusPill}>{item.kind === "campaign" ? "Content" : "Idea"}</span><h3>{item.title}</h3><p>{item.context}</p></div>
      <Link className="secondary-button" href={item.href}>{item.actionLabel}</Link>
    </article>
  );
}

function ContinueCompact({ item }: { item: HomeContinueItem }) {
  return <Link className={styles.continueCompact} href={item.href}><div><span>{item.kind === "campaign" ? "Content" : "Idea"}</span><strong>{item.title}</strong><small>{item.context}</small></div><b>{item.actionLabel} →</b></Link>;
}

function seedIdeaHref(workspaceId: string, brandId: string, idea: string) {
  const query = new URLSearchParams({ workspace: workspaceId, brand: brandId, idea });
  return `/?${query.toString()}#my-idea`;
}

function formatLabel(format: "carousel" | "reel" | "image") {
  return format === "image" ? "Post" : format.charAt(0).toUpperCase() + format.slice(1);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Time unavailable";
  return `${new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(date)} UTC`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: Math.abs(value) >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}
