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
  generateVersionAction,
  reviewContentAction,
  saveVersionAction,
  scheduleContentAction,
} from "../../../campaigns/actions";
import { ScheduleForm } from "../../../campaigns/[campaignId]/schedule-form";
import styles from "./content-detail-frozen.module.css";

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
      <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Content" pageLabel="Content">
        <main id="kairo-main-content" tabIndex={-1} className={`${styles.main} workspace-main`}>
          <section className="auth-card">
            <h1>Content not found.</h1>
            <Link className="secondary-button" href={`/brands/${encodeURIComponent(brand.id)}/content`}>Back to Content</Link>
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
  const isReel = ["reel", "video"].includes(asset.format.toLowerCase());
  const contentScope = { workspaceId: detail.campaign.workspaceId, brandId: brand.id, campaignId, assetId: asset.id };
  const currentDisplay = isReel ? readableContent(current.content, contentScope) : current.content;
  const caption = extractCaption(current.content) ?? (isReel ? extractCaption(currentDisplay) : null) ?? (isCarousel ? asset.topic : currentDisplay);
  const carouselReview = isCarousel
    ? await getCarouselReview(brand.id, campaignId, asset.id).catch(() => null)
    : null;
  const renderedSlides = carouselReview?.slides.filter((slide) => Boolean(slide.renderedUrl)) ?? [];
  const eligibleAccounts = channelAccounts.filter((account) => account.channel === asset.channel && account.status === "connected");
  const approvedAccount = approval
    ? channelAccounts.find((account) => account.channel === approval.destination.channel && account.accountRef === approval.destination.accountRef && account.status === "connected")
    : null;
  const base = `/brands/${encodeURIComponent(brand.id)}`;
  const carouselHref = `${base}/campaigns/${encodeURIComponent(campaignId)}/carousel/${encodeURIComponent(asset.id)}`;
  const videoHref = `${base}/campaigns/${encodeURIComponent(campaignId)}/video/${encodeURIComponent(asset.id)}`;
  const editHref = isCarousel ? carouselHref : isReel ? videoHref : "#edit-content";
  const state = approval
    ? { label: "Approved & locked", key: "approved" as const }
    : review?.status === "passed"
      ? { label: "Ready for approval", key: "ready" as const }
      : review?.status === "revision-required"
        ? { label: "Changes needed", key: "attention" as const }
        : { label: "Ready to check", key: "neutral" as const };

  return (
    <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Content" pageLabel="Content">
      <main id="kairo-main-content" tabIndex={-1} className={`${styles.main} workspace-main`}>
        <div className={styles.backRow}>
          <Link className={styles.backLink} href={`${base}/content`}><KairoIcon name="arrow-left" />Back to Content</Link>
        </div>

        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <h1>{asset.topic}</h1>
            <p>Preview the destination experience, make changes, then approve exactly what will be published.</p>
            <div className={styles.headerMeta}>
              <span className={styles.metaPill}>{platformLabel(asset.channel)}</span>
              <span className={styles.metaPill}>{formatLabel(asset.format)}</span>
              <span className={styles.statePill} data-state={state.key}>{state.label}</span>
            </div>
          </div>
        </header>

        {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
        {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

        <nav className={styles.tabs} aria-label="Selected destination previews">
          {detail.assets.map(({ asset: candidate }) => {
            const href = `${base}/content/${encodeURIComponent(campaignId)}/${encodeURIComponent(candidate.id)}`;
            const selected = candidate.id === asset.id;
            return (
              <Link key={candidate.id} href={href} aria-current={selected ? "page" : undefined} data-active={selected || undefined}>
                <KairoIcon name={platformIcon(candidate.channel)} />
                <span>{platformLabel(candidate.channel)} · {formatLabel(candidate.format)}</span>
              </Link>
            );
          })}
        </nav>

        <section className={styles.previewSection} aria-label="Content preview and approval">
          <article className={styles.previewCard} aria-label={`${platformLabel(asset.channel)} preview`}>
            <div className={styles.previewCardHeader}>
              <div className={styles.previewIdentity}>
                <span className={styles.avatar}>{brand.name.slice(0, 1).toUpperCase()}</span>
                <div><strong>{brand.name}</strong><small>{platformContext(asset.channel)}</small></div>
              </div>
              <span className={styles.previewMore} aria-hidden="true"><KairoIcon name="more" /></span>
            </div>

            <div className={styles.mediaStage} data-channel={asset.channel.toLowerCase()}>
              {isCarousel ? (
                renderedSlides.length ? (
                  <div className={styles.carouselViewport} aria-label="Carousel slides">
                    {renderedSlides.map((slide, index) => (
                      <figure className={styles.slide} key={slide.id}>
                        <img src={slide.renderedUrl} alt={`Carousel slide ${index + 1}: ${slide.role}`} />
                        <span className={styles.slideCount}>{index + 1} / {renderedSlides.length}</span>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <UnavailableMedia
                    title="Carousel preview isn’t ready yet."
                    detail="Open the carousel editor to render the visual before final approval."
                    href={carouselHref}
                    action="Open carousel editor"
                  />
                )
              ) : isReel ? (
                <UnavailableMedia
                  title="Video preview isn’t ready yet."
                  detail="Kairo will show a finished video here only after a real render is available."
                  href={videoHref}
                  action="Open Reel editor"
                  video
                />
              ) : (
                <div className={styles.textMedia}><p>{currentDisplay}</p></div>
              )}
            </div>

            <div className={styles.socialActions} aria-label="Destination chrome preview">
              <span className={styles.socialAction}><KairoIcon name="heart" /><span>Like</span></span>
              <span className={styles.socialAction}><KairoIcon name="comment" /><span>Comment</span></span>
              <span className={styles.socialAction}><KairoIcon name="send" /><span>Share</span></span>
            </div>
            <div className={styles.caption}><strong>{brand.name}</strong>{truncateCaption(caption)}</div>

            <div className={styles.previewTools}>
              <Link className="secondary-button" href={editHref}>Edit</Link>
              <button className={`secondary-button ${styles.disabledTool}`} type="button" disabled title="Replace media is not configured for this surface yet">Replace media</button>
              <a className="secondary-button" href="#ai-assistance">AI assist</a>
            </div>
          </article>

          <aside className={styles.actionPanel} aria-labelledby="approval-title">
            <h2 id="approval-title">Review & approve</h2>
            <p>Approval locks the exact content shown for the selected destination.</p>

            <div className={styles.readiness} data-state={state.key}>
              <KairoIcon name={state.key === "attention" ? "warning" : state.key === "neutral" ? "refresh" : "check"} />
              <span>{state.label}</span>
            </div>

            {review?.status === "revision-required" ? (
              <div className={styles.findings} aria-label="Content changes needed">
                {[...review.truth.findings, ...(review.critic?.findings ?? [])].slice(0, 4).map((finding, index) => (
                  <div className={styles.finding} key={index}>{finding.message}</div>
                ))}
              </div>
            ) : null}

            <div className={styles.primaryStack}>
              {!review || review.status === "revision-required" ? (
                <form action={reviewContentAction.bind(null, brand.id, campaignId, asset.id, current.version)}>
                  <button className="secondary-button" type="submit">{review ? "Check again" : "Check readiness"}</button>
                </form>
              ) : null}

              {review?.status === "passed" && !approval ? (
                eligibleAccounts.length ? (
                  <form className={styles.approveForm} action={approveContentAction.bind(null, brand.id, campaignId, asset.id, current.version, asset.channel)}>
                    <label>
                      Publish to
                      <select name="accountRef" required defaultValue={eligibleAccounts[0]?.accountRef}>
                        {eligibleAccounts.map((account) => <option value={account.accountRef} key={account.id}>{account.displayName}</option>)}
                      </select>
                    </label>
                    <button className="primary-button" type="submit">Approve & Lock</button>
                  </form>
                ) : (
                  <div className={styles.connectionNeeded}>
                    <strong>Connect this destination before approval.</strong>
                    <p>Kairo needs a real connected account for {platformLabel(asset.channel)}.</p>
                    <Link className="secondary-button" href={`${base}/brain#channels`}>Open Brand Channels</Link>
                  </div>
                )
              ) : null}

              {approval ? (
                approvedAccount ? (
                  <ScheduleForm account={approvedAccount} action={scheduleContentAction.bind(null, brand.id, campaignId, asset.id)} />
                ) : (
                  <div className={styles.connectionNeeded}>
                    <strong>Publishing destination needs attention.</strong>
                    <p>Reconnect the approved destination before publishing or scheduling.</p>
                    <Link className="secondary-button" href={`${base}/brain#channels`}>Reconnect destination</Link>
                  </div>
                )
              ) : null}
            </div>
          </aside>
        </section>

        <section id="edit-content" className={`${styles.section} ${styles.editPanel}`} aria-labelledby="edit-title">
          <div className={styles.sectionHeader}>
            <h2 id="edit-title">Edit content</h2>
            <p>Keep editing focused on what the audience will actually see.</p>
          </div>

          {isReel ? (
            <div className={styles.editBoundary}>
              <p>Scene copy, timing and media stay together in the Reel editor.</p>
              <Link className="secondary-button" href={videoHref}>Edit Reel</Link>
            </div>
          ) : isCarousel ? (
            <div className={styles.editBoundary}>
              <p>Slide copy, imagery and order stay together in the carousel editor.</p>
              <Link className="secondary-button" href={carouselHref}>Edit carousel</Link>
            </div>
          ) : (
            <form action={saveVersionAction.bind(null, brand.id, campaignId, asset.id, asset.currentVersion)} className={styles.editForm}>
              <label htmlFor={`content-${asset.id}`}>Content</label>
              <textarea id={`content-${asset.id}`} name="content" defaultValue={current.content} required maxLength={50000} rows={10} />
              <div className={styles.editFormFooter}><button className="primary-button" type="submit">Save changes</button></div>
            </form>
          )}

          <details id="ai-assistance" className={styles.aiDisclosure}>
            <summary><span>AI assistance</span><span>Open</span></summary>
            <div className={styles.aiActions}>
              {[["simplify", "Simplify"], ["strengthen-opening", "Strengthen opening"], ["alternative", "Try an alternative"]].map(([action, label]) => (
                <form action={generateVersionAction.bind(null, brand.id, campaignId, asset.id, asset.currentVersion, action!)} key={action}>
                  <button className="secondary-button" type="submit">{label}</button>
                </form>
              ))}
            </div>
          </details>
        </section>

        <section className={`${styles.section} ${styles.detailsPanel}`} aria-labelledby="details-title">
          <div className={styles.sectionHeader}>
            <h2 id="details-title">Details & history</h2>
            <p>Useful context stays available without crowding the preview.</p>
          </div>
          <details className={styles.historyDisclosure}>
            <summary><span>Content history</span><span>Open</span></summary>
            <div className={styles.historyList}>
              {[...versions].reverse().map((version) => (
                <article className={styles.historyItem} key={version.id}>
                  <strong>Revision {version.version}</strong>
                  <p>{isReel ? readableContent(version.content, contentScope) : extractCaption(version.content) ?? version.content}</p>
                  <small>{new Date(version.createdAt).toLocaleString()}</small>
                </article>
              ))}
            </div>
          </details>
          <details className={styles.historyDisclosure}>
            <summary><span>Campaign context</span><span>Open</span></summary>
            <div className={styles.historyItem}>
              <strong>{detail.campaign.name}</strong>
              <p>{detail.campaign.objective}</p>
            </div>
          </details>
        </section>
      </main>
    </KairoProductShell>
  );
}

function UnavailableMedia({
  title,
  detail,
  href,
  action,
  video = false,
}: {
  title: string;
  detail: string;
  href: string;
  action: string;
  video?: boolean;
}) {
  return (
    <div className={styles.unavailableMedia}>
      <KairoIcon name={video ? "video" : "photo"} />
      <strong>{title}</strong>
      <p>{detail}</p>
      <Link className="secondary-button" href={href}>{action}</Link>
    </div>
  );
}

function platformLabel(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "instagram") return "Instagram";
  if (normalized === "youtube") return "YouTube";
  if (normalized === "linkedin") return "LinkedIn";
  if (normalized === "facebook") return "Facebook";
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function platformContext(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "instagram") return "Post preview";
  if (normalized === "youtube") return "Video preview";
  if (normalized === "linkedin") return "Post preview";
  return `${platformLabel(value)} preview`;
}

function platformIcon(value: string): KairoIconName {
  const normalized = value.toLowerCase();
  if (normalized === "instagram") return "instagram";
  if (normalized === "facebook") return "facebook";
  if (normalized === "youtube") return "video";
  return "brand";
}

function formatLabel(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "image") return "Post";
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function extractCaption(value: string): string | null {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const project = (parsed.project && typeof parsed.project === "object" ? parsed.project : parsed) as Record<string, unknown>;
    const caption = project.caption;
    return typeof caption === "string" && caption.trim() ? caption.trim() : null;
  } catch {
    return null;
  }
}

function truncateCaption(value: string) {
  const clean = value.trim();
  return clean.length > 520 ? `${clean.slice(0, 517)}…` : clean;
}
