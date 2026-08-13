import Link from "next/link";
import { getBrand, getOpportunities } from "../../../../src/lib/kairo-api";
import { OpportunityList } from "../../../opportunity-list";

const primaryNav = ["Today", "Discover", "Ideas", "Campaigns", "Content Studio", "Calendar", "Performance", "Brand Brain"];
const mobileNav = ["Today", "Discover", "Ideas", "Calendar", "More"];

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;

export default async function DiscoverPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { brandId } = await params;
  const [brand, opportunities, messages] = await Promise.all([getBrand(brandId), getOpportunities(brandId), searchParams]);
  if (!brand) return <main className="auth-page"><section className="auth-card"><h1>Brand not found.</h1><Link className="primary-button" href="/">Return to Today</Link></section></main>;
  const returnTo = `/brands/${encodeURIComponent(brand.id)}/discover`;
  const active = opportunities.filter((item) => item.status !== "ignored");

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div><div className="wordmark"><span className="brandmark" aria-hidden="true" />Kairo</div><p className="sidebar-caption">Content Intelligence</p></div>
        <nav className="nav-list">
          {primaryNav.map((item) => {
            if (item === "Today") return <Link key={item} className="nav-item" href={`/?brand=${encodeURIComponent(brand.id)}`}>{item}</Link>;
            if (item === "Discover") return <Link key={item} className="nav-item active" href={returnTo} aria-current="page">{item}</Link>;
            if (item === "Ideas") return <Link key={item} className="nav-item" href={`/brands/${encodeURIComponent(brand.id)}/ideas`}>{item}</Link>;
            if (item === "Brand Brain") return <Link key={item} className="nav-item" href={`/brands/${encodeURIComponent(brand.id)}/brain`}>{item}</Link>;
            return <span key={item} className="nav-item disabled" aria-disabled="true">{item}<small>Later</small></span>;
          })}
        </nav>
        <div className="sidebar-footer"><span className="nav-item disabled">Settings<small>Later</small></span><a className="nav-item" href="/auth/logout">Sign out</a></div>
      </aside>

      <main className="workspace-main discovery-main">
        <header className="topbar">
          <div><p className="eyebrow">Discover</p><h1>What is worth saying now?</h1><p className="lede">Hunter ranks public signals against {brand.name}&apos;s Brand context. Weak candidates are suppressed instead of used as filler.</p></div>
          <div className="scope-picker" aria-label="Current Brand scope"><span className="scope-label">Brand</span><strong>{brand.name}</strong><span className="scope-meta">Private relevance · public evidence</span></div>
        </header>

        {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
        {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

        <section className="discover-summary" aria-label="Discover summary">
          <div><span>Strong opportunities</span><strong>{active.length}</strong></div>
          <div><span>Saved</span><strong>{opportunities.filter((item) => item.status === "saved").length}</strong></div>
          <div><span>Developing</span><strong>{opportunities.filter((item) => item.status === "developing").length}</strong></div>
        </section>

        <OpportunityList brandId={brand.id} opportunities={active} returnTo={returnTo} />
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileNav.map((item) => {
          if (item === "Today") return <Link key={item} href={`/?brand=${encodeURIComponent(brand.id)}`} className="mobile-nav-item">{item}</Link>;
          if (item === "Discover") return <Link key={item} href={returnTo} className="mobile-nav-item active" aria-current="page">{item}</Link>;
          if (item === "Ideas") return <Link key={item} href={`/brands/${encodeURIComponent(brand.id)}/ideas`} className="mobile-nav-item">{item}</Link>;
          if (item === "More") return <Link key={item} href={`/brands/${encodeURIComponent(brand.id)}/brain`} className="mobile-nav-item">{item}</Link>;
          return <span key={item} className="mobile-nav-item disabled" aria-disabled="true">{item}</span>;
        })}
      </nav>
    </div>
  );
}
