import Link from "next/link";
import { redirect } from "next/navigation";
import type { BrandBrainFieldDto } from "@kairo/contracts";
import type { BrandPresenterDto } from "@kairo/contracts/presenter";
import { getBrand, getBrandBrain, getSession } from "../../../../src/lib/kairo-api";
import { getBrandPresenter } from "../../../../src/lib/presenter-api";
import { KairoProductShell } from "../../../kairo-product-shell";
import { KairoIcon } from "../../../kairo-icons";
import { saveBrandPresenterAction } from "./actions";
import "./avatar.css";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;

export default async function AvatarPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/");

  const { brandId } = await params;
  const brand = await getBrand(brandId);
  if (!brand) redirect("/");
  const workspace = session.workspaces.find((item) => item.id === brand.workspaceId);
  if (!workspace) redirect("/");

  const [brain, presenterResult, messages] = await Promise.all([
    getBrandBrain(brand.id),
    getBrandPresenter(brand.id)
      .then((value) => ({ available: true as const, value }))
      .catch(() => ({ available: false as const, value: null })),
    searchParams,
  ]);

  const presenter = presenterResult.value?.presenter ?? null;
  const eligibility = presenterResult.value?.eligibility ?? null;
  const capabilities = presenterResult.value?.capabilities ?? null;
  const suggestions = presenter ?? suggestedPresenter(brand.name, brain);
  const encoded = encodeURIComponent(brand.id);
  const providerReady = presenterResult.available && eligibility?.status === "eligible" && Boolean(capabilities?.avatarRendering);

  return (
    <KairoProductShell brandId={brand.id} workspaceId={workspace.id} active="Brand" pageLabel="Avatar (Presenter)">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main avatar-main">
        <div className="avatar-back"><Link href={`/brands/${encoded}/brain`}>← Back to Brand</Link></div>
        <header className="avatar-header">
          <div>
            <h1>Avatar (Presenter)</h1>
            <p className="lede">An optional presenter Kairo can use in videos.</p>
          </div>
        </header>

        {messages.notice ? <div className="notice success" role="status">{messages.notice}</div> : null}
        {messages.error ? <div className="notice error" role="alert">{messages.error}</div> : null}

        <section className="avatar-overview" aria-label="Presenter preview and benefits">
          <div className="avatar-preview-card">
            <div className="avatar-preview-stage" aria-label="Presenter preview">
              <div className="avatar-preview-person"><KairoIcon name="profile" /></div>
              <div className="avatar-preview-caption">
                <span>{suggestions.displayName}</span>
                <small>{modeLabel(suggestions.mode)}</small>
              </div>
            </div>
            <div className="avatar-readiness">
              <span className={providerReady ? "ready" : "not-ready"}>{providerReady ? "Ready" : "Not ready yet"}</span>
              <p>{providerReady ? "Presenter preferences are saved and the Avatar capability is available." : "Set up the Avatar capability before Kairo can render this presenter in a video."}</p>
              {!providerReady ? <Link className="primary-button" href="/settings">Set up avatar provider</Link> : null}
            </div>
          </div>

          <div className="avatar-benefits">
            <Benefit icon="profile" title="Realistic presenter" copy="A human-style presenter for videos that benefit from direct explanation." />
            <Benefit icon="brand" title="Brand aligned" copy="Use your Brand voice, language, framing and visual preferences." />
            <Benefit icon="check" title="Consistent delivery" copy="Keep the presenter experience recognizable across repeated video content." />
          </div>
        </section>

        <section className="avatar-steps" aria-labelledby="avatar-steps-title">
          <div className="avatar-section-heading">
            <p className="eyebrow">How it works</p>
            <h2 id="avatar-steps-title">From setup to use</h2>
          </div>
          <ol>
            {[
              ["Configure", "Choose the presenter preferences Kairo should use."],
              ["Create", "Save the Brand-aligned presenter profile."],
              ["Review", "Check the presenter before using it in content."],
              ["Use", "Select it only when a video benefits from a presenter."],
            ].map(([title, copy], index) => <li key={title}><span>{index + 1}</span><div><strong>{title}</strong><p>{copy}</p></div></li>)}
          </ol>
        </section>

        {presenterResult.available ? (
          <form className="avatar-form" action={saveBrandPresenterAction.bind(null, brand.id)}>
            {presenter ? <input type="hidden" name="expectedVersion" value={presenter.version} /> : null}
            <input type="hidden" name="displayName" value={suggestions.displayName} />
            <input type="hidden" name="status" value="ready" />

            <section className="avatar-recommendations" aria-labelledby="avatar-recommendations-title">
              <div className="avatar-section-heading">
                <p className="eyebrow">Kairo recommends</p>
                <h2 id="avatar-recommendations-title">Presenter settings</h2>
                <p>Start with Brand-aligned defaults and adjust only what matters.</p>
              </div>

              <div className="avatar-setting-grid">
                <label>
                  <span>Style</span>
                  <input name="visualStyle" maxLength={240} defaultValue={suggestions.visualStyle ?? ""} placeholder="Clean, credible presentation" />
                </label>
                <label>
                  <span>Voice</span>
                  <input name="voiceStyle" maxLength={240} defaultValue={suggestions.voiceStyle ?? ""} placeholder="Clear and conversational" />
                </label>
                <label>
                  <span>Language</span>
                  <input name="locale" maxLength={80} defaultValue={suggestions.locale ?? ""} placeholder="English" />
                </label>
                <label>
                  <span>Framing</span>
                  <input name="framing" maxLength={160} defaultValue={suggestions.framing ?? ""} placeholder="Medium close-up" />
                </label>
                <label>
                  <span>Background</span>
                  <input name="background" maxLength={240} defaultValue={suggestions.background ?? ""} placeholder="Quiet Brand-aligned setting" />
                </label>
                <label>
                  <span>Mode</span>
                  <select name="mode" defaultValue={suggestions.mode}>
                    <option value="basic">Basic presenter</option>
                    <option value="talking-avatar">Talking avatar</option>
                    <option value="hybrid-explainer">Hybrid explainer</option>
                  </select>
                </label>
              </div>

              <details className="avatar-customize">
                <summary className="secondary-button">Customize</summary>
                <div className="avatar-customize-grid">
                  <label><span>Accent</span><input name="accent" maxLength={120} defaultValue={suggestions.accent ?? ""} /></label>
                  <label><span>Pace</span><input name="pace" maxLength={80} defaultValue={suggestions.pace ?? ""} /></label>
                  <label><span>Caption preference</span><input name="captionPreference" maxLength={160} defaultValue={suggestions.captionPreference ?? ""} /></label>
                  <label><span>Intro style</span><input name="introStyle" maxLength={240} defaultValue={suggestions.introStyle ?? ""} /></label>
                  <label><span>Outro style</span><input name="outroStyle" maxLength={240} defaultValue={suggestions.outroStyle ?? ""} /></label>
                </div>
              </details>
            </section>

            <div className="avatar-actions">
              <button className="secondary-button" type="button" disabled title="Test clip is not available yet">Test clip</button>
              <button className="primary-button" type="submit">Create &amp; Save</button>
            </div>
          </form>
        ) : (
          <section className="avatar-unavailable" role="status">
            <strong>Presenter settings are temporarily unavailable.</strong>
            <p>Your existing Brand context is unchanged. You can still review this page while settings are unavailable.</p>
          </section>
        )}

        <section className="avatar-help" aria-labelledby="avatar-help-title">
          <div>
            <p className="eyebrow">Best practices</p>
            <h2 id="avatar-help-title">Keep the presenter natural and useful</h2>
          </div>
          <ul>
            <li>Use a presenter when a human explanation genuinely helps the content.</li>
            <li>Keep framing, voice and background consistent with the Brand.</li>
            <li>Review the final video before approval and publishing.</li>
          </ul>
        </section>
      </main>
    </KairoProductShell>
  );
}

