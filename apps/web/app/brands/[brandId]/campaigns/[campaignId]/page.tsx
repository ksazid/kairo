import Link from "next/link";
import { getBrand, getCampaignDetail, getChannelAccounts, getContentReviewStatus } from "../../../../../src/lib/kairo-api";
import { getChannelAccountGroups } from "../../../../../src/lib/channel-account-groups-api";
import { KairoProductShell, KairoScopePicker } from "../../../../kairo-product-shell";
import {
  approveContentAction,
  createAssetAction,
  distributeGroupAction,
  generateVersionAction,
  reviewContentAction,
  saveVersionAction,
  scheduleContentAction,
} from "../actions";
import { GroupDistributionForm } from "./group-distribution-form";
import { ScheduleForm } from "./schedule-form";

type Params = Promise<{ brandId: string; campaignId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;

export default async function Studio({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { brandId, campaignId } = await params;
  const [brand, detail, channelAccounts, accountGroups, messages] = await Promise.all([
    getBrand(brandId),
    getCampaignDetail(brandId, campaignId),
    getChannelAccounts(brandId),
    getChannelAccountGroups(brandId),
    searchParams,
  ]);

  if (!brand) {
    return <main className="auth-page"><section className="auth-card"><h1>Brand not found.</h1><Link className="primary-button" href="/">Return to Today</Link></section></main>;
  }

  const reviewStatuses = new Map(
    await Promise.all(
      detail.assets.map(async ({ asset }) => [asset.id, await getContentReviewStatus(brand.id, asset.id)] as const),
    ),
  );

  return (
    <KairoProductShell brandId={brand.id} active="Content Studio">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main studio-main">
        <div className="studio-topline">
          <Link className="back-link" href={`/brands/${encodeURIComponent(brand.id)}/campaigns`}>← Campaigns</Link>
          <Link className="secondary-button" href={`/brands/${encodeURIComponent(brand.id)}/channels/groups`}>Account groups</Link>
        </div>

        <header className="studio-header">
          <div>
            <p className="eyebrow">Content Studio</p>
            <h1>{detail.campaign.name}</h1>
            <p>{detail.campaign.objective}</p>
          </div>
          <div className="studio-header-context">
            <span className="idea-status">Human controlled</span>
            <KairoScopePicker brandName={brand.name} meta="Exact-version approval" />
          </div>
        </header>

        {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
        {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

        {detail.assets.length ? (
          <div className="studio-assets">
            {detail.assets.map(({ asset, versions }) => {
              const current = versions.at(-1)!;
              const status = reviewStatuses.get(asset.id)!;
              const review = status.review?.versionId === current.id ? status.review : null;
              const approval = status.approval?.versionId === current.id ? status.approval : null;
              const label = approval
                ? "Approved"
                : review?.status === "passed"
                  ? "Ready for approval"
                  : review?.status === "revision-required"
                    ? "Revision required"
                    : "Draft";

              return (
                <section className="studio-workspace" key={asset.id} aria-labelledby={`asset-${asset.id}`}>
                  <header className="studio-asset-header">
                    <div>
                      <span className="angle-channel">{asset.channel} · {asset.format}</span>
                      <h2 id={`asset-${asset.id}`}>{asset.topic}</h2>
                    </div>
                    <span className={`review-status ${approval ? "approved" : review?.status ?? "draft"}`}>{label}</span>
                  </header>

                  <form
                    action={saveVersionAction.bind(null, brand.id, campaignId, asset.id, asset.currentVersion)}
                    className="editor-panel"
                  >
                    <label htmlFor={`content-${asset.id}`}>Content</label>
                    <textarea
                      id={`content-${asset.id}`}
                      name="content"
                      defaultValue={current.content}
                      required
                      maxLength={50000}
                    />
                    <div className="editor-footer">
                      <span>Version {current.version} · {current.actor}</span>
                      <button className="primary-button" type="submit">Save new version</button>
                    </div>
                  </form>

                  <div className="studio-context-stack">
                    <details className="studio-context-disclosure">
                      <summary>
                        <span>
                          <strong>AI assistance</strong>
                          <small>Optional transformations for the current version.</small>
                        </span>
                        <span className="context-summary-action">Open</span>
                      </summary>
                      <div className="ai-actions" aria-label="Contextual AI actions">
                        {[["simplify", "Simplify"], ["strengthen-opening", "Strengthen opening"], ["alternative", "Alternative"]].map(([action, actionLabel]) => (
                          <form
                            action={generateVersionAction.bind(null, brand.id, campaignId, asset.id, asset.currentVersion, action!)}
                            key={action}
                          >
                            <button type="submit">{actionLabel}</button>
                          </form>
                        ))}
                      </div>
                    </details>

                    <details className="studio-context-disclosure">
                      <summary>
                        <span>
                          <strong>Versions &amp; evidence</strong>
                          <small>{versions.length} {versions.length === 1 ? "version" : "versions"} · {detail.campaign.supportingClaimIds.length} supporting Claims</small>
                        </span>
                        <span className="context-summary-action">Open</span>
                      </summary>
                      <div className="studio-support-grid">
                        <div className="version-panel">
                          <h3>Version history</h3>
                          {[...versions].reverse().map((version) => (
                            <details key={version.id} open={version.id === current.id}>
                              <summary>Version {version.version} · {version.action}</summary>
                              <p>{version.content}</p>
                              <small>{new Date(version.createdAt).toLocaleString()}</small>
                            </details>
                          ))}
                        </div>
                        <aside className="evidence-access">
                          <strong>Evidence lineage</strong>
                          <p>{detail.campaign.supportingClaimIds.length} supporting Claims are retained with this Campaign.</p>
                          <Link href={`/brands/${encodeURIComponent(brand.id)}/ideas/${encodeURIComponent(detail.campaign.ideaId)}`}>Inspect Research</Link>
                        </aside>
                      </div>
                    </details>
                  </div>

                  <section className="review-panel" aria-labelledby={`review-${asset.id}`}>
                    <div className="review-heading">
                      <div>
                        <p className="eyebrow">Review &amp; approval</p>
                        <h3 id={`review-${asset.id}`}>Version {current.version}</h3>
                        <p className="review-intro">Truth Gate, Critic and human approval stay bound to this exact immutable version.</p>
                      </div>
                    </div>

                    {review ? (
                      <details className="review-detail-disclosure">
                        <summary>
                          <span>
                            <strong>Review findings</strong>
                            <small>{review.truth.passed ? "Truth Gate passed" : "Truth Gate blocked"}{review.critic ? ` · Critic ${review.critic.score}/100` : ""}</small>
                          </span>
                          <span className="context-summary-action">Inspect</span>
                        </summary>
                        <div className="review-grid">
                          <div>
                            <strong>Truth Gate</strong>
                            <p className={review.truth.passed ? "review-pass" : "review-fail"}>
                              {review.truth.passed ? "Passed — evidence requirements satisfied." : "Hard failure — approval is blocked."}
                            </p>
                            {review.truth.findings.length ? (
                              <ul className="finding-list">
                                {review.truth.findings.map((finding, index) => (
                                  <li key={`${finding.code}-${index}`}>
                                    <strong>{finding.code.replaceAll("-", " ")}</strong>
                                    <span>{finding.message}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                          <div>
                            <strong>Critic</strong>
                            {review.critic ? (
                              <>
                                <p>{review.critic.score}/100 · {review.critic.passed ? "Passed" : "Revision required"}</p>
                                {review.critic.findings.length ? (
                                  <ul className="finding-list">
                                    {review.critic.findings.map((finding, index) => (
                                      <li key={`${finding.code}-${index}`}>
                                        <strong>{finding.severity}</strong>
                                        <span>{finding.message}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </>
                            ) : <p>Not run because the Truth Gate failed.</p>}
                          </div>
                        </div>
                      </details>
                    ) : null}

                    {!review || review.status === "revision-required" ? (
                      <form action={reviewContentAction.bind(null, brand.id, campaignId, asset.id, current.version)}>
                        <button className="secondary-button" type="submit">{review ? "Review revised version" : "Review current version"}</button>
                      </form>
                    ) : null}

                    {review?.status === "passed" && !approval ? (
                      <form
                        className="approval-form"
                        action={approveContentAction.bind(null, brand.id, campaignId, asset.id, current.version, asset.channel)}
                      >
                        <label>
                          Destination account reference
                          <input name="accountRef" required maxLength={300} placeholder="e.g. company-linkedin" />
                        </label>
                        <button className="primary-button" type="submit">Approve version {current.version}</button>
                        <p>Approval is destination-specific. It does not publish or schedule.</p>
                      </form>
                    ) : null}

                    {review?.status === "passed" && accountGroups.length ? (
                      <details className="distribution-disclosure">
                        <summary>
                          <span>
                            <strong>Distribute to an account group</strong>
                            <small>Expand the approved version into per-destination distribution commands.</small>
                          </span>
                          <span className="context-summary-action">Open</span>
                        </summary>
                        <GroupDistributionForm
                          groups={accountGroups}
                          action={distributeGroupAction.bind(null, brand.id, campaignId, asset.id, current.version)}
                        />
                      </details>
                    ) : null}

                    {approval ? (
                      <>
                        <div className="approval-record">
                          <strong>Human approval recorded</strong>
                          <p>{approval.destination.channel} · {approval.destination.accountRef} · {new Date(approval.approvedAt).toLocaleString()}</p>
                          <small>Editing creates a new immutable version that requires a new review and approval.</small>
                        </div>
                        {(() => {
                          const account = channelAccounts.find((candidate) =>
                            candidate.channel === approval.destination.channel
                            && candidate.accountRef === approval.destination.accountRef
                            && candidate.status === "connected"
                          );
                          return account && account.capabilities.length ? (
                            <ScheduleForm
                              account={account}
                              action={scheduleContentAction.bind(null, brand.id, campaignId, asset.id)}
                            />
                          ) : (
                            <div className="schedule-unavailable">
                              <strong>Manual publishing required</strong>
                              <p>No connected destination with matching capabilities is available for this approval. Kairo will not silently publish elsewhere.</p>
                            </div>
                          );
                        })()}
                      </>
                    ) : null}
                  </section>
                </section>
              );
            })}
          </div>
        ) : (
          <section className="studio-empty">
            <div>
              <p className="eyebrow">First Content Asset</p>
              <h2>Create the writing surface</h2>
              <p>Start manually; contextual AI actions remain secondary and every save creates a new immutable version.</p>
            </div>
            <form className="asset-form" action={createAssetAction.bind(null, brand.id, campaignId)}>
              <label>Channel<select name="channel"><option value="linkedin">LinkedIn</option><option value="instagram">Instagram</option><option value="manual">Manual</option></select></label>
              <label>Format<input name="format" defaultValue="text" required /></label>
              <label>Audience<input name="audience" required /></label>
              <label>Topic<input name="topic" required /></label>
              <label>Hook type<input name="hookType" required /></label>
              <label>CTA<input name="cta" required /></label>
              <label className="wide">Initial content<textarea name="content" rows={10} required maxLength={50000} /></label>
              <button className="primary-button wide" type="submit">Create Content Asset</button>
            </form>
          </section>
        )}
      </main>
    </KairoProductShell>
  );
}
