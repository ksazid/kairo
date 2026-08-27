import Link from "next/link";
import { getBrand, getIdea } from "../../../../../src/lib/kairo-api";
import { KairoProductShell, KairoScopePicker } from "../../../../kairo-product-shell";
import { editAngleAction, selectAngleAction, startResearchAction } from "../actions";
import styles from "../../../../flow-pages.module.css";

type Params = Promise<{ brandId: string; ideaId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;

export default async function IdeaPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { brandId, ideaId } = await params;
  const [brand, bundle, messages] = await Promise.all([getBrand(brandId), getIdea(brandId, ideaId), searchParams]);
  if (!brand) return <main className={styles.notFound}><section className={styles.notFoundCard}><h1>Brand not found.</h1><Link className={styles.primary} href="/">Return to Today</Link></section></main>;

  const { idea, research, angles } = bundle;
  const ideasHref = `/brands/${encodeURIComponent(brand.id)}/ideas`;
  const continueResearch = startResearchAction.bind(null, brand.id, idea.id);

  return (
    <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Ideas">
      <main id="kairo-main-content" tabIndex={-1} className={styles.page}>
        <Link className={styles.back} href={ideasHref}>← All Ideas</Link>

        <header className={styles.header}>
          <div>
            <span className={styles.source}>{idea.source.type === "opportunity" ? "From Discover" : "Your Idea"}</span>
            <h1>{idea.title}</h1>
            <p className={styles.lede}>{idea.premise}</p>
          </div>
          <div className={styles.context}>
            <KairoScopePicker brandName={brand.name} meta="Research + Angle development" />
            <span className={styles.status}>{statusLabel(idea.status)}</span>
          </div>
        </header>

        {messages.notice ? <p className={`${styles.notice} ${styles.success}`} role="status">{messages.notice}</p> : null}
        {messages.error ? <p className={`${styles.notice} ${styles.error}`} role="alert">{messages.error}</p> : null}

        {!research ? (
          <section className={styles.pending}>
            <p className={styles.eyebrow}>Research</p>
            <h2>Evidence gathering has not started.</h2>
            <p>Kairo keeps the Idea intact until evidence-backed Research is available. Final content generation remains outside this step.</p>
            <form action={continueResearch}>
              <button className={styles.primary} type="submit">Start research</button>
            </form>
            <small>Kairo will search bounded public research sources using this Idea, validate Claims, and prepare candidate Angles for your review.</small>
          </section>
        ) : (
          <>
            <section className={styles.dossier} aria-labelledby="research-title">
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.eyebrow}>Research dossier</p>
                  <h2 id="research-title">What the evidence supports</h2>
                  <p>Claims stay primary. Sources and unresolved uncertainty remain one step away without crowding the reading flow.</p>
                </div>
                <span className="freshness-chip">Updated {new Date(research.createdAt).toLocaleDateString()}</span>
              </div>

              <p className={styles.summary}>{research.summary}</p>

              <section className={styles.section} aria-labelledby="claims-title">
                <h3 id="claims-title">Claims</h3>
                <div className={styles.claims}>
                  {research.claims.map((claim) => (
                    <article className={styles.claim} key={claim.id}>
                      <div className={styles.claimMeta}>
                        <span>{claim.classification.replace("-", " ")}</span>
                        <span className={claim.verificationState}>{claim.verificationState}</span>
                        <span>{Math.round(claim.confidence * 100)}% confidence</span>
                      </div>
                      <p>{claim.text}</p>
                      <small>{claim.evidenceIds.length} supporting {claim.evidenceIds.length === 1 ? "source" : "sources"} · {claim.freshness}</small>
                    </article>
                  ))}
                </div>
              </section>

              <details className={styles.disclosure}>
                <summary>
                  <span>
                    <strong>Evidence & uncertainty</strong>
                    <small>{research.evidence.length} {research.evidence.length === 1 ? "source" : "sources"} · {research.unresolvedUncertainties.length} unresolved</small>
                  </span>
                  <span className={styles.summaryAction}>Inspect support</span>
                </summary>
                <div className="research-support-grid">
                  <section aria-labelledby="evidence-title">
                    <h3 id="evidence-title">Evidence</h3>
                    <div className="evidence-list">
                      {research.evidence.map((item) => (
                        <a className="evidence-row" key={item.id} href={item.sourceUrl} target="_blank" rel="noreferrer">
                          <strong>{item.sourceTitle}</strong>
                          <span>{new URL(item.sourceUrl).hostname}</span>
                          <small>Retrieved {new Date(item.retrievedAt).toLocaleDateString()}</small>
                        </a>
                      ))}
                    </div>
                  </section>
                  <section aria-labelledby="uncertainty-title">
                    <h3 id="uncertainty-title">Still uncertain</h3>
                    {research.unresolvedUncertainties.length ? (
                      <div className="uncertainty-panel">
                        <ul>{research.unresolvedUncertainties.map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                    ) : <p className="muted">No unresolved uncertainty is recorded in this dossier.</p>}
                  </section>
                </div>
              </details>
            </section>

            <section className={styles.angles} aria-labelledby="angles-title">
              <div className={styles.sectionHeading}>
                <div>
                  <p className="eyebrow">Candidate Angles</p>
                  <h2 id="angles-title">Choose the strongest framing</h2>
                  <p>Compare the direction first. Open strategy detail only when you need to inspect or edit it.</p>
                </div>
                <span className="angle-count">{angles.length} {angles.length === 1 ? "Angle" : "Angles"}</span>
              </div>

              {angles.length < 2 ? (
                <div className={styles.empty} role="status">
                  <h3>Research is saved. Candidate Angles are incomplete.</h3>
                  <p>Continue from the persisted Research dossier. Kairo will retry Angle generation without gathering the Research again.</p>
                  <form action={continueResearch}>
                    <button className={styles.primary} type="submit">Continue to candidate Angles</button>
                  </form>
                </div>
              ) : null}

              {angles.length ? (
                <div className={styles.angleList}>
                  {angles.map((angle) => {
                    const select = selectAngleAction.bind(null, brand.id, idea.id, angle.id, angle.version);
                    const edit = editAngleAction.bind(null, brand.id, idea.id, angle.id, angle.version);
                    return (
                      <article className={styles.angle} key={angle.id}>
                        <div className={styles.angleTop}>
                          <div>
                            <span className={styles.angleChannel}>{angle.recommendedChannel} · {angle.recommendedFormat}</span>
                            <h3>{angle.title}</h3>
                          </div>
                          {angle.status === "selected" ? <span className="selected-chip">Selected</span> : null}
                        </div>

                        <p className={styles.angleFraming}>{angle.framing}</p>

                        <details className="angle-strategy-disclosure">
                          <summary>
                            <span><strong>Strategy details</strong><small>Audience, objective, hook, value and framing edit</small></span>
                            <span className={styles.summaryAction}>View details</span>
                          </summary>
                          <div className="angle-strategy-body">
                            <dl>
                              <div><dt>Audience</dt><dd>{angle.audience}</dd></div>
                              <div><dt>Objective</dt><dd>{angle.objective}</dd></div>
                              <div><dt>Hook direction</dt><dd>{angle.hookDirection}</dd></div>
                              <div><dt>Expected value</dt><dd>{angle.expectedValue}</dd></div>
                            </dl>
                            <form action={edit} className={styles.angleEdit}>
                              <label htmlFor={`framing-${angle.id}`}>Edit framing</label>
                              <textarea id={`framing-${angle.id}`} name="framing" defaultValue={angle.framing} maxLength={2000} required />
                              <button className={styles.secondary} type="submit">Save framing</button>
                            </form>
                          </div>
                        </details>

                        <div className={styles.angleFooter}>
                          <span>Effort: {angle.effort}</span>
                          {angle.status !== "selected" ? (
                            <form action={select}><button className={styles.primary} type="submit">Select this Angle</button></form>
                          ) : <span className="selected-note">Current direction</span>}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </section>
          </>
        )}
      </main>
    </KairoProductShell>
  );
}

function statusLabel(status: string) {
  return ({
    new: "Ready to research",
    researching: "Researching",
    "research-ready": "Research ready",
    "angles-ready": "Angles ready",
  } as Record<string, string>)[status] ?? status;
}
