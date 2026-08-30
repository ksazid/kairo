import Image from "next/image";
import Link from "next/link";
import { BarChart3, Bell, CalendarDays, ChevronDown, Compass, ExternalLink, FileImage, FileText, Home as HomeIcon, LayoutGrid, Lightbulb, Megaphone, MoreVertical, Play, PlaySquare, Settings2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { getHomeData } from "../lib/api";
import { creationFormatLabel, normalizeCreationFormat } from "../lib/home";
import { CreateButton, HeroControls } from "./home-controls";

const fallback = [
  { id: "one", title: "3 mistakes customers make when renting a car in Malta", rationale: "Practical local advice positions your Brand as the helpful expert.", whyNow: "Rental car searches are rising as travel season approaches.", developmentDirection: "Create a practical mistake-led guide with clear local advice.", details: { recommendedFormat: "Reel" }, scores: { audienceFit: .91 } },
  { id: "two", title: "Best hidden beaches to visit in Malta", details: { recommendedFormat: "Reel" } },
  { id: "three", title: "How to get the best car rental deals", details: { recommendedFormat: "Post" } },
  { id: "four", title: "24 hours in Valletta: the perfect itinerary", details: { recommendedFormat: "Carousel" } },
];

type SearchParams = Promise<{ brand?: string; format?: string; idea?: string; authError?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const data = await getHomeData(params.brand);
  const opportunities = data.opportunities.length ? data.opportunities : fallback;
  const selectedFormat = normalizeCreationFormat(params.format);
  const featuredIndex = Math.max(0, opportunities.findIndex((item) => item.id === params.idea));
  const featured = opportunities[featuredIndex] ?? opportunities[0] ?? fallback[0]!;
  const nextFeatured = opportunities[(featuredIndex + 1) % opportunities.length] ?? fallback[0]!;
  const webUrl = (process.env.NEXT_PUBLIC_KAIRO_WEB_URL ?? "https://kairo-two-plum.vercel.app").replace(/\/$/, "");
  const brandBase = data.brandId ? `${webUrl}/brands/${encodeURIComponent(data.brandId)}` : webUrl;
  const formatLabel = creationFormatLabel(selectedFormat);
  const FormatIcon = selectedFormat === "image" ? FileImage : selectedFormat === "carousel" ? LayoutGrid : selectedFormat === "campaign" ? Megaphone : PlaySquare;
  const formatDescription = selectedFormat === "campaign" ? "A coordinated content set keeps formats and timing connected." : selectedFormat === "carousel" ? "A save-worthy sequence gives each useful point room." : selectedFormat === "image" ? "A focused visual post makes the message quick to understand." : "Short, engaging video performs best for this opportunity.";
  const nav = [
    { label: "Home", Icon: HomeIcon, href: "/" },
    { label: "Discover", Icon: Compass, href: data.brandId ? `${brandBase}/discover` : webUrl },
    { label: "Content", Icon: FileText, href: data.brandId ? `${brandBase}/content` : webUrl },
    { label: "Campaigns", Icon: Megaphone, href: data.brandId ? `${brandBase}/campaigns` : webUrl },
    { label: "Calendar", Icon: CalendarDays, href: data.brandId ? `${brandBase}/calendar` : webUrl },
    { label: "Insights", Icon: BarChart3, href: data.brandId ? `${brandBase}/performance` : webUrl },
    { label: "Brand", Icon: Settings2, href: data.brandId ? `${brandBase}/brain` : webUrl },
  ];
  const continueRows = data.authenticated ? data.continueItems : [
    { id: "mock-reel", title: "5 scenic drives in Malta", context: "Reel · Edited 2h ago", href: `${webUrl}/content` },
    { id: "mock-carousel", title: "What to eat in Malta", context: "Carousel · Edited 1d ago", href: `${webUrl}/content` },
  ];
  const nextQuery = new URLSearchParams({ format: selectedFormat, idea: nextFeatured.id });
  if (data.brandId) nextQuery.set("brand", data.brandId);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-logo"><Image src="/kairo-logo.svg" alt="" width="48" height="48" priority/><span>Kairo</span></div>
      <nav>{nav.map(({ label, Icon, href }) => label === "Home" ? <Link key={label} className="active" href={href}><Icon aria-hidden="true"/>{label}</Link> : <a key={label} href={href}><Icon aria-hidden="true"/>{label}</a>)}</nav>
      <a className="classic-link" href={webUrl}><ExternalLink aria-hidden="true"/>Back to Classic Kairo</a>
      <div className="pro-tip"><span><Sparkles aria-hidden="true"/>Pro tip</span><p>Connect more channels to get smarter recommendations.</p><a href={data.brandId ? `${brandBase}/channels` : webUrl}>Connect channels <span>›</span></a></div>
    </aside>
    <main>
      <header className="topbar"><button className="brand-select" type="button"><span className="brand-avatar">S</span><strong>{data.brandName}</strong><ChevronDown aria-hidden="true"/></button><span className="ready-dot"><i/>{data.authenticated ? "Brand ready" : "Preview mode"}</span><div className="top-spacer"/><a className="mobile-classic" href={webUrl} aria-label="Back to Classic Kairo"><ExternalLink aria-hidden="true"/></a><button className="bell" type="button" aria-label="Notifications"><Bell aria-hidden="true"/><b>3</b></button>{data.authenticated ? <a className="profile" href="/auth/logout"><span>SK</span><strong>Sazzad</strong><ChevronDown aria-hidden="true"/></a> : <a className="profile auth-profile" href="/auth/login"><span>SK</span><strong>Sign in</strong></a>}</header>
      <div className="workspace">
        {params.authError ? <p className="auth-error" role="alert">{params.authError}</p> : null}
        <section className="hero"><h1>What should we create next?</h1><p>Kairo found a promising opportunity for your Brand.</p><HeroControls brandId={data.brandId} selectedFormat={selectedFormat}/></section>
        <section className="recommendation">
          <div className="recommend-head"><h2><Sparkles aria-hidden="true"/>Kairo recommends</h2><div><span><TrendingUp aria-hidden="true"/>Trending</span><span><ShieldCheck aria-hidden="true"/>Great fit</span></div></div>
          <div className="recommend-grid">
            <div className="hero-image"><Image src="/malta-car.webp" alt="White rental car overlooking Valletta, Malta" fill priority sizes="(max-width: 900px) 100vw, 38vw"/><div className="image-shade"/><div className="image-copy"><strong>3 mistakes</strong><span>customers make<br/>when renting a<br/>car in <b>Malta</b></span></div><small><Play aria-hidden="true" fill="currentColor"/>0:32</small></div>
            <div className="recommend-copy"><h3>{selectedFormat === "campaign" ? `Build a campaign around: ${featured.title}` : featured.title}</h3><h4><ShieldCheck aria-hidden="true"/>Why this fits your Brand</h4><p>{featured.rationale ?? "Your audience looks for trusted, practical guidance. This positions your Brand as the helpful expert."}</p><h4 className="trend-copy"><TrendingUp aria-hidden="true"/>Why it is trending</h4><p>{featured.whyNow ?? "This topic is gaining attention and gives your Brand a timely, useful angle."}</p><div className="actions"><CreateButton brandId={data.brandId} opportunityId={data.brandId ? featured.id : undefined} title={featured.title} direction={featured.developmentDirection ?? featured.rationale} format={selectedFormat}/><Link href={`/?${nextQuery.toString()}`}>See another</Link><a href={data.brandId ? `${brandBase}/opportunities/${encodeURIComponent(featured.id)}` : webUrl}>View source<ExternalLink aria-hidden="true"/></a></div></div>
            <aside className="recommend-meta"><small>Recommended format</small><strong><FormatIcon aria-hidden="true"/>{formatLabel}</strong><p>{formatDescription}</p><hr/><small>Source</small><a href={data.brandId ? `${brandBase}/opportunities/${encodeURIComponent(featured.id)}` : webUrl}>Trend &amp; public evidence <ExternalLink aria-hidden="true"/></a><p>Updated today</p></aside>
          </div>
        </section>
        <section className="bottom-grid">
          <article><header><h2><FileText aria-hidden="true"/>Continue working</h2><a href={data.brandId ? `${brandBase}/content` : webUrl}>View all</a></header>{continueRows.slice(0,2).map((item, index) => <a className="draft" key={item.id} href={item.href.startsWith("http") ? item.href : `${webUrl}${item.href}`}><span className={`draft-thumb ${index === 1 ? "second" : "first"}`}/><p><small>DRAFT</small><strong>{item.title}</strong><em>{item.context}</em></p><MoreVertical aria-hidden="true"/></a>)}{continueRows.length === 0 ? <p className="empty-drafts">No unfinished content. Create from the recommendation above.</p> : null}</article>
          <article><header><h2><Lightbulb aria-hidden="true"/>What Kairo learned</h2></header><div className="learning"><b><Lightbulb aria-hidden="true"/></b><p>{data.learning?.statement ?? "Your audience engages most with practical travel advice and local tips."}<small>{data.learning?.interpretation ?? "Keep creating helpful, save-worthy content that solves problems."}</small></p></div><a className="bottom-link" href={data.brandId ? `${brandBase}/performance` : webUrl}>See all insights <span>›</span></a></article>
          <article className="discover"><header><h2><Compass aria-hidden="true"/>Discover more</h2><a href={data.brandId ? `${brandBase}/discover` : webUrl}>View all</a></header><div className="discover-row">{opportunities.filter((item) => item.id !== featured.id).slice(0,3).map((item,index) => <a key={item.id} className={`idea idea-${index + 1}`} href={data.brandId ? `${brandBase}/opportunities/${encodeURIComponent(item.id)}` : webUrl}><span><i><TrendingUp aria-hidden="true"/>Trending</i><i><ShieldCheck aria-hidden="true"/>Great fit</i></span><strong>{item.title}</strong><small>{item.details?.recommendedFormat ?? "Post"} · <b>{index === 2 ? "Medium" : "High"} opportunity</b></small></a>)}</div></article>
        </section>
      </div>
    </main>
  </div>;
}
