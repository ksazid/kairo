import Link from "next/link";
import { CircleAlert, Compass, FileImage, FileText, LayoutGrid, Lightbulb, Megaphone, MoreVertical, PlaySquare, RefreshCw, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { ConceptMockupPreview } from "../components/concept-mockup";
import { getHomeData } from "../lib/api";
import type { ConceptMockupView } from "../lib/concept-mockup";
import { creationFormatLabel, normalizeCreationFormat } from "../lib/home";
import { requirePageAuthentication } from "../lib/page-auth";
import { CreateButton, HeroControls } from "./home-controls";
import { KairoShell } from "./kairo-shell";

type SearchParams = Promise<{ brand?: string; format?: string; idea?: string; authError?: string }>;
type OpportunityWithConcept = { conceptMockup?: ConceptMockupView };

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const data = requirePageAuthentication(await getHomeData(params.brand), "/");
  const opportunities = data.opportunities;
  const selectedFormat = normalizeCreationFormat(params.format);
  if (data.authenticated && opportunities.length === 0) {
    const discoverHref = `/discover${data.brandId ? `?brand=${encodeURIComponent(data.brandId)}` : ""}`;
    return <KairoShell active="Home" authenticated brandId={data.brandId} brandName={data.brandName}>
      {params.authError ? <p className="auth-error" role="alert">{params.authError}</p> : null}
      <section className="hero"><h1>What should we create next?</h1><p>Hunter has not found a strong opportunity for this Brand yet.</p><HeroControls brandId={data.brandId} selectedFormat={selectedFormat}/></section>
      <section className="recommendation home-opportunity-empty" aria-live="polite">
        <CircleAlert aria-hidden="true"/>
        <div><h2>No grounded recommendation yet</h2><p>Run Discovery to search the configured public sources. Kairo will show an idea here only after it passes the Brand-fit and evidence checks.</p></div>
        <Link href={discoverHref}><RefreshCw aria-hidden="true"/>Open Discovery</Link>
      </section>
      <section className="bottom-grid home-empty-grid">
        <article><header><h2><FileText aria-hidden="true"/>Continue working</h2><Link href={data.brandId ? `/content?brand=${encodeURIComponent(data.brandId)}` : "/content"}>View all</Link></header>{data.continueItems.length ? data.continueItems.slice(0,2).map((item) => <a className="draft" key={item.id} href={item.href}><span className="draft-thumb neutral"/><p><small>DRAFT</small><strong>{item.title}</strong><em>{item.context}</em></p><MoreVertical aria-hidden="true"/></a>) : <p className="empty-drafts">No unfinished content for this Brand.</p>}</article>
        <article><header><h2><Lightbulb aria-hidden="true"/>What Kairo learned</h2></header><div className="learning"><b><Lightbulb aria-hidden="true"/></b><p>{data.learning?.statement ?? "No accepted performance learning yet."}<small>{data.learning?.interpretation ?? "Accepted evidence-backed learnings will appear after content has measurable results."}</small></p></div></article>
        <article className="discover"><header><h2><Compass aria-hidden="true"/>Discover more</h2><Link href={discoverHref}>Open Discovery</Link></header><p className="empty-drafts">No persisted opportunities for this Brand. Refresh Discovery to search again.</p></article>
      </section>
    </KairoShell>;
  }
  const featuredIndex = Math.max(0, opportunities.findIndex((item) => item.id === params.idea));
  const featured = opportunities[featuredIndex] ?? opportunities[0]!;
  const featuredMockup = (featured as OpportunityWithConcept).conceptMockup;
  const nextFeatured = opportunities[(featuredIndex + 1) % opportunities.length] ?? featured;
  const discoverHref = `/discover${data.brandId ? `?brand=${encodeURIComponent(data.brandId)}` : ""}`;
  const featuredHref = `/discover/${encodeURIComponent(featured.id)}${data.brandId ? `?brand=${encodeURIComponent(data.brandId)}` : ""}`;
  const insightsHref = `/insights${data.brandId ? `?brand=${encodeURIComponent(data.brandId)}` : ""}`;
  const formatLabel = creationFormatLabel(selectedFormat);
  const FormatIcon = selectedFormat === "image" ? FileImage : selectedFormat === "carousel" ? LayoutGrid : selectedFormat === "campaign" ? Megaphone : PlaySquare;
  const formatDescription = selectedFormat === "campaign" ? "A coordinated content set keeps formats and timing connected." : selectedFormat === "carousel" ? "A save-worthy sequence gives each useful point room." : selectedFormat === "image" ? "A focused visual post makes the message quick to understand." : "Short, engaging video performs best for this opportunity.";
  const continueRows = data.continueItems;
  const nextQuery = new URLSearchParams({ format: selectedFormat, idea: nextFeatured.id });
  if (data.brandId) nextQuery.set("brand", data.brandId);

  return <KairoShell active="Home" authenticated={data.authenticated} brandId={data.brandId} brandName={data.brandName}>
        {params.authError ? <p className="auth-error" role="alert">{params.authError}</p> : null}
        <section className="hero"><h1>What should we create next?</h1><p>Kairo found a promising opportunity for your Brand.</p><HeroControls brandId={data.brandId} selectedFormat={selectedFormat}/></section>
        <section className="recommendation">
          <div className="recommend-head"><h2><Sparkles aria-hidden="true"/>Kairo recommends</h2><div><span><TrendingUp aria-hidden="true"/>Trending</span><span><ShieldCheck aria-hidden="true"/>Great fit</span></div></div>
          <div className="recommend-grid">
            {featuredMockup ? <div className="hero-image concept-home-preview"><ConceptMockupPreview mockup={featuredMockup} mode="compact"/></div> : <div className="hero-image home-opportunity-visual"><FormatIcon aria-hidden="true"/><span>Grounded opportunity</span><strong>{featured.title}</strong></div>}
            <div className="recommend-copy"><h3>{selectedFormat === "campaign" ? `Build a campaign around: ${featured.title}` : featured.title}</h3><h4><ShieldCheck aria-hidden="true"/>Why this fits your Brand</h4><p>{featured.rationale ?? "This opportunity is available because it passed the configured Brand-fit checks."}</p><h4 className="trend-copy"><TrendingUp aria-hidden="true"/>Why it is trending</h4><p>{featured.whyNow ?? "This opportunity has persisted evidence from the latest Discovery run."}</p><div className="actions"><CreateButton brandId={data.brandId} opportunityId={data.brandId ? featured.id : undefined} title={featured.title} direction={featured.developmentDirection ?? featured.rationale} format={selectedFormat}/><Link href={`/?${nextQuery.toString()}`}>See another</Link><Link href={featuredHref}>View evidence</Link></div></div>
            <aside className="recommend-meta"><small>Recommended format</small><strong><FormatIcon aria-hidden="true"/>{formatLabel}</strong><p>{formatDescription}</p><hr/><small>Source</small><Link href={featuredHref}>Trend &amp; public evidence</Link><p>Updated today</p></aside>
          </div>
        </section>
        <section className="bottom-grid">
          <article><header><h2><FileText aria-hidden="true"/>Continue working</h2><Link href={data.brandId ? `/content?brand=${encodeURIComponent(data.brandId)}` : "/content"}>View all</Link></header>{continueRows.slice(0,2).map((item, index) => <Link className="draft" key={item.id} href={item.kind === "campaign" ? item.href : discoverHref}><span className={`draft-thumb ${index === 1 ? "second" : "first"}`}/><p><small>DRAFT</small><strong>{item.title}</strong><em>{item.context}</em></p><MoreVertical aria-hidden="true"/></Link>)}{continueRows.length === 0 ? <p className="empty-drafts">No unfinished content. Create from the recommendation above.</p> : null}</article>
          <article><header><h2><Lightbulb aria-hidden="true"/>What Kairo learned</h2></header><div className="learning"><b><Lightbulb aria-hidden="true"/></b><p>{data.learning?.statement ?? "No accepted performance learning yet."}<small>{data.learning?.interpretation ?? "Accepted evidence-backed learnings will appear after content has measurable results."}</small></p></div><Link className="bottom-link" href={insightsHref}>See all insights <span>›</span></Link></article>
          <article className="discover"><header><h2><Compass aria-hidden="true"/>Discover more</h2><Link href={discoverHref}>View all</Link></header><div className="discover-row">{opportunities.filter((item) => item.id !== featured.id).slice(0,3).map((item,index) => <Link key={item.id} className={`idea idea-${index + 1}`} href={`/discover/${encodeURIComponent(item.id)}${data.brandId ? `?brand=${encodeURIComponent(data.brandId)}` : ""}`}><span><i><TrendingUp aria-hidden="true"/>Trending</i><i><ShieldCheck aria-hidden="true"/>Great fit</i></span><strong>{item.title}</strong><small>{item.details?.recommendedFormat ?? "Post"} · <b>{index === 2 ? "Medium" : "High"} opportunity</b></small></Link>)}</div></article>
        </section>
  </KairoShell>;
}
