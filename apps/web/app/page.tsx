import Link from "next/link";
import type { BrandOpportunityDto } from "@kairo/contracts";
import { createWorkspaceAction } from "./actions";
import { OpportunityList } from "./opportunity-list";
import { getBrands, getOpportunities, getSession } from "../src/lib/kairo-api";

const primaryNav = ["Today", "Discover", "Ideas", "Campaigns", "Content Studio", "Calendar", "Performance", "Brand Brain"];
const mobileNav = ["Today", "Discover", "Ideas", "Calendar", "More"];

type SearchParams = Promise<{ workspace?: string; brand?: string; notice?: string; error?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) return <SignIn />;
  if (session.workspaces.length === 0) return <Onboarding displayName={session.account.displayName ?? session.account.email ?? "there"} />;

  const params = await searchParams;
  const workspace = session.workspaces.find((item) => item.id === params.workspace) ?? session.workspaces[0];
  if (!workspace) return <Onboarding displayName={session.account.displayName ?? session.account.email ?? "there"} />;
  const brands = await getBrands(workspace.id);
  const brand = brands.find((item) => item.id === params.brand) ?? brands[0] ?? null;

  let opportunities: BrandOpportunityDto[] = [];
  let opportunityError: string | null = null;
  if (brand) {
    try { opportunities = await getOpportunities(brand.id); }
    catch (error) { opportunityError = error instanceof Error ? error.message : "Unable to load Opportunities"; }
  }
  const today = opportunities.filter((item) => item.status !== "ignored").slice(0, 3);
  const returnTo = `/?workspace=${encodeURIComponent(workspace.id)}${brand ? `&brand=${encodeURIComponent(brand.id)}` : ""}`;
  const discoverHref = brand ? `/brands/${encodeURIComponent(brand.id)}/discover` : "/";

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div><div className="wordmark"><span className="brandmark" aria-hidden="true" />Kairo</div><p className="sidebar-caption">Content Intelligence</p></div>
        <nav className="nav-list">
          {primaryNav.map((item) => {
            if (item === "Today") return <Link key={item} className="nav-item active" href={returnTo} aria-current="page">{item}</Link>;
            if (item === "Discover" && brand) return <Link key={item} className="nav-item" href={discoverHref}>{item}</Link>;
            if (item === "Ideas" && brand) return <Link key={item} className="nav-item" href={`/brands/${encodeURIComponent(brand.id)}/ideas`}>{item}</Link>;
            if (item === "Brand Brain" && brand) return <Link key={item} className="nav-item" href={`/brands/${encodeURIComponent(brand.id)}/brain`}>{item}</Link>;
            return <span key={item} className="nav-item disabled" aria-disabled="true">{item}<small>Later</small></span>;
          })}
        </nav>
        <div className="sidebar-footer"><span className="nav-item disabled">Settings<small>Later</small></span><a className="nav-item" href="/auth/logout">Sign out</a></div>
      </aside>

      <main className="workspace-main discovery-main">
        <header className="topbar">
          <div><p className="eyebrow">Today</p><h1>What deserves your attention now?</h1><p className="lede">Kairo surfaces only Opportunities that clear Brand relevance, evidence and novelty thresholds.</p></div>
          <div className="scope-picker" aria-label="Current Brand scope"><span className="scope-label">Brand</span><strong>{brand?.name ?? "No Brand"}</strong><span className="scope-meta">Private Brand context</span></div>
        </header>

        {params.notice ? <p className="notice success" role="status">{params.notice}</p> : null}
        {params.error ? <p className="notice error" role="alert">{params.error}</p> : null}
        {opportunityError ? <p className="notice error" role="alert">{opportunityError}</p> : null}

        <section className="foundation-grid" aria-label="Current scope">
          <article className="status-panel">
            <div className="panel-heading"><div><p className="eyebrow">Today&apos;s focus</p><h2>{today.length ? `${today.length} worthwhile ${today.length === 1 ? "Opportunity" : "Opportunities"}` : "No strong focus yet"}</h2></div><span className="status-pill">Hunter</span></div>
            <p>{today.length ? "These are ranked for the selected Brand from public evidence. Develop only what deserves deeper research." : "Kairo will leave Today quiet when the current evidence is not strong enough for this Brand."}</p>
            <div className="check-list"><span>Public signals stay reusable globally</span><span>Brand relevance stays private</span><span>Weak recommendations are suppressed</span></div>
          </article>

          <aside className="scope-panel">
            <p className="eyebrow">Workspace</p><h3>{workspace.name}</h3><p className="muted">Role: {workspace.role}</p>
            <div className="brand-list" aria-label="Available Brands">
              {brands.map((item) => <Link key={item.id} className={item.id === brand?.id ? "brand-option selected" : "brand-option"} href={`/?workspace=${encodeURIComponent(workspace.id)}&brand=${encodeURIComponent(item.id)}`}><span>{item.name}</span><small>{item.id === brand?.id ? "Current" : "Switch"}</small></Link>)}
            </div>
          </aside>
        </section>

        {brand ? <section className="today-opportunity-section" aria-label="Today's Opportunities">
          <div className="today-section-heading"><div><p className="eyebrow">Ranked for {brand.name}</p><h2>Today&apos;s Opportunities</h2><p>Three strong options at most. Open Discover for the full active list.</p></div><Link className="secondary-button" href={discoverHref}>Open Discover</Link></div>
          <OpportunityList brandId={brand.id} opportunities={today} returnTo={returnTo} />
        </section> : null}
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileNav.map((item) => {
          if (item === "Today") return <Link key={item} href={returnTo} className="mobile-nav-item active" aria-current="page">{item}</Link>;
          if (item === "Discover" && brand) return <Link key={item} href={discoverHref} className="mobile-nav-item">{item}</Link>;
          if (item === "Ideas" && brand) return <Link key={item} href={`/brands/${encodeURIComponent(brand.id)}/ideas`} className="mobile-nav-item">{item}</Link>;
          if (item === "More" && brand) return <Link key={item} href={`/brands/${encodeURIComponent(brand.id)}/brain`} className="mobile-nav-item">{item}</Link>;
          return <span key={item} className="mobile-nav-item disabled" aria-disabled="true">{item}</span>;
        })}
      </nav>
    </div>
  );
}

