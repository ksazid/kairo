import Link from "next/link";
import { reviewableVideoProjectContent } from "@kairo/domain/video-project";
import {
  getBrand,
  getCampaignDetail,
  getChannelAccounts,
  getContentReviewStatus,
} from "../../../../../../src/lib/kairo-api";
import { getCarouselReview } from "../../../../../../src/lib/carousel-review-api";
import { KairoProductShell } from "../../../../../kairo-product-shell";
import { KairoIcon, type KairoIconName } from "../../../../../kairo-icons";
import {
  approveContentAction,
  reviewContentAction,
  scheduleContentAction,
} from "../../../campaigns/actions";
import { ContentScheduleControl } from "./content-schedule-control";
import shellStyles from "../../content-reference-shell.module.css";
import styles from "./content-detail.module.css";

type Params = Promise<{ brandId: string; campaignId: string; assetId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;

function readableContent(
  content: string,
  scope: { workspaceId: string; brandId: string; campaignId: string; assetId: string },
) {
  try {
    return reviewableVideoProjectContent(content, scope);
  } catch {
    return content;
  }
}

export default async function ContentDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { brandId, campaignId, assetId } = await params;
  const messages = await searchParams;
  const [brand, detail, channelAccounts] = await Promise.all([
    getBrand(brandId),
    getCampaignDetail(brandId, campaignId),
    getChannelAccounts(brandId).catch(() => []),
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

  const entry = detail.assets.find(({ asset }) => asset.id === assetId);
  if (!entry) {
    return (
      <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Content" pageLabel="Content" variant="content-reference">
        <main id="kairo-main-content" tabIndex={-1} className={`${styles.main} ${shellStyles.shellBoundary}`}>
          <section className={styles.notFound}>
            <h1>Content not found.</h1>
            <Link href={`/brands/${encodeURIComponent(brand.id)}/content`}>Back to content</Link>
          </section>
        </main>
      </KairoProductShell>
    );
  }

  const { asset, versions } = entry;
  const current = versions.at(-1)!;
  const status = await getContentReviewStatus(brand.id, asset.id).catch(() => ({ review: null, approval: null }));
  const review = status.review?.versionId === current.id ? status.review : null;
  const approval = status.approval?.versionId === current.id ? status.approval : null;
  const isCarousel = asset.format.toLowerCase() === "carousel";
  const isMotion = /reel|video|short/i.test(asset.format);
  const contentScope = { workspaceId: detail.campaign.workspaceId, brandId: brand.id, campaignId, assetId: asset.id };
  const currentDisplay = isMotion ? readableContent(current.content, contentScope) : current.content;
  const caption = extractCaption(current.content) ?? extractCaption(currentDisplay) ?? asset.topic;
  const carouselReview = isCarousel ? await getCarouselReview(brand.id, campaignId, asset.id).catch(() => null) : null;
  const renderedSlides = carouselReview?.slides.filter((slide) => Boolean(slide.renderedUrl)) ?? [];
  const eligibleAccounts = channelAccounts.filter((account) => account.channel === asset.channel && account.status === "connected");
  const approvedAccount = approval
    ? channelAccounts.find((account) => account.channel === approval.destination.channel && account.accountRef === approval.destination.accountRef && account.status === "connected")
    : null;
  const base = `/brands/${encodeURIComponent(brand.id)}`;
  const carouselHref = `${base}/campaigns/${encodeURIComponent(campaignId)}/carousel/${encodeURIComponent(asset.id)}`;
  const videoHref = `${base}/campaigns/${encodeURIComponent(campaignId)}/video/${encodeURIComponent(asset.id)}`;
  const editorHref = isCarousel ? carouselHref : isMotion ? videoHref : `${base}/campaigns/${encodeURIComponent(campaignId)}`;
  const displayState = approval
    ? { label: "Approved", key: "approved" as const, detail: "This exact version is locked for publishing." }
    : review?.status === "passed"
      ? { label: "Needs you", key: "needs-you" as const, detail: "Looks good. Approve and lock this content." }
      : review?.status === "revision-required"
        ? { label: "Needs you", key: "needs-you" as const, detail: "Make the required changes before approval." }
        : { label: "Draft", key: "draft" as const, detail: "Run a readiness check before approval." };
  const uniqueDestinations = Array.from(new Map(detail.assets.map((candidate) => [candidate.asset.channel, candidate])).values());
  const visibleDestinations = uniqueDestinations.slice(0, 3);
  const hiddenDestinations = uniqueDestinations.slice(3);
  const username = brand.name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 28) || "brand";
  const cards = isCarousel && carouselReview?.slides.length
    ? carouselReview.slides.slice(0, 5).map((slide, index) => ({ number: index + 1, label: slide.headline || slide.role || `Card ${index + 1}` }))
    : [{ number: 1, label: asset.topic }];

  return (
    <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Content" pageLabel="Content" variant="content-reference">
      <main id="kairo-main-content" tabIndex={-1} className={`${styles.main} ${shellStyles.shellBoundary}`}>
        <div className={styles.topActions}>
          <Link className={styles.backLink} href={`${base}/content`}><KairoIcon name="arrow-left" />Back to content</Link>
          <div className={styles.topActionButtons}>
            <details className={styles.moreActions}>
              <summary>More actions <span>⌄</span></summary>
              <div>
                <Link href={editorHref}>Edit content</Link>
                {!review || review.status === "revision-required" ? (
                  <form action={reviewContentAction.bind(null, brand.id, campaignId, asset.id, current.version)}>
                    <button type="submit">{review ? "Check again" : "Check readiness"}</button>
                  </form>
                ) : null}
                <Link href={`${base}/calendar`}>Open Calendar</Link>
              </div>
            </details>
            <button className={styles.bookmarkButton} type="button" aria-label="Save content" title="Saving this content is not configured yet"><KairoIcon name="bookmark" /></button>
          </div>
        </div>

        {messages.notice ? <p className={styles.notice} data-kind="success" role="status">{messages.notice}</p> : null}
        {messages.error ? <p className={styles.notice} data-kind="error" role="alert">{messages.error}</p> : null}

        <div className={styles.contentGrid}>
          <div className={styles.leftColumn}>
            <header className={styles.assetHeader}>
              <div className={styles.titleRow}>
                <h1>{asset.topic}</h1>
                <Link href={editorHref} aria-label="Edit content title"><KairoIcon name="edit" /></Link>
              </div>
              <p>{summaryLine(currentDisplay, detail.campaign.objective)}</p>
              <div className={styles.assetMeta}>
                <span className={styles.platformMeta} data-channel={asset.channel}><KairoIcon name={platformIcon(asset.channel)} />{platformLabel(asset.channel)}</span>
                <span className={styles.formatMeta}>{formatLabel(asset.format)}</span>
                <span className={styles.stateMeta} data-state={displayState.key}>{displayState.label}</span>
                <span className={styles.updatedMeta}>Last updated {relativeTime(current.createdAt)} by {current.actor === "user" ? "You" : "Kairo"}</span>
              </div>
            </header>

            <section id="preview" className={styles.previewPanel} aria-labelledby="preview-title">
              <div className={styles.previewHeading}>
                <div>
                  <h2 id="preview-title">Preview</h2>
                  <p>Review how your content will look across platforms.</p>
                </div>
                <div className={styles.deviceToggle} aria-label="Preview device">
                  <button className={styles.deviceActive} type="button" aria-label="Mobile preview"><KairoIcon name="device-mobile" /></button>
                  <button type="button" aria-label="Desktop preview" title="Desktop preview is not configured yet"><KairoIcon name="device-desktop" /></button>
                </div>
              </div>

              <nav className={styles.destinationTabs} aria-label="Selected destination previews">
                {visibleDestinations.map(({ asset: candidate }) => {
                  const selected = candidate.id === asset.id;
                  return (
                    <Link
                      key={candidate.id}
                      href={`${base}/content/${encodeURIComponent(campaignId)}/${encodeURIComponent(candidate.id)}`}
                      data-active={selected || undefined}
                      aria-current={selected ? "page" : undefined}
                      data-channel={candidate.channel}
                    >
                      <KairoIcon name={platformIcon(candidate.channel)} />
                      <span>{platformLabel(candidate.channel)}</span>
                    </Link>
                  );
                })}
                {hiddenDestinations.length ? (
                  <details className={styles.moreDestinations}>
                    <summary>More <span>⌄</span></summary>
                    <div>
                      {hiddenDestinations.map(({ asset: candidate }) => (
                        <Link key={candidate.id} href={`${base}/content/${encodeURIComponent(campaignId)}/${encodeURIComponent(candidate.id)}`}>{platformLabel(candidate.channel)}</Link>
                      ))}
                    </div>
                  </details>
                ) : null}
              </nav>

              <div className={styles.socialWrap}>
                <article className={styles.socialCard} aria-label={`${platformLabel(asset.channel)} social preview`}>
                  <header className={styles.socialHeader}>
                    <div className={styles.socialIdentity}>
                      <span className={styles.brandAvatar}>{brand.name.slice(0, 1).toUpperCase()}</span>
                      <strong>{username}</strong>
                    </div>
                    <KairoIcon name="more" />
                  </header>

                  <div className={styles.mediaStage} data-format={isMotion ? "motion" : isCarousel ? "carousel" : "text"}>
                    {isCarousel ? (
                      renderedSlides.length ? (
                        <div className={styles.carouselTrack} aria-label="Rendered carousel slides">
                          {renderedSlides.map((slide, index) => (
                            <figure key={slide.id}>
                              <img src={slide.renderedUrl!} alt={`Carousel card ${index + 1}: ${slide.headline || slide.role}`} />
                              <span className={styles.slideCount}>{index + 1}/{renderedSlides.length}</span>
                            </figure>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.unavailableMedia}>
                          <KairoIcon name="image" />
                          <strong>Carousel preview not ready</strong>
                          <p>Render the real carousel to preview it here.</p>
                          <Link href={carouselHref}>Open carousel editor</Link>
                        </div>
                      )
                    ) : isMotion ? (
                      <div className={styles.unavailableMedia}>
                        <KairoIcon name="video" />
                        <strong>Video preview not ready</strong>
                        <p>Kairo will show a finished video only after a real render is available.</p>
                        <Link href={videoHref}>Open video editor</Link>
                      </div>
                    ) : (
                      <div className={styles.textPreview}><p>{currentDisplay}</p></div>
                    )}
                    {isCarousel && renderedSlides.length > 1 ? <span className={styles.nextCard} aria-hidden="true"><KairoIcon name="arrow-right" /></span> : null}
                  </div>

                  <div className={styles.socialActions} aria-hidden="true">
                    <span><KairoIcon name="heart" /></span>
                    <span><KairoIcon name="comment" /></span>
                    <span><KairoIcon name="send" /></span>
                    <span className={styles.socialBookmark}><KairoIcon name="bookmark" /></span>
                  </div>
                  <div className={styles.socialCaption}>
                    <strong>Likes unavailable</strong>
                    <p><b>{username}</b> {truncate(caption, 118)}</p>
                  </div>
                </article>

                {isCarousel && (carouselReview?.slides.length ?? 0) > 1 ? (
                  <div className={styles.carouselDots} aria-label="Carousel position">
                    {carouselReview!.slides.slice(0, 6).map((slide, index) => <span key={slide.id} data-active={index === 0 || undefined} />)}
                  </div>
                ) : null}
              </div>

              <div className={styles.aiSection}>
                <div>
                  <h3>AI assistance</h3>
                  <p>Improve your content with Kairo.</p>
                </div>
                <div className={styles.aiActions}>
                  <Link href={editorHref}><KairoIcon name="sparkles" />Improve copy</Link>
                  <Link href={editorHref}><KairoIcon name="edit" />Shorten</Link>
                  <Link href={editorHref}><KairoIcon name="results" />Change tone</Link>
                  <Link href={editorHref}><KairoIcon name="plus" />More ideas</Link>
                </div>
              </div>
            </section>
          </div>

          <aside className={styles.rightRail} aria-label="Content context">
            <section className={styles.railCard}>
              <header><h2>Content details</h2><Link href={editorHref}>Edit</Link></header>
              <dl className={styles.detailsList}>
                <div><dt>Type</dt><dd>{formatLabel(asset.format)}</dd></div>
                <div><dt>Topic</dt><dd>{topicLabel(asset.topic, detail.campaign.name)}</dd></div>
                <div><dt>Goal</dt><dd>{detail.campaign.objective || "Not set"}</dd></div>
                <div><dt>Audience</dt><dd>{asset.audience || "Not set"}</dd></div>
                <div><dt>Language</dt><dd>Not set</dd></div>
                <div><dt>Tone</dt><dd>Not set</dd></div>
              </dl>
            </section>

            <section className={styles.railCard}>
              <header className={styles.performanceHeader}><h2>Performance potential <KairoIcon name="info" /></h2></header>
              <div className={styles.performanceRows}>
                <div><span><KairoIcon name="eye" />Impact</span><strong>Not available</strong></div>
                <div><span><KairoIcon name="target" />Fit</span><strong>Not available</strong></div>
              </div>
              <p className={styles.performanceNote}>Shown only when supported by real Brand and performance evidence.</p>
            </section>

            <section className={`${styles.railCard} ${styles.cardsRail}`}>
              <header><h2>{isCarousel ? `Cards (${cards.length})` : "Content"}</h2><Link href={editorHref}>Edit</Link></header>
              <ol>
                {cards.map((card, index) => (
                  <li key={`${card.number}-${card.label}`} data-active={index === 0 || undefined}><span>{card.number}</span><p>{truncate(card.label, 56)}</p></li>
                ))}
              </ol>
            </section>
          </aside>
        </div>

        <section className={styles.approvalBar} data-state={displayState.key} aria-label="Approval actions">
          <div className={styles.approvalState}>
            <span><KairoIcon name={displayState.key === "approved" ? "lock" : displayState.key === "needs-you" ? "shield" : "warning"} /></span>
            <div><strong>{approval ? "Approved & locked" : review?.status === "passed" ? "Ready to approve" : review?.status === "revision-required" ? "Changes needed" : "Needs review"}</strong><p>{displayState.detail}</p></div>
          </div>

          <div className={styles.approvalActions}>
            {review?.status === "passed" && !approval && eligibleAccounts.length === 1 ? (
              <form action={approveContentAction.bind(null, brand.id, campaignId, asset.id, current.version, asset.channel)}>
                <input type="hidden" name="accountRef" value={eligibleAccounts[0]!.accountRef} />
                <button className={styles.approveButton} type="submit"><KairoIcon name="lock" />Approve &amp; Lock</button>
              </form>
            ) : (
              <button className={styles.approveButton} type="button" aria-disabled="true" title={approval ? "Already approved" : eligibleAccounts.length > 1 ? "Choose one publishing account before approval" : "Run readiness and connect the destination before approval"}><KairoIcon name="lock" />{approval ? "Approved & Locked" : "Approve & Lock"}</button>
            )}

            {approval && approvedAccount ? (
              <ContentScheduleControl account={approvedAccount} contentType={scheduleType(asset.format)} action={scheduleContentAction.bind(null, brand.id, campaignId, asset.id)} />
            ) : (
              <button className={styles.scheduleDisabled} type="button" aria-disabled="true" title="Approve and lock before scheduling"><KairoIcon name="calendar" />Schedule <span>⌄</span></button>
            )}
          </div>
        </section>
      </main>
    </KairoProductShell>
  );
}

function platformIcon(value: string): KairoIconName {
  if (value === "instagram") return "instagram";
  if (value === "facebook") return "facebook";
  if (value === "linkedin") return "linkedin";
  if (value === "youtube") return "youtube";
  return "brand";
}

function platformLabel(value: string) {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatLabel(value: string) {
  if (value.toLowerCase() === "image") return "Post";
  return platformLabel(value);
}

function summaryLine(content: string, fallback: string) {
  const compact = content.replace(/\s+/g, " ").trim();
  const parsed = extractCaption(compact);
  const value = parsed || compact || fallback;
  return truncate(value, 82);
}

function extractCaption(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    for (const key of ["caption", "copy", "text", "body", "description"]) {
      if (typeof parsed[key] === "string" && parsed[key]!.trim()) return parsed[key]!.trim();
    }
  } catch {
    // Plain reviewable copy is already suitable for the destination caption.
  }
  return trimmed;
}

function truncate(value: string, limit: number) {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > limit ? `${compact.slice(0, limit - 1).trimEnd()}…` : compact;
}

function topicLabel(assetTopic: string, campaignName: string) {
  const campaign = campaignName.trim();
  if (campaign && campaign.length <= 40) return campaign;
  return truncate(assetTopic, 40);
}

function relativeTime(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "recently";
  const diff = Math.max(0, Date.now() - time);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function scheduleType(format: string): "text" | "image" | "video" | "carousel" {
  const normal = format.toLowerCase();
  if (normal === "carousel") return "carousel";
  if (/reel|video|short/.test(normal)) return "video";
  if (/image|post/.test(normal)) return "image";
  return "text";
}
