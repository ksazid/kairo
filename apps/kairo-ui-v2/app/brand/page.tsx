import { getBrandBrainData } from "../../lib/brand-brain-api";
import { KairoShell } from "../kairo-shell";
import { BrandBrainClient } from "./brand-brain-client";

type SearchParams = Promise<{ brand?: string; authError?: string }>;

export default async function BrandBrainPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const data = await getBrandBrainData(params.brand);
  const statusLabel = data.activation?.status === "ready-for-hunter"
    ? "Discovery ready"
    : data.activation?.status === "needs-review"
      ? "Needs review"
      : data.activation?.status === "needs-enrichment"
        ? "Needs enrichment"
        : data.authenticated ? "Brand setup" : "Preview mode";

  return <KairoShell
    active="Brand"
    authenticated={data.authenticated}
    brandId={data.brandId}
    brandName={data.brandName}
    workspaceClassName="brand-brain-workspace"
    proTip="Confirm high-impact Brand context so Discovery Intelligence stays relevant."
    proTipAction="Review Brand DNA"
    proTipHref="#brand-brain"
    statusLabel={statusLabel}
  >
    {params.authError ? <p className="auth-error" role="alert">{params.authError}</p> : null}
    <BrandBrainClient brandId={data.brandId} activation={data.activation}/>
  </KairoShell>;
}
