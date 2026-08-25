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
import { KairoIcon } from "../../../kairo-icons";
import styles from "./content-frozen.module.css";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ filter?: string; q?: string }>;

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
  const query = (requested.q ?? "").trim();
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
  const searchNeedle = query.toLowerCase();
  const visible = content.items.filter((item) => {
    if (filter !== "all" && item.bucket !== filter) return false;
    if (!searchNeedle) return true;
    return [item.title, item.channel, item.format, item.statusLabel]
      .some((value) => value.toLowerCase().includes(searchNeedle));
  });
  const base = `/brands/${encodeURIComponent(brand.id)}`;
  const home = `/?workspace=${encodeURIComponent(brand.workspaceId)}&brand=${encodeURIComponent(brand.id)}`;

  return (
    <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Content" pageLabel="Content">
      <main id="kairo-main-content" tabIndex={-1} className={`${styles.main} workspace-main`}>
        <header className={styles.header}>
          <h1>Content</h1>
          <p>All your content in one place. Track, review and publish.</p>
        </header>

        <div className={styles.toolbar}>
          <form className={styles.searchForm} action={`${base}/content`} method="get" role="search">
            <KairoIcon name="search" />
            <label className="sr-only" htmlFor="content-search">Search content</label>
            <input id="content-search" type="search" name="q" defaultValue={query} placeholder="Search content" />
            {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
          </form>
        </div>

        <nav className={styles.filters} aria-label="Filter content by status">
          {CONTENT_FILTERS.map((value) => {
            const href = contentFilterHref(base, value, query);
            return (
              <Link
                href={href}
                key={value}
                data-active={value === filter || undefined}
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
                  <div className={styles.thumbnail} aria-label={`${friendlyFormat(item.format)} preview unavailable`}>
                    <KairoIcon name={isMotionFormat(item.format) ? "video" : "photo"} />
                    <span className={styles.formatBadge}>{friendlyFormat(item.format)}</span>
                  </div>
                  <div className={styles.copy}>
                    <div className={styles.meta}>
                      <span className={styles.channel}>{friendlyChannel(item.channel)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{friendlyFormat(item.format)}</span>
                    </div>
                    <h2>{item.title}</h2>
                    <div className={styles.itemFooter}>
                      <span className={styles.status} data-status={item.bucket}>{item.statusLabel}</span>
                      <time className={styles.updated} dateTime={item.updatedAt}>{updatedLabel(item.updatedAt)}</time>
                    </div>
                  </div>
                </Link>
                <Link className={`${item.actionLabel === "Publish" ? "primary-button" : "secondary-button"} ${styles.action}`} href={actionHref}>
                  {item.actionLabel}
                </Link>
              </article>
            );
          }) : (
            <div className={styles.empty}>
              <h2>{emptyTitle(content.items.length, filter, query)}</h2>
              <p>{content.items.length
                ? "Try a different search or status filter."
                : "Start from My Idea or For You on Home. New content will appear here when it is ready to work on."}</p>
              {content.items.length ? (
                <Link className="secondary-button" href={`${base}/content`}>Clear filters</Link>
              ) : (
                <Link className="primary-button" href={home}>Go to Home</Link>
              )}
            </div>
          )}
        </section>
      </main>
    </KairoProductShell>
  );
}

function contentFilterHref(base: string, filter: (typeof CONTENT_FILTERS)[number], query: string) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (query) params.set("q", query);
  const suffix = params.toString();
  return `${base}/content${suffix ? `?${suffix}` : ""}`;
}

function friendlyChannel(value: string) {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function friendlyFormat(value: string) {
  const normalised = value.toLowerCase();
  if (normalised === "image") return "Post";
  return friendlyChannel(value);
}

function isMotionFormat(value: string) {
  const normalised = value.toLowerCase();
  return normalised.includes("reel") || normalised.includes("video");
}

function updatedLabel(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Updated recently";
  return `Updated ${new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: date.getUTCFullYear() === new Date().getUTCFullYear() ? undefined : "numeric", timeZone: "UTC" }).format(date)}`;
}

function emptyTitle(total: number, filter: (typeof CONTENT_FILTERS)[number], query: string) {
  if (!total) return "No content yet.";
  if (query) return `No content matches “${query}”.`;
  return `No ${contentFilterLabel(filter).toLowerCase()} content right now.`;
}
