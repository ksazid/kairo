import Link from "next/link";
import { redirect } from "next/navigation";
import type { BrandBrainFieldDto } from "@kairo/contracts";
import { getBrand, getBrandBrain, getKnowledgeSources, getSession } from "../../../../src/lib/kairo-api";
import { getMetaConnectionHealth } from "../../../../src/lib/meta-connection-api";
import {
  buildBrandBrainOverview,
  fieldEvidenceLabel,
  fieldStateLabel,
  findFieldDefinition,
} from "../../../../src/lib/brand-brain-view-model";
import { KairoProductShell, KairoScopePicker } from "../../../kairo-product-shell";
import { buildBrandBrainAction } from "./guided-actions";
import { connectionStartPath } from "../../../../src/lib/brand-connection-plan";
import { disconnectMetaConnectionAction } from "../connections/actions";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string; setup?: string }>;

export default async function BrandBrainPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/");
  const { brandId } = await params;
  const brand = await getBrand(brandId);
  if (!brand) redirect("/");
  const workspace = session.workspaces.find((item) => item.id === brand.workspaceId);
  if (!workspace) redirect("/");

  const [brain, sources, accountResult, messages] = await Promise.all([
    getBrandBrain(brand.id),
    getKnowledgeSources(brand.id),
    getMetaConnectionHealth(brand.id).then((accounts) => ({ accounts, available: true as const })).catch(() => ({ accounts: [], available: false as const })),
    searchParams,
  ]);
  const overview = buildBrandBrainOverview(brain);
  const activePublicSource = sources.find((source) => source.status === "active" && source.sourceUrl)?.sourceUrl;
  const publicReference = brand.publicProfileUrl ?? brand.publicSourceUrl ?? activePublicSource;
  const existingObjective = overview.fieldMap.get("goals.objectives")?.value;
  const ownerDirective = overview.fieldMap.get("boundaries.owner-directive")?.value ?? "";
  const activeSources = sources.filter((source) => source.status === "active");
  const sourceIssues = sources.filter((source) => source.status === "failed" || source.status === "quarantined");
  const encoded = encodeURIComponent(brand.id);
  const controlHref = `/brands/${encoded}/brand-brain-control`;
  const usableAccounts = accountResult.accounts;
  const instagram = usableAccounts.find((account) => account.channel === "instagram" && authMethod(account) === "instagram-login");
  const facebookInstagram = usableAccounts.find((account) => account.channel === "instagram" && authMethod(account) !== "instagram-login");
  const facebook = usableAccounts.find((account) => String(account.channel) === "facebook");
  const brainReturn = `/brands/${encoded}/brain`;

  return (
    <KairoProductShell brandId={brand.id} workspaceId={workspace.id} active="Brand Brain" mobileActive="More">
      <main id="kairo-main-content" className="workspace-main brand-brain-workspace">
        <header className="topbar brain-page-header">
          <div>
            <p className="eyebrow">Brand Brain</p>
            <h1>{brand.name}</h1>
            <p className="lede">The Brand context Kairo uses when it researches, recommends and creates. Suggestions remain visible as suggestions until you confirm them.</p>
          </div>
          <KairoScopePicker brandName={brand.name} workspaceName={workspace.name} />
        </header>

        {messages.notice ? <div className="notice success" role="status">{messages.notice}</div> : null}
        {messages.error ? <div className="notice error" role="alert">{messages.error}</div> : null}

        <section className="brain-profile-panel" aria-labelledby="brand-profile-heading">
          <div className="brain-profile-heading">
            <div>
              <p className="eyebrow">Profile</p>
              <h2 id="brand-profile-heading">What Kairo knows</h2>
              <p>Confirmed owner context and Kairo suggestions stay deliberately distinct.</p>
            </div>
            <div className="brain-state-summary" aria-label="Brand Brain states">
              <span><strong>{overview.confirmedCount}</strong> confirmed</span>
              <span><strong>{overview.suggestedCount}</strong> suggested</span>
              <span><strong>{overview.staleCount}</strong> need refresh</span>
            </div>
          </div>

          <div className="brain-profile-list">
            {overview.summaries.map(({ title, field }) => (
              <article className="brain-profile-row" key={title}>
                <div className="brain-profile-label">
                  <h3>{title}</h3>
                  <FieldState field={field} />
                </div>
                <div className="brain-profile-value">
                  <p>{field?.value ?? "Not learned yet."}</p>
                  <span>{fieldEvidenceLabel(field)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {overview.reviewItems.length ? (
          <section className="brain-attention-panel" aria-labelledby="review-heading">
            <div className="brain-attention-heading">
              <div>
                <p className="eyebrow">Your review</p>
                <h2 id="review-heading">{overview.reviewItems.length} {overview.reviewItems.length === 1 ? "item needs" : "items need"} a decision</h2>
                <p>Kairo will not silently turn these suggestions into confirmed Brand truth.</p>
              </div>
              <Link className="primary-button" href={controlHref}>Review suggestions</Link>
            </div>
            <div className="brain-attention-list">
              {overview.reviewItems.slice(0, 4).map((field) => {
                const definition = findFieldDefinition(field.fieldKey);
                return (
                  <div className="brain-attention-row" key={field.id}>
                    <div>
                      <strong>{definition?.label ?? friendlyFieldName(field.fieldKey)}</strong>
                      <span>{field.value}</span>
                    </div>
                    <FieldState field={field} />
                  </div>
                );
              })}
            </div>
            {overview.reviewItems.length > 4 ? <p className="brain-more-count">+ {overview.reviewItems.length - 4} more in Review &amp; Control</p> : null}
          </section>
        ) : (
          <section className="brain-ready-note" aria-label="Brand Brain review status">
            <div>
              <strong>Nothing needs your attention right now.</strong>
              <span>Confirmed owner context remains authoritative. You can still inspect or edit the full Brand Brain.</span>
            </div>
            <Link className="secondary-button" href={controlHref}>Review &amp; control</Link>
          </section>
        )}

        <details className="brain-disclosure brand-setup-disclosure" open={brain.length === 0 || messages.setup === "open"}>
          <summary>
            <div>
              <span className="eyebrow">Setup</span>
              <strong>{brain.length ? "Update Brand Brain" : "Build my Brand Brain"}</strong>
              <span>Change the owner goal, add an optional public reference, or refresh Kairo's suggestions.</span>
            </div>
            <span className="disclosure-action" aria-hidden="true">Open</span>
          </summary>
          <div className="brain-setup-body">
            <div className="guided-setup-copy">
              <h2>{brain.length ? "Refresh what Kairo should optimise for" : "Give Kairo a useful starting point"}</h2>
              <p>Kairo can start from your Brand and owner decisions. A public website, social profile, article, blog, product page or text-based PDF is optional evidence—not a prerequisite for suggestions.</p>
              {publicReference ? (
                <div className="reference-chip">
                  <span>Public reference configured</span>
                  <strong>{publicReference}</strong>
                </div>
              ) : null}
            </div>

            <form action={buildBrandBrainAction.bind(null, brand.id)} className="guided-setup-form">
              {!publicReference ? (
                <label>
                  Public Brand reference <span>optional</span>
                  <span>Website, social profile, article, blog, product page or public PDF.</span>
                  <input name="publicReferenceUrl" type="url" inputMode="url" placeholder="https://yourbrand.com/about" />
                </label>
              ) : null}
              <label>
                What matters most right now?
                <span>This is an owner decision. Kairo will optimise suggestions around it.</span>
                <select name="primaryObjective" defaultValue={objectiveValue(existingObjective)} required>
                  <option value="grow-audience">Grow audience</option>
                  <option value="build-authority">Build authority</option>
                  <option value="generate-leads">Generate leads</option>
                  <option value="build-community">Build community</option>
                  <option value="promote-offer">Promote an offer</option>
                </select>
              </label>
              <label>
                Anything Kairo must never say or do? <span>optional</span>
                <textarea name="ownerBoundary" rows={3} maxLength={4000} defaultValue={ownerDirective} placeholder="For example: never imply dangerous street riding is something to imitate." />
              </label>
              <button className="primary-button" type="submit">{brain.length ? "Refresh suggestions" : "Build my Brand Brain"}</button>
            </form>
          </div>
        </details>

        <section className="brain-source-panel brain-source-hub" aria-labelledby="source-heading">
          <div>
            <p className="eyebrow">Sources</p>
            <h2 id="source-heading">Evidence &amp; Knowledge</h2>
            <p>{sourceSummary(activeSources.length, sourceIssues.length, publicReference)}</p>
          </div>
          <div className="brain-source-cards">
            <article className="brain-source-card">
              <div><span className="source-kind">Website</span><strong>{brand.publicSourceUrl ? safeHost(brand.publicSourceUrl) : "No website added"}</strong><small>{brand.publicSourceUrl ? "Available to Brand Brain as public evidence" : "Add a readable public website or Brand page"}</small></div>
              <Link className="tertiary-button" href={`${controlHref}#knowledge-sources`}>{brand.publicSourceUrl ? "Manage" : "Add website"}</Link>
            </article>
            <article className="brain-source-card">
              <div><span className="source-kind">Instagram · Recommended</span><strong>{instagram?.displayName ?? (accountResult.available ? "Not connected" : "Status unavailable")}</strong><small>{instagram ? `Professional account · ${instagram.status}` : accountResult.available ? "Instagram Login; no Facebook Page required" : "Kairo could not verify the connection right now; existing Brand Brain context is unchanged"}</small></div>
              <div className="brain-source-card-actions">
                {instagram ? <form action={disconnectMetaConnectionAction.bind(null,brand.id,instagram.id)}><button className="tertiary-button" type="submit">Disconnect</button></form> : null}
                <Link className={instagram?.status === "connected" ? "tertiary-button" : "secondary-button"} href={instagram || !accountResult.available ? `/brands/${encoded}/performance` : connectionStartPath(brand.id, "instagram", brainReturn)}>{instagram || !accountResult.available ? "Manage" : "Connect"}</Link>
              </div>
            </article>
            <ConnectionSourceCard
              kind="Facebook + Instagram"
              account={facebookInstagram}
              available={accountResult.available}
              help="Facebook Login, Page selection and its linked Instagram Professional account"
              connectHref={connectionStartPath(brand.id, "facebook-instagram", brainReturn)}
              manageHref={`/brands/${encoded}/performance`}
              brandId={brand.id}
            />
            <ConnectionSourceCard
              kind="Facebook"
              account={facebook}
              available={accountResult.available}
              help="Connect a Facebook Page for publishing"
              connectHref={connectionStartPath(brand.id, "facebook", brainReturn)}
              manageHref={`/brands/${encoded}/performance`}
              brandId={brand.id}
            />
            <Link className="secondary-button" href={`${controlHref}#knowledge-sources`}>Manage all sources</Link>
          </div>
        </section>
      </main>
    </KairoProductShell>
  );
}

function ConnectionSourceCard({ kind, account, available, help, connectHref, manageHref, brandId }: {
  kind: string;
  account?: { id: string; displayName: string; status: string };
  available: boolean;
  help: string;
  connectHref: string;
  manageHref: string;
  brandId: string;
}) {
  const connected = account?.status === "connected";
  return (
    <article className="brain-source-card">
      <div>
        <span className="source-kind">{kind}</span>
        <strong>{account?.displayName ?? (available ? "Not connected" : "Status unavailable")}</strong>
        <small>{account ? `${help} · ${account.status}` : available ? help : "Connection health is temporarily unavailable; saved Brand context is unchanged"}</small>
      </div>
      <div className="brain-source-card-actions">
        {account ? <form action={disconnectMetaConnectionAction.bind(null,brandId,account.id)}><button className="tertiary-button" type="submit">Disconnect</button></form> : null}
        <Link className={connected ? "tertiary-button" : "secondary-button"} href={account || !available ? manageHref : connectHref}>{account || !available ? "Manage" : "Connect"}</Link>
      </div>
    </article>
  );
}

function authMethod(account: unknown): string | undefined {
  if (!account || typeof account !== "object" || !("authMethod" in account)) return undefined;
  const value = (account as { authMethod?: unknown }).authMethod;
  return typeof value === "string" ? value : undefined;
}

function FieldState({ field }: { field?: BrandBrainFieldDto }) {
  const state = field?.state ?? "unset";
  return (
    <span className={`field-state ${state}`}>
      <i className={`state-dot ${field?.state ?? ""}`} aria-hidden="true" />
      {fieldStateLabel(field)}
    </span>
  );
}

function objectiveValue(value?: string) {
  if (value === "Build authority") return "build-authority";
  if (value === "Generate leads") return "generate-leads";
  if (value === "Build community") return "build-community";
  if (value === "Promote an offer") return "promote-offer";
  return "grow-audience";
}

function sourceSummary(activeCount: number, issueCount: number, publicReference?: string) {
  const parts: string[] = [];
  if (activeCount) parts.push(`${activeCount} active Knowledge ${activeCount === 1 ? "source" : "sources"}`);
  else parts.push("No additional Knowledge sources yet");
  if (publicReference) parts.push("a public Brand reference is configured");
  if (issueCount) parts.push(`${issueCount} ${issueCount === 1 ? "source needs" : "sources need"} attention`);
  return `${parts.join(" · ")}.`;
}

function safeHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Public reference";
  }
}

function friendlyFieldName(key: string) {
  return key.split(".").at(-1)?.replace(/-/g, " ") ?? key;
}
