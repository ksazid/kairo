import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Facebook, Grid2X2, Instagram, Linkedin, PlaySquare } from "lucide-react";
import { getContentData } from "../../../../lib/api";
import { contentFallback, toContentItems } from "../../../../lib/content";
import { KairoShell } from "../../../kairo-shell";
import { ContentPreviewClient } from "./content-preview-client";

type Params = Promise<{ campaignId: string; assetId: string }>;
type SearchParams = Promise<{ brand?: string }>;

export default async function ContentPreviewPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ campaignId, assetId }, query] = await Promise.all([params, searchParams]);
  const data = await getContentData(query.brand);
  const projected = toContentItems(data.details, data.reviews, data.commands);
  const items = projected.length ? projected : contentFallback();
  const item = items.find((candidate) => candidate.id === assetId && candidate.campaignId === campaignId);
  if (!item) notFound();
  const contentHref = data.brandId ? `/content?brand=${encodeURIComponent(data.brandId)}` : "/content";
  const webUrl = (process.env.NEXT_PUBLIC_KAIRO_WEB_URL ?? "https://kairo-two-plum.vercel.app").replace(/\/$/, "");
  const legacyHref = data.brandId ? `${webUrl}/brands/${encodeURIComponent(data.brandId)}/content/${encodeURIComponent(item.campaignId)}/${encodeURIComponent(item.id)}` : webUrl;
  const ChannelIcon = item.channel === "Facebook" ? Facebook : item.channel === "LinkedIn" ? Linkedin : Instagram;
  const FormatIcon = item.format === "carousel" ? Grid2X2 : item.format === "reel" ? PlaySquare : undefined;

  return <KairoShell active="Content" authenticated={data.authenticated} brandId={data.brandId} brandName={data.brandName} workspaceClassName="content-preview-workspace" proTip="Review the visual, caption and destination before approving content." proTipAction="Back to Content" proTipHref={contentHref}>
    <Link className="content-preview-back" href={contentHref}><ArrowLeft aria-hidden="true"/>Back to Content</Link>
    <header className="content-preview-header">
      <div><h1>{item.title}</h1><p>{item.summary}</p><div className="content-preview-meta"><span><ChannelIcon aria-hidden="true"/>{item.channel}</span><span>{FormatIcon ? <FormatIcon aria-hidden="true"/> : null}{item.formatLabel}</span><span className={`content-status status-${item.status}`}><i/>{item.statusLabel}</span><small>Last updated {formatDate(item.updatedAt)} by Kairo</small></div></div>
      {data.authenticated ? <a href={legacyHref}>Open full editor</a> : <Link href="/">Create content</Link>}
    </header>
    <ContentPreviewClient item={item} authenticated={data.authenticated} legacyHref={legacyHref}/>
  </KairoShell>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}
