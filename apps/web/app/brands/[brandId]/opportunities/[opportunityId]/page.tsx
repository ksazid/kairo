import Link from "next/link";
import { getBrand, getOpportunities } from "../../../../../src/lib/kairo-api";
import { KairoProductShell, KairoScopePicker } from "../../../../kairo-product-shell";
import { opportunityAction } from "../../../../opportunity-actions";
import { homeFormatLabel } from "../../../../../src/lib/home-creation-format";
import { ForYouCreateAction } from "../../../../for-you-create-action";
import styles from "../../../../home-vs85.module.css";

export default async function OpportunityPreview({ params }: { params: Promise<{ brandId: string; opportunityId: string }> }) {
  const { brandId, opportunityId } = await params;
  const [brand, opportunities] = await Promise.all([getBrand(brandId), getOpportunities(brandId)]);
  const item = opportunities.find((candidate) => candidate.id === opportunityId);
  if (!brand || !item) return <main className="auth-page"><section className="auth-card"><h1>Opportunity not found.</h1><Link className="primary-button" href={`/brands/${encodeURIComponent(brandId)}/discover`}>Back to opportunities</Link></section></main>;
  const format = item.details?.recommendedFormat === "carousel" ? "carousel" : item.details?.recommendedFormat === "reel" ? "reel" : "image";
  return <KairoProductShell brandId={brand.id} active="Discover"><main className="workspace-main discovery-main">
    <header className="topbar"><div><p className="eyebrow">Opportunity preview</p><Link className="text-action" href={`/brands/${encodeURIComponent(brand.id)}/discover`}>← Back to Opportunities</Link><h1>{item.title}</h1><p className="lede">Review the recommendation and its evidence before asking Kairo to generate content.</p></div><KairoScopePicker brandName={brand.name} meta="Private relevance · public evidence" /></header>
    <section className="opportunity-card"><div className="opportunity-meta"><span className="signal-chip strong">{Math.round(item.scores.relevance * 100)}% relevance</span><span className="signal-chip medium">{Math.round(item.scores.audienceFit * 100)}% audience fit</span><span className="signal-chip neutral">{homeFormatLabel(format)}</span></div><h2>{item.title}</h2><p className="opportunity-rationale">{item.rationale}</p><div className="why-now"><span>Why now</span><p>{item.whyNow}</p></div><div className="why-now"><span>Suggested direction</span><p>{item.developmentDirection}</p></div><div className="why-now"><span>Suggested angle</span><p>{item.details?.proposedAngle ?? "Kairo will refine this during generation."}</p></div><div className="why-now"><span>Evidence references</span><p>{item.details?.supportingSourceIds?.length ? `${item.details.supportingSourceIds.length} public source reference(s)` : "No source reference available."}</p></div><div className="opportunity-actions"><ForYouCreateAction brandId={brand.id} opportunityId={item.id} title={item.title} direction={item.developmentDirection} initialFormat={format} /><form action={opportunityAction.bind(null, brand.id, item.id, "save", `/brands/${brand.id}/opportunities/${item.id}`)}><button className="secondary-button" type="submit">Save idea</button></form></div></section>
  </main></KairoProductShell>;
}
