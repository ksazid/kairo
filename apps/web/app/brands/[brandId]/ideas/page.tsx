import Link from "next/link";
import { getBrand, getIdeas } from "../../../../src/lib/kairo-api";
import { createIdeaAction } from "./actions";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;

export default async function IdeasPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { brandId } = await params;
  const [brand, ideas, messages] = await Promise.all([getBrand(brandId), getIdeas(brandId), searchParams]);
  if (!brand) return <main className="auth-page"><section className="auth-card"><h1>Brand not found.</h1><Link className="primary-button" href="/">Return to Today</Link></section></main>;
  const base = `/brands/${encodeURIComponent(brand.id)}`;
  const create = createIdeaAction.bind(null, brand.id);
  return <div className="app-shell">
    <KairoSidebar brandId={brand.id} active="Ideas" />
    <main className="workspace-main ideas-main">
      <header className="topbar"><div><p className="eyebrow">Ideas</p><h1>Turn a worthwhile thought into a strong direction.</h1><p className="lede">Ideas retain their source, evidence and uncertainty before Kairo proposes any content framing.</p></div><div className="scope-picker"><span className="scope-label">Brand</span><strong>{brand.name}</strong><span className="scope-meta">Private research context</span></div></header>
      {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}{messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}
      <div className="ideas-layout"><section className="ideas-list" aria-labelledby="idea-list-title"><div className="section-heading"><div><p className="eyebrow">Current work</p><h2 id="idea-list-title">{ideas.length ? `${ideas.length} ${ideas.length === 1 ? "Idea" : "Ideas"}` : "No Ideas yet"}</h2></div></div>
        {ideas.length ? ideas.map((idea) => <Link className="idea-row" href={`${base}/ideas/${encodeURIComponent(idea.id)}`} key={idea.id}><div><span className="idea-source">{idea.source.type === "opportunity" ? "From Discover" : "Your Idea"}</span><h3>{idea.title}</h3><p>{idea.premise}</p></div><span className={`idea-status ${idea.status}`}>{statusLabel(idea.status)}</span></Link>) : <div className="ideas-empty"><h3>Capture the first useful thought.</h3><p>Create an Idea here, or develop a strong Opportunity from Discover. Kairo will not fabricate research to make the list look busy.</p></div>}
      </section><aside className="new-idea-panel"><p className="eyebrow">New Idea</p><h2>Start from your own insight</h2><p className="muted">Research and multiple Angles come next. This does not generate final content.</p><form className="new-idea-form" action={create}><label>Idea title<input name="title" required maxLength={300} placeholder="What should this Brand explore?" /></label><label>Premise<textarea name="premise" required maxLength={2000} rows={5} placeholder="Why might this matter to the audience?" /></label><button className="primary-button" type="submit">Create Idea</button></form></aside></div>
    </main><MobileIdeasNav brandId={brand.id} />
  </div>;
}

function statusLabel(status: string) { return ({ new: "Ready to research", researching: "Researching", "research-ready": "Research ready", "angles-ready": "Angles ready" } as Record<string, string>)[status] ?? status; }
function KairoSidebar({ brandId, active }: { brandId: string; active: string }) { const items = ["Today", "Discover", "Ideas", "Campaigns", "Content Studio", "Calendar", "Performance", "Brand Brain"]; return <aside className="sidebar" aria-label="Primary navigation"><div><div className="wordmark"><span className="brandmark" aria-hidden="true" />Kairo</div><p className="sidebar-caption">Content Intelligence</p></div><nav className="nav-list">{items.map((item) => { const href = item === "Today" ? `/?brand=${encodeURIComponent(brandId)}` : item === "Discover" ? `/brands/${encodeURIComponent(brandId)}/discover` : item === "Ideas" ? `/brands/${encodeURIComponent(brandId)}/ideas` : item === "Campaigns" || item === "Content Studio" ? `/brands/${encodeURIComponent(brandId)}/campaigns` : item === "Calendar" ? `/brands/${encodeURIComponent(brandId)}/calendar` : item === "Brand Brain" ? `/brands/${encodeURIComponent(brandId)}/brain` : null; return href ? <Link key={item} href={href} className={`nav-item ${item === active ? "active" : ""}`} aria-current={item === active ? "page" : undefined}>{item}</Link> : <span key={item} className="nav-item disabled">{item}<small>Later</small></span>; })}</nav><div className="sidebar-footer"><span className="nav-item disabled">Settings<small>Later</small></span><a className="nav-item" href="/auth/logout">Sign out</a></div></aside>; }
function MobileIdeasNav({ brandId }: { brandId: string }) { return <nav className="mobile-nav" aria-label="Mobile navigation"><Link href={`/?brand=${encodeURIComponent(brandId)}`} className="mobile-nav-item">Today</Link><Link href={`/brands/${encodeURIComponent(brandId)}/discover`} className="mobile-nav-item">Discover</Link><Link href={`/brands/${encodeURIComponent(brandId)}/ideas`} className="mobile-nav-item active" aria-current="page">Ideas</Link><span className="mobile-nav-item disabled">Calendar</span><Link href={`/brands/${encodeURIComponent(brandId)}/brain`} className="mobile-nav-item">More</Link></nav>; }
export { KairoSidebar, MobileIdeasNav };
