import Link from "next/link";
import { redirect } from "next/navigation";
import type { BrandBrainFieldDto } from "@kairo/contracts";
import type {
  BrandPresenterDto,
  BrandPresenterEligibilityStatus,
} from "@kairo/contracts/presenter";
import { getBrand, getBrandBrain, getSession } from "../../../../src/lib/kairo-api";
import { getBrandPresenter } from "../../../../src/lib/presenter-api";
import { KairoProductShell } from "../../../kairo-product-shell";
import { saveBrandPresenterAction } from "./actions";
import "./avatar.css";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;

export default async function AvatarPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
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
  const providerReady = eligibility?.status === "eligible";
  const providerSettingsHref = `/settings/ai-media-providers?tab=media&brand=${encoded}#avatar-provider`;

  return (
    <KairoProductShell brandId={brand.id} workspaceId={workspace.id} active="Brand" pageLabel="Avatar">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main avatar-main">
        <header className="avatar-header">
          <div>
            <p className="eyebrow">Brand · Avatar (Presenter)</p>
            <h1>Avatar (Presenter)</h1>
            <p>Create an optional presenter Kairo can use in your videos. Presenter use remains optional and is never selected automatically.</p>
          </div>
          <Link className="tertiary-button" href={`/brands/${encoded}/brain`}>Back to Brand</Link>
        </header>

        {messages.notice ? <div className="notice success" role="status">{messages.notice}</div> : null}
        {messages.error ? <div className="notice error" role="alert">{messages.error}</div> : null}
        {!presenterResult.available ? (
          <div className="notice error" role="alert">
            Presenter settings are temporarily unavailable. Existing Brand context is unchanged.
          </div>
        ) : null}

        {presenter ? (
          <PresenterSummary presenter={presenter} eligibility={eligibility?.status ?? null} />
        ) : (
          <section className="avatar-suggestion" aria-labelledby="avatar-suggestion-title">
            <div>
              <p className="eyebrow">Suggested from Brand context</p>
              <h2 id="avatar-suggestion-title">A starting point, not confirmed Brand truth</h2>
            </div>
            <p>
              Kairo has prefilled presentation preferences from the Brand context below. Review and edit them before saving.
              Nothing is persisted until you choose Create &amp; Save.
            </p>
          </section>
        )}

        <section className="avatar-provider-callout" aria-labelledby="avatar-provider-callout-title">
          <div>
            <p className="eyebrow">Avatar provider</p>
            <h2 id="avatar-provider-callout-title">{providerReady ? "Provider capability verified" : "Set up avatar provider"}</h2>
            <p>
              {providerReady
                ? "The current Brand has verified presenter-rendering capability. Provider configuration remains managed separately from Brand truth."
                : capabilities?.reason ?? "Choose and connect an Avatar provider in Settings before Kairo can render or test a presenter."}
            </p>
          </div>
          <Link className="secondary-button" href={providerSettingsHref}>Go to Settings</Link>
        </section>

        <nav className="avatar-recommendations" aria-label="Kairo presenter recommendations">
          <a href="#presenter-style"><strong>Style</strong><span>{suggestions.visualStyle ?? "Not set"}</span></a>
          <a href="#presenter-voice"><strong>Voice</strong><span>{suggestions.voiceStyle ?? "Not set"}</span></a>
          <a href="#presenter-language"><strong>Language</strong><span>{suggestions.locale ?? "Not set"}</span></a>
          <a href="#presenter-framing"><strong>Framing</strong><span>{suggestions.framing ?? "Not set"}</span></a>
          <a href="#presenter-background"><strong>Background</strong><span>{suggestions.background ?? "Not set"}</span></a>
          <a href="#presenter-mode"><strong>Mode</strong><span>{modeLabel(suggestions.mode)}</span></a>
          <a href="#presenter-style"><strong>Customize</strong><span>Fine-tune appearance, voice and delivery</span></a>
        </nav>

        {presenterResult.available ? (
          <form className="avatar-form" action={saveBrandPresenterAction.bind(null, brand.id)}>
            {presenter ? <input type="hidden" name="expectedVersion" value={presenter.version} /> : null}

            <section className="avatar-form-section" aria-labelledby="avatar-identity-title">
              <header>
                <p className="eyebrow">Presenter</p>
                <h2 id="avatar-identity-title">Identity &amp; mode</h2>
                <p>Define how this optional presenter should be understood during creation.</p>
              </header>
              <div className="avatar-fields">
                <label>
                  Presenter name
                  <input name="displayName" required maxLength={120} defaultValue={suggestions.displayName} />
                </label>
                <label id="presenter-mode">
                  Mode
                  <select name="mode" defaultValue={suggestions.mode}>
                    <option value="basic">Basic presenter</option>
                    <option value="talking-avatar">Talking avatar</option>
                    <option value="hybrid-explainer">Hybrid explainer</option>
                  </select>
                  <small>Hybrid explainer is the recommended default for technical or mixed visual content.</small>
                </label>
                <label>
                  Profile state
                  <select name="status" defaultValue={presenter?.status ?? "ready"}>
                    <option value="ready">Enabled</option>
                    <option value="draft">Draft</option>
                    <option value="disabled">Disabled</option>
                  </select>
                  <small>
                    Enabled means the profile may be used when a verified Avatar provider is available. Provider readiness is checked separately.
                  </small>
                </label>
              </div>
            </section>

            <section className="avatar-form-section" aria-labelledby="avatar-style-title">
              <header>
                <p className="eyebrow">Presentation</p>
                <h2 id="avatar-style-title">Look, voice &amp; framing</h2>
                <p>These are descriptive preferences. No face, voice clone, biometric media or provider secret is stored here.</p>
              </header>
              <div className="avatar-fields two-column">
                <label id="presenter-style">
                  Visual style <span>optional</span>
                  <input name="visualStyle" maxLength={240} defaultValue={suggestions.visualStyle ?? ""} />
                </label>
                <label id="presenter-voice">
                  Voice style <span>optional</span>
                  <input name="voiceStyle" maxLength={240} defaultValue={suggestions.voiceStyle ?? ""} />
                </label>
                <label id="presenter-language">
                  Language / locale <span>optional</span>
                  <input name="locale" maxLength={80} defaultValue={suggestions.locale ?? ""} />
                </label>
                <label>
                  Accent <span>optional</span>
                  <input name="accent" maxLength={120} defaultValue={suggestions.accent ?? ""} />
                </label>
                <label>
                  Pace <span>optional</span>
                  <input name="pace" maxLength={80} defaultValue={suggestions.pace ?? ""} />
                </label>
                <label id="presenter-framing">
                  Framing <span>optional</span>
                  <input name="framing" maxLength={160} defaultValue={suggestions.framing ?? ""} />
                </label>
                <label className="wide" id="presenter-background">
                  Background <span>optional</span>
                  <input name="background" maxLength={240} defaultValue={suggestions.background ?? ""} />
                </label>
                <label className="wide">
                  Caption preference <span>optional</span>
                  <input name="captionPreference" maxLength={160} defaultValue={suggestions.captionPreference ?? ""} />
                </label>
              </div>
            </section>

            <details className="avatar-advanced">
              <summary>Intro &amp; outro guidance</summary>
              <div>
                <label>
                  Intro style <span>optional</span>
                  <input name="introStyle" maxLength={240} defaultValue={suggestions.introStyle ?? ""} />
                </label>
                <label>
                  Outro style <span>optional</span>
                  <input name="outroStyle" maxLength={240} defaultValue={suggestions.outroStyle ?? ""} />
                </label>
              </div>
            </details>

            <section className="avatar-capability" aria-labelledby="avatar-capability-title">
              <div>
                <p className="eyebrow">Rendering capability</p>
                <h2 id="avatar-capability-title">
                  {providerReady ? "Presenter is ready for creation" : "Profile can be saved; rendering is not available yet"}
                </h2>
                <p>
                  {providerReady
                    ? "Kairo has verified the Avatar provider for this Brand. The Presenter selector may appear during creation, with None remaining the default."
                    : capabilities?.reason ?? "Kairo will not show a Presenter selector until a governed Avatar provider is configured and verified."}
                </p>
              </div>
              <span className="avatar-capability-state">
                {providerReady ? "Eligible" : capabilities?.providerConfigured ? "Provider unavailable" : "Provider not configured"}
              </span>
            </section>

            <div className="avatar-actions">
              <Link className="tertiary-button" href={`/brands/${encoded}/brain`}>Cancel</Link>
              <button
                className="secondary-button"
                type="button"
                disabled
                title="Test clip needs a governed Avatar provider execution flow that is not implemented yet."
              >
                Test clip
              </button>
              <button className="primary-button" type="submit">
                {presenter ? "Save presenter" : "Create & Save"}
              </button>
            </div>
            <p className="avatar-action-note">Test clip will become available only after provider-backed test rendering is implemented and verified.</p>
          </form>
        ) : null}
      </main>
    </KairoProductShell>
  );
}

function PresenterSummary({
  presenter,
  eligibility,
}: {
  presenter: BrandPresenterDto;
  eligibility: BrandPresenterEligibilityStatus | null;
}) {
  return (
    <section className="avatar-summary" aria-labelledby="avatar-summary-title">
      <div>
        <p className="eyebrow">Saved presenter</p>
        <h2 id="avatar-summary-title">{presenter.displayName}</h2>
        <p>{modeLabel(presenter.mode)} · {statusLabel(presenter.status, eligibility)}</p>
      </div>
      <dl>
        <div><dt>Voice</dt><dd>{presenter.voiceStyle ?? "Not set"}</dd></div>
        <div><dt>Framing</dt><dd>{presenter.framing ?? "Not set"}</dd></div>
        <div><dt>Language</dt><dd>{presenter.locale ?? "Not set"}</dd></div>
      </dl>
    </section>
  );
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

function statusLabel(
  status: BrandPresenterDto["status"],
  eligibility: BrandPresenterEligibilityStatus | null,
) {
  if (status === "disabled" || eligibility === "disabled") return "Disabled";
  if (status === "draft" || eligibility === "draft") return "Draft";
  if (eligibility === "eligible") return "Ready to select";
  return "Enabled · provider unavailable";
}
