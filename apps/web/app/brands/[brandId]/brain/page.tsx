import Link from "next/link";
import { redirect } from "next/navigation";
import type { KnowledgeSourceDto } from "@kairo/contracts";
import {
  getBrand,
  getBrandBrain,
  getChannelAccounts,
  getKnowledgeSources,
  getSession,
  type ChannelAccountView,
} from "../../../../src/lib/kairo-api";
import { getMetaConnectionHealth } from "../../../../src/lib/meta-connection-api";
import { buildBrandProfileSections, brandSummary } from "../../../../src/lib/brand-profile-view-model";
import { fieldAnchor } from "../../../../src/lib/brand-brain-view-model";
import { KairoProductShell } from "../../../kairo-product-shell";
import { InlineBrandField } from "./inline-brand-field";
import {
  addKnowledgeSourceAction,
  removeKnowledgeSourceAction,
  setKnowledgeSourceEnabledAction,
} from "../brand-brain-control/actions";
import "./brand-v2.css";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;

export default async function BrandPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/");

  const { brandId } = await params;
  const brand = await getBrand(brandId);
  if (!brand) redirect("/");
  const workspace = session.workspaces.find((item) => item.id === brand.workspaceId);
  if (!workspace) redirect("/");

  const [brain, sources, channelResult, metaResult, messages] = await Promise.all([
    getBrandBrain(brand.id),
    getKnowledgeSources(brand.id),
    getChannelAccounts(brand.id)
      .then((accounts) => ({ available: true as const, accounts }))
      .catch(() => ({ available: false as const, accounts: [] })),
    getMetaConnectionHealth(brand.id)
      .then((accounts) => ({ available: true as const, accounts }))
      .catch(() => ({ available: false as const, accounts: [] })),
    searchParams,
  ]);

  const sections = buildBrandProfileSections(brain);
  const summary = brandSummary(brain);
  const sourceIssues = sources.filter((source) => source.status === "failed" || source.status === "quarantined");
  const activeSources = sources.filter((source) => source.status === "active");
  const websiteSource = sources.find((source) => (source.type === "website" || source.type === "url") && !["removed", "replaced"].includes(source.status));
  const instagramSource = metaResult.accounts.find((account) => account.channel === "instagram");
  const encoded = encodeURIComponent(brand.id);
  const channelsHref = `/brands/${encoded}/channels`;
  const avatarHref = `/brands/${encoded}/avatar`;

  return (
    <KairoProductShell brandId={brand.id} workspaceId={workspace.id} active="Brand" pageLabel="Brand">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main brand-v2-main">
        <header className="brand-v2-header">
          <div className="brand-v2-title">
            <h1>Brand</h1>
            <p className="lede">Shape how Kairo understands and represents your brand.</p>
          </div>
        </header>

        {messages.notice ? <div className="notice success" role="status">{messages.notice}</div> : null}
        {messages.error ? <div className="notice error" role="alert">{messages.error}</div> : null}

        <section className="brand-profile-hero" aria-label="Brand summary">
          <div className="brand-profile-avatar" aria-label={`${brand.name} brand image placeholder`}>{initials(brand.name)}</div>
          <div className="brand-profile-copy">
            <h2>{brand.name}</h2>
            <p>{summary.category ?? "Category not set"}{summary.audience ? ` · ${summary.audience}` : " · Audience not set"}</p>
            <div className="brand-profile-states" aria-label="Brand context states">
              <span className="confirmed"><strong>{summary.confirmed}</strong> Confirmed</span>
              <span className="inferred"><strong>{summary.suggested}</strong> AI inferred</span>
              {summary.stale ? <span className="stale"><strong>{summary.stale}</strong> Needs review</span> : null}
            </div>
          </div>
        </section>

        {(summary.suggested > 0 || summary.stale > 0) ? (
          <div className="brand-review-note" role="status">
            <div>
              <strong>{summary.suggested + summary.stale} field{summary.suggested + summary.stale === 1 ? "" : "s"} could use your review.</strong>
              <span>AI-inferred context stays separate from owner-confirmed Brand truth until you save it.</span>
            </div>
            <a className="secondary-button" href="#identity">Review Brand</a>
          </div>
        ) : null}

        <nav className="brand-section-nav" aria-label="Brand sections">
          <a href="#identity">Identity</a>
          <a href="#audience">Audience</a>
          <a href="#voice-style">Voice &amp; Style</a>
          <a href="#content-pillars">Content Pillars</a>
          <a href="#sources">Sources</a>
          <a href="#channels">Channels</a>
          <a href="#avatar">Avatar</a>
        </nav>

        <div className="brand-v2-stack">
          {sections.map((section) => (
            <section className="brand-profile-section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
              <header>
                <div>
                  <h2 id={`${section.id}-title`}>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
              </header>
              <div className="brand-field-list">
                {section.fields.map(({ section: sourceSection, definition, field }) => (
                  <div id={fieldAnchor(definition.key)} key={definition.key}>
                    <InlineBrandField brandId={brand.id} section={sourceSection} definition={definition} field={field} />
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section className="brand-profile-section brand-sources-section" id="sources" aria-labelledby="sources-title">
            <header>
              <div>
                <h2 id="sources-title">Sources</h2>
                <p>Keep the website and connected social sources Kairo learns from accurate and healthy.</p>
              </div>
              <span className="brand-section-count">{activeSources.length} active{sourceIssues.length ? ` · ${sourceIssues.length} need attention` : ""}</span>
            </header>

            <div className="brand-source-snapshots">
              <article>
                <div className="brand-source-heading">
                  <span>Website</span>
                  <span className={`brand-source-status ${websiteSource?.status ?? (brand.publicSourceUrl ? "active" : "disabled")}`}>
                    {websiteSource ? friendlySourceStatus(websiteSource.status) : brand.publicSourceUrl ? "Active" : "Not added"}
                  </span>
                </div>
                <strong>{websiteSource?.sourceUrl ? safeHost(websiteSource.sourceUrl) : brand.publicSourceUrl ? safeHost(brand.publicSourceUrl) : "No website source"}</strong>
                <small>{websiteSource ? `Updated ${friendlyDate(websiteSource.updatedAt)}` : brand.publicSourceUrl ? "Website reference available" : "Add a website to help Kairo understand the Brand."}</small>
                <div className="brand-source-actions">
                  <button className="tertiary-button" type="button" disabled title="Source refresh is not available yet">Refresh</button>
                  <a className="tertiary-button" href="#manage-sources">Manage</a>
                </div>
              </article>

              <article>
                <div className="brand-source-heading">
                  <span>Instagram</span>
                  <span className={`brand-source-status ${instagramSource?.healthy ? "active" : instagramSource ? "failed" : "disabled"}`}>
                    {instagramSource ? instagramHealthLabel(instagramSource.healthy, instagramSource.status) : metaResult.available ? "Not connected" : "Status unavailable"}
                  </span>
                </div>
                <strong>{instagramSource?.displayName ?? "No Instagram source"}</strong>
                <small>{instagramSource?.lastSourceSyncAt ? `Updated ${friendlyDate(instagramSource.lastSourceSyncAt)}` : instagramSource ? "Connected source" : "Connect Instagram when you want Kairo to learn from the account."}</small>
                <div className="brand-source-actions">
                  <button className="tertiary-button" type="button" disabled={!instagramSource} title="Source refresh is not available yet">Refresh</button>
                  <Link className="tertiary-button" href={channelsHref}>{instagramSource ? "Manage" : "Connect"}</Link>
                </div>
              </article>
            </div>

            <details className="brand-source-manager" id="manage-sources">
              <summary className="secondary-button">Manage sources</summary>
              <div className="brand-add-source-grid">
                <form action={addKnowledgeSourceAction.bind(null, brand.id)}>
                  <input type="hidden" name="type" value="url" />
                  <label>Website or public link<input name="url" type="url" required inputMode="url" placeholder="https://example.com/about" /></label>
                  <label>Title <span>optional</span><input name="title" maxLength={200} placeholder="Brand story" /></label>
                  <button className="secondary-button" type="submit">Add link</button>
                </form>
                <form action={addKnowledgeSourceAction.bind(null, brand.id)}>
                  <input type="hidden" name="type" value="note" />
                  <label>Private Brand note<textarea name="content" required rows={4} maxLength={100000} placeholder="Approved positioning, product context or operating guidance…" /></label>
                  <label>Title <span>optional</span><input name="title" maxLength={200} placeholder="Owner notes" /></label>
                  <button className="secondary-button" type="submit">Add private note</button>
                </form>
              </div>
              <div className="brand-source-list">
                {sources.length ? sources.map((source) => <KnowledgeSourceRow key={source.id} brandId={brand.id} source={source} />) : <p className="brand-empty-copy">No additional sources yet.</p>}
              </div>
            </details>
          </section>

          <section className="brand-profile-section brand-compact-section" id="channels" aria-labelledby="channels-title">
            <header>
              <div>
                <h2 id="channels-title">Channels</h2>
                <p>Accounts Kairo can use for publishing and results.</p>
              </div>
            </header>
            <div className="brand-compact-list">
              {channelResult.available && channelResult.accounts.length ? channelResult.accounts.map((account) => (
                <ChannelSummaryRow key={account.id} account={account} manageHref={channelsHref} />
              )) : (
                <div className="brand-compact-row">
                  <div><strong>{channelResult.available ? "No channels connected" : "Channel status unavailable"}</strong><span>{channelResult.available ? "Connect a publishing destination when you’re ready." : "Existing connections are unchanged while status is unavailable."}</span></div>
                  <Link className="secondary-button" href={channelsHref}>{channelResult.available ? "Connect" : "Manage"}</Link>
                </div>
              )}
            </div>
          </section>

          <section className="brand-profile-section brand-compact-section" id="avatar" aria-labelledby="avatar-title">
            <header>
              <div>
                <h2 id="avatar-title">Avatar</h2>
                <p>An optional presenter Kairo can use in videos.</p>
              </div>
            </header>
            <div className="brand-compact-list">
              <div className="brand-compact-row">
                <div><strong>Avatar (Presenter)</strong><span>Set the presenter style, voice and framing from the dedicated Avatar page.</span></div>
                <Link className="secondary-button" href={avatarHref}>Open Avatar</Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </KairoProductShell>
  );
}

function ChannelSummaryRow({ account, manageHref }: { account: ChannelAccountView; manageHref: string }) {
  const state = account.status === "connected" ? "Connected" : account.status === "reconnect-required" ? "Reconnect required" : "Disabled";
  return (
    <div className="brand-compact-row">
      <div><strong>{friendlyChannel(account.channel)} · {account.displayName}</strong><span>{state}</span></div>
      <Link className={account.status === "reconnect-required" ? "primary-button" : "secondary-button"} href={manageHref}>{account.status === "reconnect-required" ? "Reconnect" : "Manage"}</Link>
    </div>
  );
}

function KnowledgeSourceRow({ brandId, source }: { brandId: string; source: KnowledgeSourceDto }) {
  const terminal = ["removed", "replaced"].includes(source.status);
  return (
    <article className={`brand-source-row ${terminal ? "terminal" : ""}`}>
      <div>
        <span>{friendlySourceType(source.type)}</span>
        <strong>{source.title ?? source.sourceUrl ?? "Private Brand knowledge"}</strong>
        {source.sourceUrl ? <small>{source.sourceUrl}</small> : source.hasPrivateContent ? <small>Private Brand context</small> : null}
      </div>
      <div className="brand-source-row-actions">
        <span className={`brand-source-status ${source.status}`}>{friendlySourceStatus(source.status)}</span>
        {!terminal && source.status === "active" ? <form action={setKnowledgeSourceEnabledAction.bind(null, brandId, source.id, false)}><button className="tertiary-button" type="submit">Disable</button></form> : null}
        {!terminal && source.status === "disabled" ? <form action={setKnowledgeSourceEnabledAction.bind(null, brandId, source.id, true)}><button className="tertiary-button" type="submit">Enable</button></form> : null}
        {!terminal && !["quarantined", "failed"].includes(source.status) ? <form action={removeKnowledgeSourceAction.bind(null, brandId, source.id)}><button className="tertiary-button" type="submit">Remove</button></form> : null}
      </div>
    </article>
  );
}

function friendlySourceType(type: KnowledgeSourceDto["type"]) {
  if (type === "url" || type === "website") return "Website / public link";
  if (type === "note" || type === "pasted") return "Private note";
  if (type === "document") return "File";
  if (type === "product") return "Product context";
  return "Imported source";
}

function friendlySourceStatus(status: KnowledgeSourceDto["status"]) {
  if (status === "quarantined") return "Checking";
  if (status === "failed") return "Needs attention";
  if (status === "disabled") return "Disabled";
  if (status === "removed") return "Removed";
  if (status === "replaced") return "Replaced";
  return "Active";
}

function instagramHealthLabel(healthy: boolean, status: string) {
  if (healthy) return "Active";
  if (status === "reconnect-required") return "Reconnect required";
  return "Needs attention";
}

function friendlyChannel(value: string) {
  if (value.toLowerCase() === "linkedin") return "LinkedIn";
  return value.replace(/^./, (character) => character.toUpperCase());
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "B";
}

function safeHost(value: string) {
  try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return value; }
}

function friendlyDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "recently";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
