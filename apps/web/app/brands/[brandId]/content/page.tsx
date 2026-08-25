import Link from "next/link";
import {
  getBrand,
  getCalendar,
  getCampaignDetail,
  getCampaigns,
  getContentReviewStatus,
  type ContentReviewStatusView,
} from "../../../../src/lib/kairo-api";
import { getCarouselReview } from "../../../../src/lib/carousel-review-api";
import {
  CONTENT_FILTERS,
  buildContentList,
  contentFilterLabel,
  isContentFilter,
  type ContentListItem,
} from "../../../../src/lib/content-view-model";
import { KairoProductShell } from "../../../kairo-product-shell";
import { KairoIcon, type KairoIconName } from "../../../kairo-icons";
import shellStyles from "./content-reference-shell.module.css";
import styles from "./content.module.css";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ filter?: string; q?: string; page?: string; size?: string }>;

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
  const pageSize = [10, 20, 50].includes(Number(requested.size)) ? Number(requested.size) : 10;
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

  const details = await Promise.all(campaigns.map((campaign) => getCampaignDetail(brand.id, campaign.id)));
  const assets = details.flatMap((detail) => detail.assets.map(({ asset }) => asset));
  const reviews = new Map<string, ContentReviewStatusView | null>(
    await Promise.all(
      assets.map(async (asset) => [asset.id, await getContentReviewStatus(brand.id, asset.id).catch(() => null)] as const),
    ),
  );
  const content = buildContentList(details, reviews, commands);
  const searchNeedle = query.toLowerCase();
  const filtered = content.items.filter((item) => {
    if (filter !== "all" && item.bucket !== filter) return false;
    if (!searchNeedle) return true;
    return [item.title, item.summary, item.channel, item.format, item.statusLabel]
      .some((value) => value.toLowerCase().includes(searchNeedle));
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = Number.parseInt(requested.page ?? "1", 10);
  const currentPage = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visible = filtered.slice(startIndex, startIndex + pageSize);
  const thumbnails = new Map<string, string | null>(
    await Promise.all(visible.map(async (item) => {
      if (item.format.toLowerCase() !== "carousel") return [item.assetId, null] as const;
      const review = await getCarouselReview(brand.id, item.campaignId, item.assetId).catch(() => null);
      return [item.assetId, review?.slides.find((slide) => Boolean(slide.renderedUrl))?.renderedUrl ?? null] as const;
    })),
  );
  const base = `/brands/${encodeURIComponent(brand.id)}`;
  const home = `/?workspace=${encodeURIComponent(brand.workspaceId)}&brand=${encodeURIComponent(brand.id)}`;
  const firstShown = filtered.length ? startIndex + 1 : 0;
  const lastShown = Math.min(startIndex + visible.length, filtered.length);

  return (
    <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Content" pageLabel="Content" variant="content-reference">
      <main id="kairo-main-content" tabIndex={-1} className={`${styles.main} ${shellStyles.shellBoundary}`}>
        <header className={styles.pageHeader}>
          <h1>Content</h1>
          <p>All your content in one place. Track, review and publish.</p>
        </header>

        <div className={styles.toolbar}>
          <form className={styles.searchForm} action={`${base}/content`} method="get" role="search">
            <KairoIcon name="search" />
            <label className="sr-only" htmlFor="content-search">Search content</label>
            <input id="content-search" type="search" name="q" defaultValue={query} placeholder="Search content..." />
            {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
            {pageSize !== 10 ? <input type="hidden" name="size" value={pageSize} /> : null}
          </form>

          <div className={styles.toolbarActions}>
            <details className={styles.filterControl}>
              <summary><KairoIcon name="filter" /><span>Filters</span></summary>
              <div className={styles.filterPopover}>
                <strong>Status</strong>
                {CONTENT_FILTERS.map((value) => (
                  <Link key={value} href={contentHref(base, { filter: value, q: query, size: pageSize })}>
                    {contentFilterLabel(value)} <span>{content.counts[value]}</span>
                  </Link>
                ))}
              </div>
            </details>
            <div className={styles.viewSwitch} aria-label="Content view">
              <span className={styles.activeView} aria-label="List view" aria-current="true"><KairoIcon name="list" /></span>
              <button type="button" aria-label="Grid view" title="Grid view is not available yet" disabled><KairoIcon name="grid" /></button>
            </div>
          </div>
        </div>

        <nav className={styles.tabs} aria-label="Filter content by status">
          {CONTENT_FILTERS.map((value) => (
            <Link
              href={contentHref(base, { filter: value, q: query, size: pageSize })}
              key={value}
              data-active={value === filter || undefined}
              aria-current={value === filter ? "page" : undefined}
            >
              <span>{contentFilterLabel(value)}</span>
              {value !== "all" && content.counts[value] > 0 ? <small data-filter={value}>{content.counts[value]}</small> : null}
            </Link>
          ))}
        </nav>

        <section className={styles.tableShell} aria-labelledby="content-list-title">
          <h2 className="sr-only" id="content-list-title">{contentFilterLabel(filter)} content</h2>
          <div className={styles.tableHeader} aria-hidden="true">
            <span>Content</span>
            <span>Channel / Format</span>
            <span>Status</span>
            <span>Last Updated</span>
            <span />
          </div>

          <div className={styles.rows}>
            {visible.length ? visible.map((item) => {
              const href = `${base}/content/${encodeURIComponent(item.campaignId)}/${encodeURIComponent(item.assetId)}`;
              const thumbnail = thumbnails.get(item.assetId) ?? null;
              return (
                <article className={styles.row} key={item.assetId} data-status={item.bucket}>
                  <Link className={styles.contentCell} href={href}>
                    <div className={styles.thumbnail} data-motion={isMotionFormat(item.format) || undefined}>
                      {thumbnail ? <img src={thumbnail} alt="" /> : <KairoIcon name={isMotionFormat(item.format) ? "video" : "image"} />}
                      <span className={styles.thumbnailType}><KairoIcon name={isMotionFormat(item.format) ? "video" : "image"} /></span>
                    </div>
                    <div className={styles.contentCopy}>
                      <h3>{item.title}</h3>
                      <p>{item.summary}</p>
                    </div>
                  </Link>

                  <div className={styles.channelCell} data-channel={item.channel.toLowerCase()}>
                    <div><KairoIcon name={channelIcon(item.channel)} /><span>{channelLabel(item.channel)}</span></div>
                    <span className={styles.formatPill} data-format={formatKey(item.format)}>{formatLabel(item.format)}</span>
                  </div>

                  <div className={styles.statusCell}>
                    <span className={styles.statusPill} data-status={item.bucket}>{item.statusLabel}</span>
                    <span>{statusDetail(item)}</span>
                  </div>

                  <div className={styles.updatedCell}>
                    <time dateTime={item.updatedAt}>{relativeTime(item.updatedAt)}</time>
                    <span>by {item.updatedBy}</span>
                  </div>

                  <button className={styles.moreButton} type="button" aria-label={`More actions for ${item.title}`} title="More actions"><KairoIcon name="more" /></button>
                </article>
              );
            }) : (
              <div className={styles.empty}>
                <h3>{emptyTitle(content.items.length, filter, query)}</h3>
                <p>{content.items.length ? "Try a different search or status filter." : "Start from My Idea or For You on Home. New content will appear here when it is ready."}</p>
                <Link className="secondary-button" href={content.items.length ? `${base}/content` : home}>{content.items.length ? "Clear filters" : "Go to Home"}</Link>
              </div>
            )}
          </div>

          {filtered.length ? (
            <footer className={styles.pagination}>
              <span>Showing {firstShown} to {lastShown} of {filtered.length} results</span>
              <nav className={styles.pageLinks} aria-label="Content pages">
                <Link aria-label="Previous page" aria-disabled={currentPage === 1} data-disabled={currentPage === 1 || undefined} href={contentHref(base, { filter, q: query, size: pageSize, page: Math.max(1, currentPage - 1) })}><KairoIcon name="arrow-left" /></Link>
                {pageNumbers(currentPage, totalPages).map((page) => (
                  <Link key={page} data-active={page === currentPage || undefined} aria-current={page === currentPage ? "page" : undefined} href={contentHref(base, { filter, q: query, size: pageSize, page })}>{page}</Link>
                ))}
                <Link aria-label="Next page" aria-disabled={currentPage === totalPages} data-disabled={currentPage === totalPages || undefined} href={contentHref(base, { filter, q: query, size: pageSize, page: Math.min(totalPages, currentPage + 1) })}><KairoIcon name="arrow-right" /></Link>
              </nav>
              <details className={styles.pageSize}>
                <summary>{pageSize} / page <span>⌄</span></summary>
                <div>
                  {[10, 20, 50].map((size) => <Link key={size} href={contentHref(base, { filter, q: query, size, page: 1 })}>{size} / page</Link>)}
                </div>
              </details>
            </footer>
          ) : null}
        </section>
      </main>
    </KairoProductShell>
  );
}

function contentHref(base: string, input: { filter?: string; q?: string; size?: number; page?: number }) {
  const params = new URLSearchParams();
  if (input.filter && input.filter !== "all") params.set("filter", input.filter);
  if (input.q) params.set("q", input.q);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.size && input.size !== 10) params.set("size", String(input.size));
  const suffix = params.toString();
  return `${base}/content${suffix ? `?${suffix}` : ""}`;
}

function channelIcon(value: string): KairoIconName {
  const normal = value.toLowerCase();
  if (normal === "instagram") return "instagram";
  if (normal === "facebook") return "facebook";
  if (normal === "linkedin") return "linkedin";
  if (normal === "youtube") return "youtube";
  return "brand";
}

function channelLabel(value: string) {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatLabel(value: string) {
  const normal = value.toLowerCase();
  if (normal === "image") return "Post";
  if (normal === "video") return "Video";
  return channelLabel(value);
}

function formatKey(value: string) {
  const normal = value.toLowerCase();
  if (["carousel", "reel", "short"].includes(normal)) return "purple";
  return "green";
}

function isMotionFormat(value: string) {
  return /reel|video|short/i.test(value);
}

function statusDetail(item: ContentListItem) {
  if (item.bucket === "scheduled" && item.scheduledFor) return scheduledLabel(item.scheduledFor);
  return item.detailLabel;
}

function scheduledLabel(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Scheduled";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((target - today) / 86400000);
  const time = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date);
  if (dayDiff === 0) return `Today, ${time}`;
  if (dayDiff === 1) return `Tomorrow, ${time}`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function relativeTime(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "Recently";
  const diff = Math.max(0, Date.now() - time);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(time));
}

function pageNumbers(current: number, total: number) {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
  const start = Math.min(Math.max(current - 2, 1), total - 4);
  return Array.from({ length: 5 }, (_, index) => start + index);
}

function emptyTitle(total: number, filter: (typeof CONTENT_FILTERS)[number], query: string) {
  if (!total) return "No content yet.";
  if (query) return `No content matches “${query}”.`;
  return `No ${contentFilterLabel(filter).toLowerCase()} content right now.`;
}
