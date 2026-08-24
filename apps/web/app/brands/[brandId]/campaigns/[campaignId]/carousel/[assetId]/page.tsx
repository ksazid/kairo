import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getBrand,
  getCampaignDetail,
  getSession,
} from "../../../../../../../src/lib/kairo-api";
import {
  ensureCarouselReview,
  type CarouselQualityFinding,
} from "../../../../../../../src/lib/carousel-review-api";
import {
  KairoProductShell,
  KairoScopePicker,
} from "../../../../../../kairo-product-shell";
import {
  approveCarouselAction,
  changeStyleAction,
  editSlideAction,
  moveSlideAction,
  regenerateSlideAction,
  replaceSlideImageAction,
} from "../actions";
import styles from "./review.module.css";

type Params = Promise<{ brandId: string; campaignId: string; assetId: string }>;
type Search = Promise<{ notice?: string; error?: string }>;

export default async function CarouselReviewPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const session = await getSession();
  if (!session) redirect("/");
  const { brandId, campaignId, assetId } = await params,
    messages = await searchParams;
  const [brand, detail] = await Promise.all([
    getBrand(brandId),
    getCampaignDetail(brandId, campaignId),
  ]);
  if (!brand || !detail) redirect("/");
  const workspace = session.workspaces.find((x) => x.id === brand.workspaceId);
  if (!workspace) redirect("/");
  const asset = detail.assets.find((x) => x.asset.id === assetId)?.asset;
  if (!asset || asset.format.toLowerCase() !== "carousel")
    redirect(
      `/brands/${encodeURIComponent(brandId)}/content/${encodeURIComponent(campaignId)}/${encodeURIComponent(assetId)}`,
    );
  const review = await ensureCarouselReview(brandId, campaignId, assetId);
  const ordered = review.slides.map((x) => x.id),
    blocking = review.qualitySummary.errors > 0 || review.status !== "ready";
  const contentHref = `/brands/${encodeURIComponent(brandId)}/content/${encodeURIComponent(campaignId)}/${encodeURIComponent(assetId)}`;

  return (
    <KairoProductShell
      brandId={brandId}
      workspaceId={workspace.id}
      active="Content"
      mobileActive="Content"
    >
      <main id="kairo-main-content" tabIndex={-1} className={styles.main}>
        <header className={styles.hero}>
          <div>
            <Link className={styles.back} href={contentHref}>
              ← Content preview
            </Link>
            <p className="eyebrow">Carousel preview</p>
            <h1>{asset.topic}</h1>
            <p>
              Review the exact 1080 × 1350 rendered media. Every edit creates a
              new asset/render version before the content can be locked.
            </p>
          </div>
          <KairoScopePicker
            brandName={brand.name}
            meta={`Asset version ${review.assetVersion}`}
          />
        </header>
        {messages.notice ? (
          <p className="notice success" role="status">
            {messages.notice}
          </p>
        ) : null}
        {messages.error ? (
          <p className="notice error" role="alert">
            {messages.error}
          </p>
        ) : null}
        <section className={styles.toolbar} aria-labelledby="style-title">
          <div>
            <h2 id="style-title">Template &amp; style</h2>
            <p>
              Changes apply to the full carousel while slide copy and imagery
              stay editable.
            </p>
          </div>
          <form
            action={changeStyleAction.bind(
              null,
              brandId,
              campaignId,
              assetId,
              review.assetVersion,
            )}
          >
            <label>
              Template
              <select name="templateId" defaultValue={review.templateId}>
                {review.templates.map((x) => (
                  <option value={x.id} key={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Style
              <select name="styleId" defaultValue={review.styleId}>
                {review.styles.map((x) => (
                  <option value={x.id} key={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
            <button className="secondary-button" type="submit">
              Apply and render
            </button>
          </form>
        </section>
        <section className={styles.quality} aria-labelledby="quality-title">
          <div>
            <h2 id="quality-title">Quality check</h2>
            <p aria-live="polite">
              {review.qualitySummary.errors} errors ·{" "}
              {review.qualitySummary.warnings} warnings ·{" "}
              {review.qualitySummary.advisories} advisories
            </p>
          </div>
          <FindingList
            findings={
              review.qualityFindings ??
              review.slides.flatMap((x) => x.qualityFindings)
            }
          />
        </section>
        <section aria-labelledby="slides-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className="eyebrow">Rendered slides</p>
              <h2 id="slides-title">Preview and edit every slide</h2>
            </div>
            <span>
              {review.slides.length} slides · {review.status}
            </span>
          </div>
          <ol className={styles.slides}>
            {review.slides.map((slide, index) => (
              <li className={styles.slide} key={slide.id}>
                <figure>
                  <div className={styles.preview}>
                    {slide.renderedUrl ? (
                      <img
                        src={slide.renderedUrl}
                        alt={`Rendered slide ${index + 1}: ${slide.role}`}
                      />
                    ) : (
                      <span>Rendering…</span>
                    )}
                  </div>
                  <figcaption>
                    Slide {index + 1} · {slide.role}
                  </figcaption>
                </figure>
                <div className={styles.editor}>
                  <form
                    action={editSlideAction.bind(
                      null,
                      brandId,
                      campaignId,
                      assetId,
                      slide.id,
                      review.assetVersion,
                    )}
                  >
                    <label htmlFor={`headline-${slide.id}`}>Headline</label>
                    <input
                      id={`headline-${slide.id}`}
                      name="headline"
                      maxLength={240}
                      defaultValue={slide.headline}
                    />
                    <label htmlFor={`text-${slide.id}`}>Body</label>
                    <textarea
                      id={`text-${slide.id}`}
                      name="body"
                      rows={5}
                      maxLength={1200}
                      defaultValue={slide.body}
                    />
                    <button className="primary-button" type="submit">
                      Save slide text
                    </button>
                  </form>
                  <form
                    action={replaceSlideImageAction.bind(
                      null,
                      brandId,
                      campaignId,
                      assetId,
                      slide.id,
                      review.assetVersion,
                    )}
                  >
                    <label htmlFor={`image-${slide.id}`}>
                      Replacement image asset ID <span>optional</span>
                    </label>
                    <input
                      id={`image-${slide.id}`}
                      name="imageAssetId"
                      placeholder="Choose or paste an approved asset ID"
                    />
                    <button className="secondary-button" type="submit">
                      Replace image
                    </button>
                  </form>
                  <div
                    className={styles.actions}
                    aria-label={`Actions for slide ${index + 1}`}
                  >
                    <form
                      action={moveSlideAction.bind(
                        null,
                        brandId,
                        campaignId,
                        assetId,
                        review.assetVersion,
                        ordered,
                        slide.id,
                        "up",
                      )}
                    >
                      <button
                        className="tertiary-button"
                        disabled={index === 0}
                      >
                        Move earlier
                      </button>
                    </form>
                    <form
                      action={moveSlideAction.bind(
                        null,
                        brandId,
                        campaignId,
                        assetId,
                        review.assetVersion,
                        ordered,
                        slide.id,
                        "down",
                      )}
                    >
                      <button
                        className="tertiary-button"
                        disabled={index === review.slides.length - 1}
                      >
                        Move later
                      </button>
                    </form>
                    <form
                      action={regenerateSlideAction.bind(
                        null,
                        brandId,
                        campaignId,
                        assetId,
                        slide.id,
                        review.assetVersion,
                      )}
                    >
                      <button className="secondary-button">
                        Regenerate slide
                      </button>
                    </form>
                  </div>
                  <FindingList findings={slide.qualityFindings} />
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className={styles.approval} aria-labelledby="approval-title">
          <div>
            <p className="eyebrow">Final render lock</p>
            <h2 id="approval-title">Lock this exact carousel render</h2>
            <p>
              {blocking
                ? "Resolve blocking quality findings and wait for rendering before locking this render."
                : "The Content approval step will reference this exact render version."}
            </p>
            <small>
              Render {review.renderVersionId} · Asset version{" "}
              {review.assetVersion}
            </small>
          </div>
          {review.status === "approved" ? (
            <strong className={styles.approved}>
              Render locked{" "}
              {review.approvedAt
                ? new Date(review.approvedAt).toLocaleString()
                : ""}
            </strong>
          ) : (
            <form
              action={approveCarouselAction.bind(
                null,
                brandId,
                campaignId,
                assetId,
                review.assetVersion,
                review.renderVersionId,
              )}
            >
              <button className="primary-button" disabled={blocking}>
                Lock final render
              </button>
            </form>
          )}
        </section>
      </main>
    </KairoProductShell>
  );
}

function FindingList({ findings }: { findings: CarouselQualityFinding[] }) {
  return findings.length ? (
    <ul className={styles.findings}>
      {findings.map((x) => (
        <li data-severity={x.severity} key={x.id}>
          <strong>{x.severity}</strong>
          <span>{x.message}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className={styles.clear}>No quality findings.</p>
  );
}
