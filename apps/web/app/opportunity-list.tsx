import type { BrandOpportunityDto } from "@kairo/contracts";
import { opportunityAction } from "./opportunity-actions";
import { RecommendationSeen } from "./recommendation-seen";
import styles from "./flow-pages.module.css";

export function OpportunityList({
  brandId,
  opportunities,
  returnTo,
  emptyTitle = "No strong opportunity right now.",
  emptyBody = "Kairo found no candidate that cleared the current relevance, evidence and audience-fit thresholds. It will not fill this space with weak recommendations.",
}: {
  brandId: string;
  opportunities: BrandOpportunityDto[];
  returnTo: string;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  if (opportunities.length === 0) {
    return <section className={`${styles.empty} ${styles.section}`} aria-live="polite"><p className={styles.eyebrow}>Hunter</p><h3>{emptyTitle}</h3><p>{emptyBody}</p></section>;
  }

  return <div className={styles.list}>{opportunities.map((item) => <OpportunityCard key={item.id} brandId={brandId} item={item} returnTo={returnTo} />)}</div>;
}

function OpportunityCard({ brandId, item, returnTo }: { brandId: string; item: BrandOpportunityDto; returnTo: string }) {
  const relevance = scoreLabel(item.scores.relevance);
  const evidence = scoreLabel(item.scores.evidence);
  const freshness = relativeTime(item.createdAt);
  const terminal = item.status === "ignored" || item.status === "developing";
  const titleId = `opportunity-${item.id}-title`;

  return (
    <article className={`${styles.card} ${terminal ? styles.cardMuted : ""}`} aria-labelledby={titleId}>
      <RecommendationSeen brandId={brandId} opportunityId={item.id} />
      <div className={styles.meta} aria-label="Opportunity signals">
        <span className={styles.chip}>{relevance.label} relevance</span>
        <span className={styles.chip}>{evidence.label} evidence</span>
        <span className={`${styles.chip} ${styles.chipNeutral}`}>{freshness}</span>
        {item.status !== "new" ? <span className={`${styles.chip} ${styles.chipNeutral}`}>{statusLabel(item.status)}</span> : null}
      </div>
      <h3 id={titleId}>{item.title}</h3>
      <p className={styles.rationale}>{item.rationale}</p>
      <div className={styles.whyNow}><span>Why now</span><p>{item.whyNow}</p></div>
      <div className={styles.actions}>
        {!terminal ? <form action={opportunityAction.bind(null, brandId, item.id, "develop", returnTo)}><button className={styles.primary} type="submit">Develop</button></form> : null}
        {item.status === "new" ? <form action={opportunityAction.bind(null, brandId, item.id, "save", returnTo)}><button className={styles.secondary} type="submit">Save</button></form> : null}
        {!terminal ? <form action={opportunityAction.bind(null, brandId, item.id, "ignore", returnTo)}><button className={styles.text} type="submit">Ignore</button></form> : null}
        {item.status === "developing" ? <p className={styles.actionNote}>Ready for deeper Research and Angle development.</p> : null}
      </div>
    </article>
  );
}

function scoreLabel(value: number): { label: string; tone: string } {
  if (value >= .8) return { label: "High", tone: "strong" };
  if (value >= .6) return { label: "Medium", tone: "medium" };
  return { label: "Low", tone: "neutral" };
}

function statusLabel(status: BrandOpportunityDto["status"]): string {
  if (status === "saved") return "Saved";
  if (status === "ignored") return "Ignored";
  if (status === "developing") return "Developing";
  return "New";
}

function relativeTime(value: string): string {
  const delta = Date.now() - Date.parse(value);
  if (!Number.isFinite(delta) || delta < 0) return "New";
  const hours = Math.floor(delta / 3_600_000);
  if (hours < 1) return "New";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1d ago" : `${days}d ago`;
}
