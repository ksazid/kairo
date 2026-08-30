import Link from "next/link";
import { redirect } from "next/navigation";
import { KairoProductShell } from "./kairo-product-shell";
import { KairoIcon } from "./kairo-icons";
import { ForYouCreateAction } from "./for-you-create-action";
import { HomeFormatPicker } from "./home-format-picker";
import { HomeViralLink } from "./home-viral-link";
import {
  getBrands,
  getCampaigns,
  getIdeas,
  getOpportunities,
  getSession,
} from "../src/lib/kairo-api";
import { getBrandPresenter } from "../src/lib/presenter-api";
import { homeFormatLabel, type HomeCreationFormat } from "../src/lib/home-creation-format";
import {
  buildForYou,
  type HomeForYouItem,
  buildContinue,
} from "../src/lib/home-intelligence";
import styles from "./home-approved.module.css";

type SearchParams = Promise<{ workspace?: string; brand?: string; notice?: string; error?: string; idea?: string; format?: HomeCreationFormat | "campaign" }>;
type RecommendationScores = { overall: number; audienceFit: number; status: string };
type EligiblePresenter = { id: string; displayName: string; mode: string };

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?returnTo=/");
  if (session.workspaces.length === 0) redirect("/onboarding");

  const params = await searchParams;
  const selectedFormat = ["image", "reel", "carousel", "video", "campaign"].includes(params.format ?? "") ? params.format : undefined;
  const selectedCreationFormat = selectedFormat === "campaign" ? undefined : selectedFormat;
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

  const [opportunities, presenterResult, campaigns, ideas] = await Promise.all([
    getOpportunities(brand.id).catch(() => []),
    getBrandPresenter(brand.id).catch(() => null),
    getCampaigns(brand.id).catch(() => []),
    getIdeas(brand.id).catch(() => []),
  ]);

  const forYou = buildForYou(opportunities).slice(0, 6);
  const featured = (selectedCreationFormat ? forYou.filter((item) => recommendationFormat(item) === selectedCreationFormat) : forYou)[0] ?? forYou[0];
  const continueItems = buildContinue(brand.id, campaigns, ideas);
  const scores = new Map<string, RecommendationScores>(opportunities.map((item) => [item.id, { overall: item.scores.overall, audienceFit: item.scores.audienceFit, status: item.status }]));
  const eligiblePresenter: EligiblePresenter | undefined = presenterResult?.presenter && presenterResult.eligibility?.status === "eligible"
    ? { id: presenterResult.presenter.id, displayName: presenterResult.presenter.displayName, mode: presenterResult.presenter.mode }
    : undefined;

  return (
    <KairoProductShell brandId={brand.id} workspaceId={workspace.id} active="Home">
      <main id="kairo-main-content" tabIndex={-1} className={styles.home}>
        <header className={styles.homeHero}><p className={styles.eyebrow}>Kairo workspace</p><h1>What should we create next?</h1><p>Choose a direction and Kairo will find the strongest opportunity for your Brand.</p><HomeFormatPicker selected={selectedFormat} /></header>

        <HomeViralLink brandId={brand.id} />

        {params.notice ? <p className={styles.notice} role="status">{params.notice}</p> : null}
        {params.error ? <p className={`${styles.notice} ${styles.error}`} role="alert">{params.error}</p> : null}

        {featured ? <section className={styles.featuredSection} aria-labelledby="home-featured-title">
          <div className={styles.featuredHeading}><div><p className={styles.eyebrow}>Kairo recommends</p><h2 id="home-featured-title">{selectedFormat ? `A strong ${selectedFormat === "image" ? "post" : selectedFormat} opportunity for your Brand` : "A promising opportunity for your Brand"}</h2></div><span className={styles.trendingBadge}>Trending</span><span className={styles.fitBadge}>Great fit</span></div>
          <div className={styles.featuredCard}><Link className={styles.featuredVisual} href={`/brands/${encodeURIComponent(brand.id)}/opportunities/${encodeURIComponent(featured.id)}`} aria-label={`View ${featured.title}`}><KairoIcon name={recommendationFormat(featured) === "reel" || recommendationFormat(featured) === "video" ? "video" : "image"} /><strong>{featured.title}</strong><span>Concept preview · not generated content</span></Link><div className={styles.featuredCopy}><Link href={`/brands/${encodeURIComponent(brand.id)}/opportunities/${encodeURIComponent(featured.id)}`}><h3>{selectedFormat === "campaign" ? "Turn this opportunity into a campaign" : featured.title}</h3></Link><p>{selectedFormat === "campaign" ? "Plan a coordinated set of posts, reels and carousels around one clear goal." : featured.reason}</p><div className={styles.featuredWhy}><strong>{selectedFormat === "campaign" ? "Why campaigns help" : "Why this fits your Brand"}</strong><span>{selectedFormat === "campaign" ? "Kairo keeps the message, formats and schedule connected." : featured.direction}</span></div><div className={styles.featuredActions}>{selectedFormat === "campaign" ? <Link className={styles.primaryAction} href={`/brands/${encodeURIComponent(brand.id)}/campaigns?from=home`}>Open Campaign workspace</Link> : <ForYouCreateAction brandId={brand.id} opportunityId={featured.id} title={featured.title} direction={featured.direction} initialFormat={recommendationFormat(featured)} eligiblePresenter={eligiblePresenter} />}<Link className={styles.secondaryAction} href={`/brands/${encodeURIComponent(brand.id)}/opportunities/${encodeURIComponent(featured.id)}`}>View details</Link></div></div><aside className={styles.featuredMeta}><span>Recommended format</span><strong><KairoIcon name={recommendationFormat(featured) === "reel" ? "video" : "image"} /> {selectedFormat === "campaign" ? "Campaign" : homeFormatLabel(recommendationFormat(featured))}</strong><hr/><span>Brand fit</span><strong>{scores.get(featured.id) ? `${Math.round(scores.get(featured.id)!.audienceFit * 100)}% · Great fit` : "Great fit"}</strong><span>Source</span><small>Trend and public evidence</small></aside></div>
        </section> : null}

        <section className={styles.homeBottomGrid} aria-label="Continue, learning and discovery">
          <article className={styles.bottomPanel}><div className={styles.bottomHeading}><h2>Continue working</h2><Link href={`/brands/${encodeURIComponent(brand.id)}/content`}>View all</Link></div><div className={styles.continueList}>{continueItems.slice(0,2).map(item => <Link className={styles.continueRow} key={`${item.kind}:${item.id}`} href={item.href}><span className={styles.mockThumb} aria-hidden="true"/><span><small>DRAFT</small><strong>{item.title}</strong><em>{item.context}</em></span><KairoIcon name="more" /></Link>)}{continueItems.length === 0 ? <p className={styles.emptyBottom}>No drafts yet.</p> : null}</div></article>
          <article className={styles.bottomPanel}><div className={styles.bottomHeading}><h2>What Kairo learned</h2></div><div className={styles.learningBody}><KairoIcon name="sparkles" /><p>Your audience engages most with practical advice and local tips.</p><small>Keep creating helpful, save-worthy content that solves real problems.</small></div><Link className={styles.panelLink} href={`/brands/${encodeURIComponent(brand.id)}/insights`}>See all insights →</Link></article>
          <article className={`${styles.bottomPanel} ${styles.discoverPanel}`}><div className={styles.bottomHeading}><h2>Discover more</h2><Link href={`/brands/${encodeURIComponent(brand.id)}/discover`}>View all</Link></div><div className={styles.discoverMiniRail}>{forYou.slice(0, 3).map((item,index) => <Link className={styles.discoverMini} data-image={index + 1} key={`more-${item.id}`} href={`/brands/${encodeURIComponent(brand.id)}/opportunities/${encodeURIComponent(item.id)}`}><span className={styles.miniBadges}><small>Trending</small><small>Great fit</small></span><strong>{item.title}</strong><em>{homeFormatLabel(recommendationFormat(item))} · High opportunity</em></Link>)}</div></article>
        </section>
      </main>
    </KairoProductShell>
  );
}

function recommendationFormat(item: HomeForYouItem): HomeCreationFormat {
  const value = `${item.title} ${item.direction}`.toLowerCase();
  if (/\b(video|youtube|long-form|long form)\b/.test(value) && !/\b(reel|short-form|short form)\b/.test(value)) return "video";
  if (item.format === "reel" || /\b(reel|short-form|short form|voiceover|motion|demo)\b/.test(value)) return "reel";
  if (item.format === "carousel" || /\b(carousel|slides?|listicle|steps?|breakdown)\b/.test(value)) return "carousel";
  return "image";
}