function Benefit({ icon, title, copy }: { icon: "profile" | "brand" | "check"; title: string; copy: string }) {
  return <article><span><KairoIcon name={icon} /></span><div><strong>{title}</strong><p>{copy}</p></div></article>;
}

function suggestedPresenter(brandName: string, brain: BrandBrainFieldDto[]): BrandPresenterDto {
  const map = new Map(brain.map((field) => [field.fieldKey, field.value]));
  const language = map.get("identity.language");
  const tone = map.get("voice.tone");
  const category = map.get("identity.category");
  const audience = map.get("audience.primary");
  const at = new Date(0).toISOString();
  return {
    id: "suggested",
    workspaceId: "suggested",
    brandId: "suggested",
    displayName: `${brandName} Presenter`,
    status: "ready",
    mode: "hybrid-explainer",
    visualStyle: category ? `Clean, credible ${category} presentation` : "Clean, credible Brand-led presentation",
    voiceStyle: tone ?? "Clear, confident and conversational",
    ...(language ? { locale: language } : {}),
    pace: "Measured and concise",
    framing: "Medium close-up, centered and direct-to-camera",
    background: audience ? `Quiet Brand-aligned setting appropriate for ${audience}` : "Quiet Brand-aligned studio setting",
    captionPreference: "Readable captions, sentence case, restrained emphasis",
    introStyle: "Open directly with the useful point",
    outroStyle: "End with one clear next step",
    version: 0,
    createdAt: at,
    updatedAt: at,
  };
}

function modeLabel(mode: BrandPresenterDto["mode"]) {
  if (mode === "talking-avatar") return "Talking avatar";
  if (mode === "hybrid-explainer") return "Hybrid explainer";
  return "Basic presenter";
}
