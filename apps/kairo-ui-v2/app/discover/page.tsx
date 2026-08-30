import { Compass, Sparkles } from "lucide-react";
import { getHomeData } from "../../lib/api";
import { discoverFallback, toDiscoverCards } from "../../lib/discover";
import { KairoShell } from "../kairo-shell";
import { DiscoverClient } from "./discover-client";

type SearchParams = Promise<{ brand?: string; authError?: string }>;

export default async function DiscoverPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const data = await getHomeData(params.brand);
  const opportunities = data.opportunities.length ? data.opportunities : discoverFallback;
  const cards = toDiscoverCards(opportunities);

  return <KairoShell active="Discover" authenticated={data.authenticated} brandId={data.brandId} brandName={data.brandName} workspaceClassName="discover-workspace">
    {params.authError ? <p className="auth-error" role="alert">{params.authError}</p> : null}
    <header className="discover-page-header">
      <div>
        <span><Compass aria-hidden="true"/>Discover</span>
        <h1>Find the idea worth creating next</h1>
        <p>Kairo filters public momentum through your Brand, audience and content strengths.</p>
      </div>
      <aside><Sparkles aria-hidden="true"/><span><strong>Brand-fit discovery</strong><small>Strong ideas only · refreshed continuously</small></span></aside>
    </header>
    <DiscoverClient initialCards={cards} brandId={data.brandId}/>
  </KairoShell>;
}
