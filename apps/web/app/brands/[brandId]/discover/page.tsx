import Link from "next/link";
import { getBrand, getOpportunities } from "../../../../src/lib/kairo-api";
import { KairoProductShell, KairoScopePicker } from "../../../kairo-product-shell";
import { OpportunityList } from "../../../opportunity-list";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;

export default async function DiscoverPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { brandId } = await params;
  const [brand, opportunities, messages] = await Promise.all([getBrand(brandId), getOpportunities(brandId), searchParams]);
  if (!brand) return <main className="auth-page"><section className="auth-card"><h1>Brand not found.</h1><Link className="primary-button" href="/">Return to Today</Link></section></main>;

  const base = `/brands/${encodeURIComponent(brand.id)}`;
  const returnTo = `${base}/discover`;
  const active = opportunities.filter((item) => item.status !== "ignored");
  const saved = opportunities.filter((item) => item.status === "saved").length;
  const developing = opportunities.filter((item) => item.status === "developing").length;

  return (
    <KairoProductShell brandId={brand.id} active="Discover">
      <main className="workspace-main discovery-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Discover</p>
            <h1>What is worth saying now?</h1>
            <p className="lede">Evaluate the strongest active Opportunities for {brand.name}. Public evidence stays separate from private Brand relevance.</p>
          </div>
          <KairoScopePicker brandName={brand.name} meta="Private relevance · public evidence" />
        </header>

        {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
        {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

        <section className="discover-list-heading" aria-labelledby="active-opportunities-title">
          <div>
            <p className="eyebrow">Active Opportunities</p>
            <h2 id="active-opportunities-title">{active.length ? `${active.length} worth evaluating` : "No strong opportunity right now"}</h2>
            <p>Hunter suppresses weak candidates rather than filling the list. Develop only what deserves deeper research.</p>
          </div>
          <p className="discover-context-line" aria-label="Opportunity work status">
            <span><strong>{saved}</strong> saved</span>
            <span><strong>{developing}</strong> developing</span>
          </p>
        </section>

        <OpportunityList brandId={brand.id} opportunities={active} returnTo={returnTo} />
      </main>
    </KairoProductShell>
  );
}
