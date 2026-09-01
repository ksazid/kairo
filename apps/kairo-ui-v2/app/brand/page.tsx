import { getHomeData } from "../../lib/api";
import { KairoShell } from "../kairo-shell";
import { BrandBrainClient } from "./brand-brain-client";

type SearchParams = Promise<{ brand?: string; authError?: string }>;

export default async function BrandBrainPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const data = await getHomeData(params.brand);

  return <KairoShell
    active="Brand"
    authenticated={data.authenticated}
    brandId={data.brandId}
    brandName={data.brandName}
    workspaceClassName="brand-brain-workspace"
    proTip="Confirm high-impact Brand context so Discovery Intelligence stays relevant."
    proTipAction="Review Brand DNA"
    proTipHref="#brand-brain"
    statusLabel="Discovery ready"
  >
    {params.authError ? <p className="auth-error" role="alert">{params.authError}</p> : null}
    <BrandBrainClient brandId={data.brandId}/>
  </KairoShell>;
}
