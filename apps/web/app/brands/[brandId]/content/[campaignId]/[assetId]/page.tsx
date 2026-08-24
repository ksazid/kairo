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
import {
  approveContentAction,
  generateVersionAction,
  reviewContentAction,
  saveVersionAction,
  scheduleContentAction,
} from "../../../campaigns/actions";
import { ScheduleForm } from "../../../campaigns/[campaignId]/schedule-form";
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
      <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Content">
        <main id="kairo-main-content" tabIndex={-1} className={`${styles.main} workspace-main`}>
          <section className={styles.empty}>
            <p className="eyebrow">Content</p>
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
  const isReel = asset.format.toLowerCase() === "reel";
  const contentScope = { workspaceId: detail.campaign.workspaceId, brandId: brand.id, campaignId, assetId: asset.id };
  const currentDisplay = isReel ? readableContent(current.content, contentScope) : current.content;
  const carouselReview = isCarousel
    ? await getCarouselReview(brand.id, campaignId, asset.id).catch(() => null)
    : null;
  const eligibleAccounts = channelAccounts.filter((account) => account.channel === asset.channel && account.status === "connected");
  const approvedAccount = approval
    ? channelAccounts.find((account) => account.channel === approval.destination.channel && account.accountRef === approval.destination.accountRef && account.status === "connected")
    : null;
  const base = `/brands/${encodeURIComponent(brand.id)}`;
  const carouselHref = `${base}/campaigns/${encodeURIComponent(campaignId)}/carousel/${encodeURIComponent(asset.id)}`;
  const videoHref = `${base}/campaigns/${encodeURIComponent(campaignId)}/video/${encodeURIComponent(asset.id)}`;

  return (
    <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Content">
      <main id="kairo-main-content" tabIndex={-1} className={`${styles.main} workspace-main`}>
        <div className={styles.topline}>
          <Link className="back-link" href={`${base}/content`}>← Content</Link>
          <span className={styles.version}>Version {current.version}</span>
        </div>

        <header className={styles.header}>
          <div>
            <p className="eyebrow">Content Detail</p>
            <h1>{asset.topic}</h1>
            <p>{asset.channel} · {asset.format} · {asset.audience}</p>
          </div>
          <details className={styles.context}>
            <summary>Context</summary>
            <strong>{detail.campaign.name}</strong>
            <p>{detail.campaign.objective}</p>
            <Link href={`${base}/ideas/${encodeURIComponent(detail.campaign.ideaId)}`}>Inspect Research &amp; evidence</Link>
          </details>
        </header>

        {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
        {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

        <nav className={styles.tabs} aria-label="Content channel previews">
          {detail.assets.map(({ asset: candidate }) => {
            const href = `${base}/content/${encodeURIComponent(campaignId)}/${encodeURIComponent(candidate.id)}`;
            const selected = candidate.id === asset.id;
            return (
              <Link key={candidate.id} href={href} aria-current={selected ? "page" : undefined} data-active={selected || undefined}>
                <span>{candidate.channel}</span>
                <small>{candidate.format}</small>
              </Link>
            );
          })}
        </nav>

        <section className={styles.preview} aria-labelledby="preview-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className="eyebrow">Preview</p>
              <h2 id="preview-title">Exact current version</h2>
            </div>
            <span>{asset.channel} · {asset.format}</span>
          </div>

          {isCarousel ? (
            carouselReview?.slides.some((slide) => slide.renderedUrl) ? (
              <>
                <div className={styles.carouselPreview} aria-label="Rendered carousel slides">
                  {carouselReview.slides.map((slide, index) => slide.renderedUrl ? (
                    <figure key={slide.id}>
                      <img src={slide.renderedUrl} alt={`Rendered carousel slide ${index + 1}: ${slide.role}`} />
                      <figcaption>{index + 1} / {carouselReview.slides.length}</figcaption>
                    </figure>
                  ) : null)}
                </div>
                <div className={styles.previewFooter}>
                  <span>Render {carouselReview.renderVersionId} · asset version {carouselReview.assetVersion}</span>
                  <Link className="secondary-button" href={carouselHref}>Edit rendered carousel</Link>
                </div>
              </>
            ) : (
              <div className={styles.mediaBoundary}>
                <div>
                  <strong>Carousel render is not ready yet.</strong>
                  <p>Open the renderer to create or refresh the exact visual asset before final approval.</p>
                </div>
                <Link className="primary-button" href={carouselHref}>Open carousel preview</Link>
              </div>
            )
          ) : isReel ? (
            <div className={styles.mediaBoundary}>
              <div>
                <strong>Reel project · version {current.version}</strong>
                <p>{currentDisplay}</p>
                <small>Kairo will not represent a storyboard as a finished video. Open the Reel surface for scene-level editing and render readiness.</small>
              </div>
              <Link className="secondary-button" href={videoHref}>Open Reel preview</Link>
            </div>
          ) : (
            <div className={styles.copyPreview}>
              <span>{asset.channel}</span>
              <p>{currentDisplay}</p>
              <small>CTA · {asset.cta}</small>
            </div>
          )}
        </section>

        <section className={styles.editor} aria-labelledby="edit-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className="eyebrow">Edit</p>
              <h2 id="edit-title">Improve the current version</h2>
            </div>
          </div>

          {isReel ? (
            <div className={styles.editBoundary}>
              <p>Scene copy, timing and order stay in the Reel editor so the structured video contract remains valid.</p>
              <Link className="secondary-button" href={videoHref}>Edit Reel</Link>
            </div>
          ) : isCarousel ? (
            <div className={styles.editBoundary}>
              <p>Slide copy, imagery, order and template stay with the exact carousel render.</p>
              <Link className="secondary-button" href={carouselHref}>Edit carousel</Link>
            </div>
          ) : (
            <form action={saveVersionAction.bind(null, brand.id, campaignId, asset.id, asset.currentVersion)} className={styles.editForm}>
              <label htmlFor={`content-${asset.id}`}>Content</label>
              <textarea id={`content-${asset.id}`} name="content" defaultValue={current.content} required maxLength={50000} rows={10} />
              <div>
                <span>Saving creates a new immutable version and clears approval for the changed version.</span>
                <button className="primary-button" type="submit">Save new version</button>
              </div>
            </form>
          )}

          <details className={styles.disclosure}>
            <summary>
              <span><strong>AI assistance</strong><small>Optional transformations for this exact version.</small></span>
              <span>Open</span>
            </summary>
            <div className={styles.aiActions}>
              {[["simplify", "Simplify"], ["strengthen-opening", "Strengthen opening"], ["alternative", "Alternative"]].map(([action, label]) => (
                <form action={generateVersionAction.bind(null, brand.id, campaignId, asset.id, asset.currentVersion, action!)} key={action}>
                  <button className="secondary-button" type="submit">{label}</button>
                </form>
              ))}
            </div>
          </details>

          <details className={styles.disclosure}>
            <summary>
              <span><strong>Versions &amp; evidence</strong><small>{versions.length} versions · {detail.campaign.supportingClaimIds.length} supporting Claims</small></span>
              <span>Open</span>
            </summary>
            <div className={styles.versions}>
              {[...versions].reverse().map((version) => (
                <article key={version.id}>
                  <strong>Version {version.version} · {version.action}</strong>
                  <p>{isReel ? readableContent(version.content, contentScope) : version.content}</p>
                  <small>{version.actor} · {new Date(version.createdAt).toLocaleString()}</small>
                </article>
              ))}
            </div>
          </details>
        </section>

        <section className={styles.approval} aria-labelledby="approval-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className="eyebrow">Review &amp; approval</p>
              <h2 id="approval-title">Approve the exact version you see</h2>
            </div>
            <span className={styles.reviewState}>
              {approval ? "Approved & locked" : review?.status === "passed" ? "Ready for approval" : review?.status === "revision-required" ? "Revision required" : "Needs review"}
            </span>
          </div>

          {review ? (
            <details className={styles.disclosure}>
              <summary>
                <span>
                  <strong>Review findings</strong>
                  <small>{review.truth.passed ? "Truth Gate passed" : "Truth Gate blocked"}{review.critic ? ` · Critic ${review.critic.score}/100` : ""}</small>
                </span>
                <span>Inspect</span>
              </summary>
              <div className={styles.findings}>
                <p>{review.truth.passed ? "Truth Gate passed — evidence requirements satisfied." : "Truth Gate blocked approval."}</p>
                {review.truth.findings.map((finding, index) => <p key={`${finding.code}-${index}`}><strong>{finding.code.replaceAll("-", " ")}</strong> · {finding.message}</p>)}
                {review.critic?.findings.map((finding, index) => <p key={`${finding.code}-${index}`}><strong>{finding.severity}</strong> · {finding.message}</p>)}
              </div>
            </details>
          ) : null}

          {!review || review.status === "revision-required" ? (
            <form action={reviewContentAction.bind(null, brand.id, campaignId, asset.id, current.version)}>
              <button className="secondary-button" type="submit">{review ? "Review revised version" : "Review current version"}</button>
            </form>
          ) : null}

          {review?.status === "passed" && !approval ? (
            eligibleAccounts.length ? (
              <form className={styles.approveForm} action={approveContentAction.bind(null, brand.id, campaignId, asset.id, current.version, asset.channel)}>
                <label>
                  Publish destination
                  <select name="accountRef" required defaultValue={eligibleAccounts[0]?.accountRef}>
                    {eligibleAccounts.map((account) => <option value={account.accountRef} key={account.id}>{account.displayName}</option>)}
                  </select>
                </label>
                <button className="primary-button" type="submit">Approve &amp; Lock</button>
                <p>This freezes version {current.version} for the selected destination. Editing later creates a new version that needs review again.</p>
              </form>
            ) : (
              <div className={styles.connectionNeeded}>
                <div>
                  <strong>Connect a publishing destination before approval.</strong>
                  <p>Kairo will not ask for raw account references or silently choose another destination.</p>
                </div>
                <Link className="secondary-button" href={`${base}/brain#channels`}>Open Brand Channels</Link>
              </div>
            )
          ) : null}

          {approval ? (
            <>
              <div className={styles.lockRecord}>
                <strong>Approved &amp; locked</strong>
                <p>{approval.destination.channel} · {approvedAccount?.displayName ?? approval.destination.accountRef} · {new Date(approval.approvedAt).toLocaleString()}</p>
                <small>Version {approval.version} is the exact approved version. Publication status changes only after the provider settles.</small>
              </div>
              {approvedAccount && approvedAccount.capabilities.length ? (
                <ScheduleForm account={approvedAccount} action={scheduleContentAction.bind(null, brand.id, campaignId, asset.id)} />
              ) : (
                <div className={styles.connectionNeeded}>
                  <strong>Publishing destination needs attention.</strong>
                  <p>Reconnect or restore the approved destination before Kairo can publish or schedule this locked version.</p>
                </div>
              )}
            </>
          ) : null}
        </section>
      </main>
    </KairoProductShell>
  );
}
