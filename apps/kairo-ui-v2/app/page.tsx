import Image from "next/image";
import Link from "next/link";
import { Compass, ExternalLink, FileImage, FileText, LayoutGrid, Lightbulb, Megaphone, MoreVertical, Play, PlaySquare, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { ConceptMockupPreview } from "../components/concept-mockup";
import { getHomeData } from "../lib/api";
import type { ConceptMockupView } from "../lib/concept-mockup";
import { creationFormatLabel, normalizeCreationFormat } from "../lib/home";
import { CreateButton, HeroControls } from "./home-controls";
import { KairoShell } from "./kairo-shell";

const fallback = [
  { id: "one", title: "3 mistakes customers make when renting a car in Malta", rationale: "Practical local advice positions your Brand as the helpful expert.", whyNow: "Rental car searches are rising as travel season approaches.", developmentDirection: "Create a practical mistake-led guide with clear local advice.", details: { recommendedFormat: "Reel" }, scores: { audienceFit: .91 } },
  { id: "two", title: "Best hidden beaches to visit in Malta", details: { recommendedFormat: "Reel" } },
  { id: "three", title: "How to get the best car rental deals", details: { recommendedFormat: "Post" } },
  { id: "four", title: "24 hours in Valletta: the perfect itinerary", details: { recommendedFormat: "Carousel" } },
];

type SearchParams = Promise<{ brand?: string; format?: string; idea?: string; authError?: string }>;
type OpportunityWithConcept = (typeof fallback)[number] & { conceptMockup?: ConceptMockupView };

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const data = await getHomeData(params.brand);
  const opportunities = data.opportunities.length ? data.opportunities : fallback;
  const selectedFormat = normalizeCreationFormat(params.format);
  const featuredIndex = Math.max(0, opportunities.findIndex((item) => item.id === params.idea));
  const featured = opportunities[featuredIndex] ?? opportunities[0] ?? fallback[0]!;
  const featuredMockup = (featured as OpportunityWithConcept).conceptMockup;
  const nextFeatured = opportunities[(featuredIndex + 1) % opportunities.length] ?? fallback[0]!;
  const webUrl = (process.env.NEXT_PUBLIC_KAIRO_WEB_URL ?? "https://kairo-two-plum.vercel.app").replace(/\/$/, "");
  const brandBase = data.brandId ? `${webUrl}/brands/${encodeURIComponent(data.brandId)}` : webUrl;
  const formatLabel = creationFormatLabel(selectedFormat);
  const FormatIcon = selectedFormat === "image" ? FileImage : selectedFormat === "carousel" ? LayoutGrid : selectedFormat === "campaign" ? Megaphone : PlaySquare;
  const formatDescription = selectedFormat === "campaign" ? "A coordinated content set keeps formats and timing connected." : selectedFormat === "carousel" ? "A save-worthy sequence gives each useful point room." : selectedFormat === "image" ? "A focused visual post makes the message quick to understand." : "Short, engaging video performs best for this opportunity.";
  const continueRows = data.authenticated ? data.continueItems : [
    { id: "mock-reel", kind: "idea" as const, title: "5 scenic drives in Malta", context: "Reel · Edited 2h ago", href: `${webUrl}/content` },
    { id: "mock-carousel", kind: "idea" as const, title: "What to eat in Malta", context: "Carousel · Edited 1d ago", href: `${webUrl}/content` },
  ];
  const nextQuery = new URLSearchParams({ format: selectedFormat, idea: nextFeatured.id });
  if (data.brandId) nextQuery.set("brand", data.brandId);

  return <KairoShell active="Home" authenticated={data.authenticated} brandId={data.brandId} brandName={data.brandName}>
        {params.authError ? <p className="auth-error" role="alert">{params.authError}</p> : null}
        <section className="hero"><h1>What should we create next?</h1><p>Kairo found a promising opportunity for your Brand.</p><HeroControls brandId={data.brandId} selectedFormat={selectedFormat}/></section>
        <section className="recommendation">
          <div className="recommend-head"><h2><Sparkles aria-hidden="true"/>Kairo recommends</h2><div><span><TrendingUp aria-hidden="true"/>Trending</span><span><ShieldCheck aria-hidden="true"/>Great fit</span></div></div>
          <div className="recommend-grid">
            {featuredMockup ? <div className="hero-image concept-home-preview"><ConceptMockupPreview mockup={featuredMockup} mode="compact"/></div> : <div className="hero-image"><Image src="/malta-car.webp" alt="White rental car overlooking Valletta, Malta" fill priority sizes="(max-width: 900px) 100vw, 38vw"/><div className="image-shade"/><div className="image-copy"><strong>3 mistakes</strong><span>customers make<br/>when renting a<br/>car in <b>Malta</b></span></div><small><Play aria-hidden="true" fill="currentColor"/>0:32</small></div>}
            <div className="recommend-copy"><h3>{selectedFormat === "campaign" ? `Build a campaign around: ${featured.title}` : featured.title}</h3><h4><ShieldCheck aria-hidden="true"/>Why this fits your Brand</h4><p>{featured.rationale ?? "Your audience looks for trusted, practical guidance. This positions your Brand as the helpful expert."}</p><h4 className="trend-copy"><TrendingUp aria-hidden="true"/>Why it is trending</h4><p>{featured.whyNow ?? "This topic is gaining attention and gives your Brand a timely, useful angle."}</p><div className="actions"><CreateButton brandId={data.brandId} opportunityId={data.brandId ? featured.id : undefined} title={featured.title} direction={featured.developmentDirection ?? featured.rationale} format={selectedFormat}/><Link href={`/?${nextQuery.toString()}`}>See another</Link><a href={data.brandId ? `${brandBase}/opportunities/${encodeURIComponent(featured.id)}` : webUrl}>View source<ExternalLink aria-hidden="true"/></a></div></div>
            <aside className="recommend-meta"><small>Recommended format</small><strong><FormatIcon aria-hidden="true"/>{formatLabel}</strong><p>{formatDescription}</p><hr/><small>Source</small><a href={data.brandId ? `${brandBase}/opportunities/${encodeURIComponent(featured.id)}` : webUrl}>Trend &amp; public evidence <ExternalLink aria-hidden="true"/></a><p>Updated today</p></aside>
          </div>
        </section>
        <section className="bottom-grid">
          <article><header><h2><FileText aria-hidden="true"/>Continue working</h2><Link href={data.brandId ? `/content?brand=${encodeURIComponent(data.brandId)}` : "/content"}>View all</Link></header>{continueRows.slice(0,2).map((item, index) => item.kind === "campaign" ? <Link className="draft" key={item.id} href={item.href}><span className={`draft-thumb ${index === 1 ? "second" : "first"}`}/><p><small>DRAFT</small><strong>{item.title}</strong><em>{item.context}</em></p><MoreVertical aria-hidden="true"/></Link> : <a className="draft" key={item.id} href={item.href.startsWith("http") ? item.href : `${webUrl}${item.href}`}><span className={`draft-thumb ${index === 1 ? "second" : "first"}`}/><p><small>DRAFT</small><strong>{item.title}</strong><em>{item.context}</em></p><MoreVertical aria-hidden="true"/></a>)}{continueRows.length === 0 ? <p className="empty-drafts">No unfinished content. Create from the recommendation above.</p> : null}</article>
          <article><header><h2><Lightbulb aria-hidden="true"/>What Kairo learned</h2></header><div className="learning"><b><Lightbulb aria-hidden="true"/></b><p>{data.learning?.statement ?? "Your audience engages most with practical travel advice and local tips."}<small>{data.learning?.interpretation ?? "Keep creating helpful, save-worthy content that solves problems."}</small></p></div><a className="bottom-link" href={data.brandId ? `${brandBase}/performance` : webUrl}>See all insights <span>›</span></a></article>
          <article className="discover"><header><h2><Compass aria-hidden="true"/>Discover more</h2><Link href={data.brandId ? `/discover?brand=${encodeURIComponent(data.brandId)}` : "/discover"}>View all</Link></header><div className="discover-row">{opportunities.filter((item) => item.id !== featured.id).slice(0,3).map((item,index) => <Link key={item.id} className={`idea idea-${index + 1}`} href={`/discover/${encodeURIComponent(item.id)}${data.brandId ? `?brand=${encodeURIComponent(data.brandId)}` : ""}`}><span><i><TrendingUp aria-hidden="true"/>Trending</i><i><ShieldCheck aria-hidden="true"/>Great fit</i></span><strong>{item.title}</strong><small>{item.details?.recommendedFormat ?? "Post"} · <b>{index === 2 ? "Medium" : "High"} opportunity</b></small></Link>)}</div></article>
        </section>
  </KairoShell>;
}