function SignIn() {
  return <main className="auth-page"><section className="auth-card"><div className="wordmark large"><span className="brandmark" aria-hidden="true" />Kairo</div><p className="eyebrow">Content Intelligence for Brands</p><h1>Know what your Brand should say next.</h1><p className="lede">Start with a secure Workspace. Kairo keeps each Brand&apos;s context and future learning isolated.</p><a className="primary-button" href="/auth/login">Sign in securely</a><p className="fine-print">Sign-in uses standards-based OIDC/OAuth. Workspace access is enforced by Kairo, not by possession of an identity token alone.</p></section></main>;
}

function Onboarding({ displayName }: { displayName: string }) {
  return <main className="onboarding-page"><section className="onboarding-card"><div className="wordmark"><span className="brandmark" aria-hidden="true" />Kairo</div><p className="eyebrow">Welcome, {displayName}</p><h1>Create your first Workspace and Brand.</h1><p className="lede">Keep this light. Brand Brain enrichment comes next.</p><form action={createWorkspaceAction} className="onboarding-form"><label>Workspace name<input name="workspaceName" required maxLength={120} placeholder="My Studio" autoComplete="organization" /></label><label>Brand name<input name="brandName" required maxLength={120} placeholder="Acme" /></label><label>Website <span>optional</span><input name="publicSourceUrl" type="url" placeholder="https://example.com" inputMode="url" /></label><label>Public profile <span>optional</span><input name="publicProfileUrl" type="url" placeholder="https://linkedin.com/company/..." inputMode="url" /></label><button className="primary-button" type="submit">Create Workspace</button></form><a className="text-link" href="/auth/logout">Sign out</a></section></main>;
}
