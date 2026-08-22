import Link from "next/link";
import { redirect } from "next/navigation";
import type { BrandOpportunityDto } from "@kairo/contracts";
import { KairoProductShell, KairoScopePicker } from "./kairo-product-shell";
import { OpportunityList } from "./opportunity-list";
import { getBrands, getLearnings, getOpportunities, getPerformance, getSession } from "../src/lib/kairo-api";
import { buildPerformanceFeedback } from "../src/lib/performance-feedback-view-model";
import { PerformanceFeedback } from "./performance-feedback";

type SearchParams = Promise<{ workspace?: string; brand?: string; notice?: string; error?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?returnTo=/");
  if (session.workspaces.length === 0) redirect("/onboarding");

  const params = await searchParams;
  const workspace = session.workspaces.find((item) => item.id === params.workspace) ?? session.workspaces[0];
  if (!workspace) redirect("/onboarding");
  const brands = await getBrands(workspace.id);
  const brand = brands.find((item) => item.id === params.brand) ?? brands[0] ?? null;

  let opportunities: BrandOpportunityDto[] = [];
  let opportunityError: string | null = null;
  let feedback=buildPerformanceFeedback([],[]);
  if (brand) {
    try { opportunities = await getOpportunities(brand.id); }
    catch (error) { opportunityError = error instanceof Error ? error.message : "Unable to load Opportunities"; }
    try{const[metrics,learnings]=await Promise.all([getPerformance(brand.id),getLearnings(brand.id)]);feedback=buildPerformanceFeedback(metrics,learnings)}catch{/* Recommendations remain available when feedback cannot be read. */}
  }

  const today = opportunities.filter((item) => item.status !== "ignored").slice(0, 3);
  const returnTo = `/?workspace=${encodeURIComponent(workspace.id)}${brand ? `&brand=${encodeURIComponent(brand.id)}` : ""}`;
  const discoverHref = brand ? `/brands/${encodeURIComponent(brand.id)}/discover` : "/";

  return (
    <KairoProductShell brandId={brand?.id} workspaceId={workspace.id} active="Today">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main discovery-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Today</p>
            <h1>What deserves your attention now?</h1>
            <p className="lede">A short, ranked briefing for the selected Brand. If the evidence is weak, Kairo leaves the space quiet.</p>
          </div>
          <KairoScopePicker brandName={brand?.name ?? "No Brand yet"} workspaceName={workspace.name} />
        </header>

        {params.notice ? <p className="notice success" role="status">{params.notice}</p> : null}
        {params.error ? <p className="notice error" role="alert">{params.error}</p> : null}
        {opportunityError ? <p className="notice error" role="alert">{opportunityError}</p> : null}
        {brand?<PerformanceFeedback brandId={brand.id} feedback={feedback} compact/>:null}

        <section className="today-opportunity-section today-primary" aria-labelledby="today-opportunities-title">
          <div className="today-section-heading">
            <div>
              <p className="eyebrow">{brand ? `Ranked for ${brand.name}` : "Brand required"}</p>
              <h2 id="today-opportunities-title">Today&apos;s Opportunities</h2>
              <p>{brand ? "Up to three strong options. Develop one when it deserves deeper research." : "Add a Brand before Kairo can rank Opportunities for you."}</p>
            </div>
            {brand ? <Link className="secondary-button" href={discoverHref}>Open Discover</Link> : <Link className="primary-button" href="/onboarding">Add a Brand</Link>}
          </div>

          {brand ? (
            <OpportunityList brandId={brand.id} opportunities={today} returnTo={returnTo} />
          ) : (
            <div className="opportunity-empty" aria-live="polite">
              <p className="eyebrow">No Brand selected</p>
              <h3>Start with one Brand context.</h3>
              <p>Kairo keeps Brand intelligence isolated. Add or select a Brand before it recommends what deserves attention.</p>
            </div>
          )}
        </section>

        <section className="today-secondary-context" aria-label="Workspace and recommendation context">
          <details className="context-disclosure">
            <summary>
              <span><strong>{brand?.name ?? "Choose a Brand"}</strong><small>{workspace.name} · {workspace.role}</small></span>
              <span className="context-summary-action">Switch Brand</span>
            </summary>
            <div className="context-disclosure-body">
              <p className="muted">Brand context stays private to this Workspace. Switching changes relevance ranking without changing the underlying public signals.</p>
              <div className="brand-list" aria-label="Available Brands">
                {brands.map((item) => (
                  <Link
                    key={item.id}
                    className={item.id === brand?.id ? "brand-option selected" : "brand-option"}
                    href={`/?workspace=${encodeURIComponent(workspace.id)}&brand=${encodeURIComponent(item.id)}`}
                  >
                    <span>{item.name}</span><small>{item.id === brand?.id ? "Current" : "Switch"}</small>
                  </Link>
                ))}
                {brands.length === 0 ? <Link className="secondary-button" href="/onboarding">Add your first Brand</Link> : null}
              </div>
            </div>
          </details>

          <details className="context-disclosure">
            <summary>
              <span><strong>Why these Opportunities?</strong><small>How Today stays selective</small></span>
              <span className="context-summary-action">View criteria</span>
            </summary>
            <div className="context-disclosure-body">
              <ul className="context-points">
                <li>Public signals may be reused globally, but Brand relevance stays private.</li>
                <li>Evidence, novelty and audience fit must clear the current thresholds.</li>
                <li>Weak recommendations are suppressed instead of used as filler.</li>
              </ul>
            </div>
          </details>
        </section>
      </main>
    </KairoProductShell>
  );
}
