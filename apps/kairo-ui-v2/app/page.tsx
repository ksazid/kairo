import Image from "next/image";
import Link from "next/link";
import { BarChart3, Bell, CalendarDays, ChevronDown, Compass, ExternalLink, FileText, Home as HomeIcon, LayoutGrid, Lightbulb, Megaphone, MoreVertical, Play, PlaySquare, Settings2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { getHomeData } from "../lib/api";
import { CreateButton, HeroControls } from "./home-controls";

const fallback = [
  { id: "one", title: "3 mistakes customers make when renting a car in Malta", rationale: "Practical local advice positions your Brand as the helpful expert.", whyNow: "Rental car searches are rising as travel season approaches.", details: { recommendedFormat: "Reel" }, scores: { audienceFit: .91 } },
  { id: "two", title: "Best hidden beaches to visit in Malta", details: { recommendedFormat: "Reel" } },
  { id: "three", title: "How to get the best car rental deals", details: { recommendedFormat: "Post" } },
  { id: "four", title: "24 hours in Valletta: the perfect itinerary", details: { recommendedFormat: "Carousel" } },
];

export default async function Home() {
  const data = await getHomeData();
  const opportunities = data.opportunities.length ? data.opportunities : fallback;
  const featured = opportunities[0] ?? fallback[0]!;
  const webUrl = process.env.NEXT_PUBLIC_KAIRO_WEB_URL ?? "https://kairo-two-plum.vercel.app";
  const nav = [
    { label: "Home", Icon: HomeIcon, href: "/" },
    { label: "Discover", Icon: Compass, href: `${webUrl}/discover` },
    { label: "Content", Icon: FileText, href: `${webUrl}/content` },
    { label: "Campaigns", Icon: Megaphone, href: `${webUrl}/campaigns` },
    { label: "Calendar", Icon: CalendarDays, href: `${webUrl}/calendar` },
    { label: "Insights", Icon: BarChart3, href: `${webUrl}/insights` },
    { label: "Brand", Icon: Settings2, href: `${webUrl}/brand` },
  ];
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-logo"><Image src="/kairo-logo.svg" alt="" width={48} height={48}/><span>Kairo</span></div>
      <nav>{nav.map(({ label, Icon, href }) => <Link key={label} className={label === "Home" ? "active" : ""} href={href}><Icon aria-hidden="true"/>{label}</Link>)}</nav>
      <div className="pro-tip"><span><Sparkles aria-hidden="true"/>Pro tip</span><p>Connect more channels to get smarter recommendations.</p><a href={`${webUrl}/channels`}>Connect channels <span>›</span></a></div>
    </aside>
    <main>
      <header className="topbar"><button className="brand-select"><span className="brand-avatar">S</span><strong>{data.brandName}</strong><ChevronDown aria-hidden="true"/></button><span className="ready-dot"><i/>Brand ready</span><div className="top-spacer"/><button className="bell" aria-label="Notifications"><Bell aria-hidden="true"/><b>3</b></button><button className="profile"><span>SK</span><strong>Sazzad</strong><ChevronDown aria-hidden="true"/></button></header>
      <div className="workspace">
        <section className="hero"><h1>What should we create next?</h1><p>Kairo found a promising opportunity for your Brand.</p><HeroControls brandId={data.brandId}/></section>
        <section className="recommendation">
          <div className="recommend-head"><h2><Sparkles aria-hidden="true"/>Kairo recommends</h2><div><span><TrendingUp aria-hidden="true"/>Trending</span><span><ShieldCheck aria-hidden="true"/>Great fit</span></div></div>
          <div className="recommend-grid">
            <div className="hero-image"><Image src="/malta-car.webp" alt="White rental car overlooking Valletta, Malta" fill priority sizes="420px"/><div className="image-shade"/><div className="image-copy"><strong>3 mistakes</strong><span>customers make<br/>when renting a<br/>car in <b>Malta</b></span></div><small><Play aria-hidden="true" fill="currentColor"/>0:32</small></div>
            <div className="recommend-copy"><h3>{featured.title}</h3><h4><ShieldCheck aria-hidden="true"/>Why this fits your Brand</h4><p>{featured.rationale ?? "Your audience plans trips to Malta and looks for trusted, local tips. This positions Sazzid as the helpful expert."}</p><h4 className="trend-copy"><TrendingUp aria-hidden="true"/>Why it is trending</h4><p>{featured.whyNow ?? "Rental car content is surging in Malta as travel season peaks and tourists search for local advice."}</p><div className="actions"><CreateButton brandId={data.brandId}/><a href={`${webUrl}/?brand=${encodeURIComponent(data.brandId ?? "")}`}>See another</a><a href={`${webUrl}/discover`}>View source<ExternalLink aria-hidden="true"/></a></div></div>
            <aside className="recommend-meta"><small>Recommended format</small><strong><PlaySquare aria-hidden="true"/>{featured.details?.recommendedFormat ?? "Reel"}</strong><p>Short, engaging video performs best right now.</p><hr/><small>Source</small><a href={`${webUrl}/discover`}>Google Trends<br/>&amp; Social listening <ExternalLink aria-hidden="true"/></a><p>Updated today</p></aside>
          </div>
        </section>
        <section className="bottom-grid">
          <article><header><h2><FileText aria-hidden="true"/>Continue working</h2><a href={`${webUrl}/content`}>View all</a></header><a className="draft" href={`${webUrl}/content`}><span className="draft-thumb first"/><p><small>DRAFT</small><strong>5 scenic drives in Malta</strong><em>Reel · Edited 2h ago</em></p><MoreVertical aria-hidden="true"/></a><a className="draft" href={`${webUrl}/content`}><span className="draft-thumb second"/><p><small>DRAFT</small><strong>What to eat in Malta</strong><em>Carousel · Edited 1d ago</em></p><MoreVertical aria-hidden="true"/></a></article>
          <article><header><h2><Lightbulb aria-hidden="true"/>What Kairo learned</h2></header><div className="learning"><b><Lightbulb aria-hidden="true"/></b><p>Your audience engages most with practical travel advice and local tips.<small>Keep creating helpful, save-worthy content that solves problems.</small></p></div><a className="bottom-link" href={`${webUrl}/insights`}>See all insights <span>›</span></a></article>
          <article className="discover"><header><h2><Compass aria-hidden="true"/>Discover more</h2><a href={`${webUrl}/discover`}>View all</a></header><div className="discover-row">{opportunities.slice(1,4).map((item,index) => <a key={item.id} className={`idea idea-${index + 1}`} href={`${webUrl}/brands/${encodeURIComponent(data.brandId ?? "")}/opportunities/${encodeURIComponent(item.id)}`}><span><i><TrendingUp aria-hidden="true"/>Trending</i><i><ShieldCheck aria-hidden="true"/>Great fit</i></span><strong>{item.title}</strong><small>{item.details?.recommendedFormat ?? "Post"} · <b>{index === 2 ? "Medium" : "High"} opportunity</b></small></a>)}</div></article>
        </section>
      </div>
    </main>
  </div>;
}
