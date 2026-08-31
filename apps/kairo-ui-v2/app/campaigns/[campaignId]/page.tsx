import { notFound } from "next/navigation";
import { getContentData } from "../../../lib/api";
import { campaignFallback, toCampaignItems } from "../../../lib/campaigns";
import { KairoShell } from "../../kairo-shell";
import { CampaignPreviewClient } from "./campaign-preview-client";

type Params = Promise<{ campaignId: string }>;
type SearchParams = Promise<{ brand?: string }>;

export default async function CampaignPreviewPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ campaignId }, query] = await Promise.all([params, searchParams]);
  const data = await getContentData(query.brand);
  const projected = toCampaignItems(data.details, data.reviews, data.commands);
  const campaigns = projected.length ? projected : campaignFallback();
  const campaign = campaigns.find((candidate) => candidate.id === campaignId);
  if (!campaign) notFound();
  const campaignsHref = data.brandId ? `/campaigns?brand=${encodeURIComponent(data.brandId)}` : "/campaigns";
  const webUrl = (process.env.NEXT_PUBLIC_KAIRO_WEB_URL ?? "https://kairo-two-plum.vercel.app").replace(/\/$/, "");
  const legacyHref = data.brandId ? `${webUrl}/brands/${encodeURIComponent(data.brandId)}/campaigns/${encodeURIComponent(campaign.id)}` : webUrl;

  return <KairoShell
    active="Campaigns"
    authenticated={data.authenticated}
    brandId={data.brandId}
    brandName={data.brandName}
    workspaceClassName="campaign-preview-workspace"
    proTip="Great campaigns start with a clear objective and consistent message across channels."
    proTipAction="Learn more"
    proTipHref="#campaign-overview"
  >
    <CampaignPreviewClient campaign={campaign} brandId={data.brandId} authenticated={data.authenticated} campaignsHref={campaignsHref} legacyHref={legacyHref}/>
  </KairoShell>;
}
