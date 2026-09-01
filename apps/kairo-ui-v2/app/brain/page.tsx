import { getBrandBrainData } from "../../lib/brand-brain-api";
import { buildBrandBrainPageViewModel, type BrandBrainActivationInput } from "../../lib/brand-brain-view-model";
import { KairoShell } from "../kairo-shell";
import { BrandBrainClient } from "./brand-brain-client";

const EMPTY_ACTIVATION: BrandBrainActivationInput = {
  brain: [],
  sources: [],
  status: "needs-enrichment",
  hunterReady: false,
  readiness: { status: "needs-enrichment", score: 0, brandIntelligenceScore: 0, evidenceCoverage: 0, confidence: 0, gaps: ["business", "offerings", "audience", "positioning", "topics", "boundaries"] },
  completeness: { score: 0, knownGroups: 0, totalGroups: 6 },
  fields: [],
  weakFields: ["identity.description", "identity.products-services", "audience.primary", "positioning.value-proposition", "content.pillars", "boundaries.excluded-topics"],
  recommendedSources: [
    { gap: "business", type: "website", label: "Add website", reason: "A website can establish what the Brand does." },
  ],
  evidenceSourceCount: 0,
  updatedAt: null,
};

type SearchParams = Promise<{ brand?: string; authError?: string }>;

export default async function BrainPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const data = await getBrandBrainData(params.brand);
  const model = buildBrandBrainPageViewModel(data.activation ?? EMPTY_ACTIVATION);

  return <KairoShell
    active="Brand"
    authenticated={data.authenticated}
    brandId={data.brandId}
    brandName={data.brandName}
    brandStatusLabel={data.authenticated ? model.activation.label : "Preview mode"}
    brandReady={data.authenticated && model.activation.hunterReady}
    workspaceClassName="brain-workspace"
    proTip="Confirm uncertain Brand context before Hunter relies on it."
    proTipAction="Review Brand Brain"
    proTipHref="#brain-sections"
  >
    {params.authError ? <p className="auth-error" role="alert">{params.authError}</p> : null}
    <BrandBrainClient model={model} brandId={data.brandId}/>
  </KairoShell>;
}
