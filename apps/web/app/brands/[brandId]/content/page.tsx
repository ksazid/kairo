import Link from "next/link";
import {
  getBrand,
  getCalendar,
  getCampaignDetail,
  getCampaigns,
  getContentReviewStatus,
  type ContentReviewStatusView,
} from "../../../../src/lib/kairo-api";
import {
  CONTENT_FILTERS,
  buildContentList,
  contentFilterLabel,
  isContentFilter,
} from "../../../../src/lib/content-view-model";
import { KairoProductShell } from "../../../kairo-product-shell";
import styles from "./content.module.css";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ filter?: string }>;

export default async function ContentPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { brandId } = await params;
  const requested = await searchParams;
  const filter = isContentFilter(requested.filter) ? requested.filter : "all";
  const [brand, campaigns, commands] = await Promise.all([
    getBrand(brandId),
    getCampaigns(brandId),
    getCalendar(brandId).catch(() => []),
  ]);

  if (!brand) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>Brand not found.</h1>
          <Link className="primary-button" href="/">Return Home</Link>
        </section>
      </main>
    );
  }

  const details = await Promise.all(
    campaigns.map((campaign) => getCampaignDetail(brand.id, campaign.id)),
  );
  const assets = details.flatMap((detail) => detail.assets.map(({ asset }) => asset));
  const reviews = new Map<string, ContentReviewStatusView | null>(
    await Promise.all(
      assets.map(async (asset) => [
        asset.id,
        await getContentReviewStatus(brand.id, asset.id).catch(() => null),
      ] as const),
    ),
  );
  const content = buildContentList(details, reviews, commands);
  const visible = filter === "all"
    ? content.items
    : content.items.filter((item) => item.bucket === filter);
  const base = `/brands/${encodeURIComponent(brand.id)}`;
  const home = `/?workspace=${encodeURIComponent(brand.workspaceId)}&brand=${encodeURIComponent(brand.id)}`;

  return (
    <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Content">
      <main id="kairo-main-content" tabIndex={-1} className={`${styles.main} workspace-main`}>
        <header className={styles.header}>
          <div>
            <p className="eyebrow">Content</p>
            <h1>Review what Kairo has prepared.</h1>
            <p>Open one item to edit, preview the exact version, approve it, then publish now or schedule it.</p>
          </div>
        </header>

        <nav className={styles.filters} aria-label="Filter content">
          {CONTENT_FILTERS.map((value) => {
            const href = value === "all" ? `${base}/content` : `${base}/content?filter=${encodeURIComponent(value)}`;
            return (
              <Link
                href={href}
                key={value}
                className={value === filter ? styles.activeFilter : undefined}
                aria-current={value === filter ? "page" : undefined}
              >
                <span>{contentFilterLabel(value)}</span>
                <small>{content.counts[value]}</small>
              </Link>
            );
          })}
        </nav>

        <section className={styles.list} aria-labelledby="content-list-title">
          <div className="sr-only" id="content-list-title">{contentFilterLabel(filter)} content</div>
          {visible.length ? visible.map((item) => {
            const contentHref = `${base}/content/${encodeURIComponent(item.campaignId)}/${encodeURIComponent(item.assetId)}`;
            const actionHref = item.actionLabel === "See results"
              ? `${base}/performance?asset=${encodeURIComponent(item.assetId)}`
              : contentHref;
            return (
              <article className={styles.item} key={item.assetId} data-attention={item.attention || undefined}>
                <Link className={styles.itemBody} href={contentHref}>
                  <div className={styles.formatMark} aria-hidden="true">
                    {item.format.slice(0, 1).toUpperCase()}
                  </div>
                  <div className={styles.copy}>
                    <div className={styles.meta}>
                      <span>{item.channel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.format}</span>
                      <span aria-hidden="true">·</span>
                      <span>Version {item.version}</span>
                    </div>
                    <h2>{item.title}</h2>
                    <span className={styles.status}>{item.statusLabel}</span>
                  </div>
                </Link>
                <Link className={item.actionLabel === "Publish" ? "primary-button" : "secondary-button"} href={actionHref}>
                  {item.actionLabel}
                </Link>
              </article>
            );
          }) : (
            <div className={styles.empty}>
              <h2>{content.items.length ? `No ${contentFilterLabel(filter).toLowerCase()} content right now.` : "No content yet."}</h2>
              <p>{content.items.length ? "Choose another filter to see the rest of your content." : "Start from My Idea or For You on Home. Kairo will keep Campaign and Research lineage under the hood."}</p>
              {content.items.length ? <Link className="secondary-button" href={`${base}/content`}>Show all content</Link> : <Link className="primary-button" href={home}>Go to Home</Link>}
            </div>
          )}
        </section>
      </main>
    </KairoProductShell>
  );
}
