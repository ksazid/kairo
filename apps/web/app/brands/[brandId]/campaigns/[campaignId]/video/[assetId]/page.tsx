import Link from "next/link";
import { assertVideoProjectScope, parseVideoProject, type VideoProject } from "@kairo/domain/video-project";
import { getBrand, getCampaignDetail } from "../../../../../../../src/lib/kairo-api";
import { KairoProductShell, KairoScopePicker } from "../../../../../../kairo-product-shell";
import {
  initializeVideoProjectAction,
  moveVideoProjectSceneAction,
  retimeVideoProjectSceneAction,
  saveVideoProjectCopyAction,
  saveVideoProjectSceneAction,
} from "../actions";

type Params = Promise<{ brandId: string; campaignId: string; assetId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;

function projectFrom(content: string, scope: { workspaceId: string; brandId: string; campaignId: string; assetId: string }): VideoProject | null {
  try {
    return assertVideoProjectScope(parseVideoProject(content), scope);
  } catch {
    return null;
  }
}

export default async function VideoStudio({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { brandId, campaignId, assetId } = await params;
  const [brand, detail, messages] = await Promise.all([
    getBrand(brandId),
    getCampaignDetail(brandId, campaignId),
    searchParams,
  ]);

  if (!brand) {
    return <main className="auth-page"><section className="auth-card"><h1>Brand not found.</h1><Link className="primary-button" href="/">Return to Today</Link></section></main>;
  }

  const entry = detail.assets.find(({ asset }) => asset.id === assetId);
  if (!entry) {
    return (
      <KairoProductShell brandId={brand.id} active="Content Studio">
        <main id="kairo-main-content" tabIndex={-1} className="workspace-main video-studio-main">
          <section className="video-studio-empty">
            <p className="eyebrow">Video Studio</p>
            <h1>Content Asset not found.</h1>
            <Link className="secondary-button" href={`/brands/${encodeURIComponent(brand.id)}/campaigns/${encodeURIComponent(campaignId)}`}>Back to Content Studio</Link>
          </section>
        </main>
      </KairoProductShell>
    );
  }

  const current = entry.versions.at(-1)!;
  const project = projectFrom(current.content, {
    workspaceId: detail.campaign.workspaceId,
    brandId,
    campaignId,
    assetId,
  });
  const isReel = entry.asset.format.toLowerCase() === "reel";
  const studioHref = `/brands/${encodeURIComponent(brand.id)}/campaigns/${encodeURIComponent(campaignId)}`;

  return (
    <KairoProductShell brandId={brand.id} active="Content Studio">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main video-studio-main">
        <div className="video-studio-topline">
          <Link className="back-link" href={studioHref}>← Content Studio</Link>
          <span className="idea-status">Human controlled</span>
        </div>

        <header className="video-studio-header">
          <div>
            <p className="eyebrow">Video Studio</p>
            <h1>{entry.asset.topic}</h1>
            <p>Edit the Reel as a scene timeline. Every save creates a new immutable Content Version and requires fresh review before approval.</p>
          </div>
          <KairoScopePicker brandName={brand.name} meta={`Version ${current.version} · ${entry.asset.channel}`} />
        </header>

        {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
        {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

        {!isReel ? (
          <section className="video-studio-empty">
            <h2>This editor currently supports Reel Content Assets.</h2>
            <p>The generic media-transformation pipeline is intentionally separate; VS-54 only edits the existing Kairo Reel plan/timeline contract.</p>
            <Link className="secondary-button" href={studioHref}>Back to Content Studio</Link>
          </section>
        ) : project ? (
          <>
            <section className="video-project-overview" aria-labelledby="video-project-overview-heading">
              <div>
                <p className="eyebrow">Current project</p>
                <h2 id="video-project-overview-heading">{project.scenes.length} scenes · {project.targetDurationSeconds}s</h2>
                <p>Source version {project.sourceVersion}. {project.supportingClaimIds.length} supporting Claims remain attached to the project.</p>
              </div>
              <Link className="primary-button" href={`${studioHref}#review-${encodeURIComponent(entry.asset.id)}`}>Review version {current.version}</Link>
            </section>

            <form className="video-copy-panel" action={saveVideoProjectCopyAction.bind(null, brand.id, campaignId, assetId, current.version)}>
              <div className="video-section-heading">
                <div>
                  <p className="eyebrow">Project copy</p>
                  <h2>Hook, caption &amp; CTA</h2>
                </div>
                <button className="secondary-button" type="submit">Save project copy</button>
              </div>
              <label>
                Hook
                <textarea name="hook" defaultValue={project.hook} required maxLength={300} rows={2} />
              </label>
              <label>
                Caption
                <textarea name="caption" defaultValue={project.caption} required maxLength={5000} rows={4} />
              </label>
              <label>
                CTA
                <input name="cta" defaultValue={project.cta} required maxLength={500} />
              </label>
            </form>

            <section className="video-timeline" aria-labelledby="video-timeline-heading">
              <div className="video-section-heading">
                <div>
                  <p className="eyebrow">Timeline</p>
                  <h2 id="video-timeline-heading">Scene sequence</h2>
                  <p>Use explicit Move controls so the full workflow remains keyboard-operable; Kairo recalculates scene boundaries deterministically.</p>
                </div>
              </div>

              <div className="video-scene-list">
                {project.scenes.map((scene, index) => {
                  const duration = scene.endSecond - scene.startSecond;
                  return (
                    <article className="video-scene" key={scene.id} aria-labelledby={`scene-heading-${scene.id}`}>
                      <header className="video-scene-header">
                        <div>
                          <span className="angle-channel">Scene {index + 1} · {scene.startSecond}-{scene.endSecond}s</span>
                          <h3 id={`scene-heading-${scene.id}`}>{scene.onScreenText}</h3>
                          <small>{scene.supportingClaimIds.length} supporting {scene.supportingClaimIds.length === 1 ? "Claim" : "Claims"}</small>
                        </div>
                        <div className="video-scene-order" aria-label={`Reorder scene ${index + 1}`}>
                          {index > 0 ? (
                            <form action={moveVideoProjectSceneAction.bind(null, brand.id, campaignId, assetId, current.version, scene.id, index - 1)}>
                              <button className="tertiary-button" type="submit" aria-label={`Move scene ${index + 1} up`}>Move up</button>
                            </form>
                          ) : null}
                          {index < project.scenes.length - 1 ? (
                            <form action={moveVideoProjectSceneAction.bind(null, brand.id, campaignId, assetId, current.version, scene.id, index + 1)}>
                              <button className="tertiary-button" type="submit" aria-label={`Move scene ${index + 1} down`}>Move down</button>
                            </form>
                          ) : null}
                        </div>
                      </header>

                      <form className="video-scene-copy" action={saveVideoProjectSceneAction.bind(null, brand.id, campaignId, assetId, current.version, scene.id)}>
                        <label>
                          Visual direction
                          <textarea name="visual" defaultValue={scene.visual} required maxLength={1000} rows={3} />
                        </label>
                        <label>
                          On-screen text
                          <textarea name="onScreenText" defaultValue={scene.onScreenText} required maxLength={500} rows={2} />
                        </label>
                        <label>
                          Voiceover
                          <textarea name="voiceover" defaultValue={scene.voiceover} required maxLength={2000} rows={4} />
                        </label>
                        <div className="video-scene-actions">
                          <span>Editing copy preserves this scene's Claim lineage.</span>
                          <button className="secondary-button" type="submit">Save scene copy</button>
                        </div>
                      </form>

                      <form className="video-scene-timing" action={retimeVideoProjectSceneAction.bind(null, brand.id, campaignId, assetId, current.version, scene.id)}>
                        <label>
                          Scene duration (seconds)
                          <input name="durationSeconds" type="number" min="0.1" max="300" step="0.1" defaultValue={duration} required />
                        </label>
                        <button className="tertiary-button" type="submit">Update timing</button>
                      </form>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="video-render-boundary">
              <div>
                <p className="eyebrow">Render boundary</p>
                <h2>Uses Kairo's existing Reel renderer</h2>
                <p>This editor compiles to the existing validated ReelPlan. Storyboard rendering, private MP4 encoding and publishing-media preparation remain owned by the already-certified VS-18/VS-20 pipeline.</p>
              </div>
              <span className="review-status passed">Render-contract ready</span>
            </section>
          </>
        ) : (
          <section className="video-initialize" aria-labelledby="video-initialize-heading">
            <div className="video-section-heading">
              <div>
                <p className="eyebrow">Initialize Video Project</p>
                <h2 id="video-initialize-heading">Start with two purposeful scenes</h2>
                <p>The existing Content Version remains in history. Initialization saves a new structured version using its existing supporting Claims.</p>
              </div>
            </div>
            <form className="video-initialize-form" action={initializeVideoProjectAction.bind(null, brand.id, campaignId, assetId, current.version)}>
              <label className="wide">
                Hook
                <textarea name="hook" required maxLength={300} rows={2} />
              </label>
              <fieldset>
                <legend>Scene 1</legend>
                <label>Duration (seconds)<input name="scene1Duration" type="number" min="0.1" max="295" step="0.1" defaultValue="4" required /></label>
                <label>Visual direction<textarea name="scene1Visual" required maxLength={1000} rows={3} /></label>
                <label>On-screen text<textarea name="scene1OnScreenText" required maxLength={500} rows={2} /></label>
                <label>Voiceover<textarea name="scene1Voiceover" required maxLength={2000} rows={4} /></label>
              </fieldset>
              <fieldset>
                <legend>Scene 2</legend>
                <label>Duration (seconds)<input name="scene2Duration" type="number" min="0.1" max="295" step="0.1" defaultValue="8" required /></label>
                <label>Visual direction<textarea name="scene2Visual" required maxLength={1000} rows={3} /></label>
                <label>On-screen text<textarea name="scene2OnScreenText" required maxLength={500} rows={2} /></label>
                <label>Voiceover<textarea name="scene2Voiceover" required maxLength={2000} rows={4} /></label>
              </fieldset>
              <label className="wide">
                Caption
                <textarea name="caption" required maxLength={5000} rows={4} />
              </label>
              <label className="wide">
                CTA
                <input name="cta" defaultValue={entry.asset.cta} required maxLength={500} />
              </label>
              <div className="video-initialize-actions wide">
                <p>{current.supportingClaimIds.length} supporting Claims from version {current.version} will remain attached; no new claims are created here.</p>
                <button className="primary-button" type="submit">Initialize Video Project</button>
              </div>
            </form>
          </section>
        )}
      </main>
    </KairoProductShell>
  );
}
