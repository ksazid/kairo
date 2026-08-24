import Link from "next/link";
import { redirect } from "next/navigation";
import type { KnowledgeSourceDto } from "@kairo/contracts";
import { getBrand, getBrandBrain, getKnowledgeSources, getLearnings, getSession } from "../../../../src/lib/kairo-api";
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

  const [brain, sources, learnings, metaResult, messages] = await Promise.all([
    getBrandBrain(brand.id),
    getKnowledgeSources(brand.id),
    getLearnings(brand.id).catch(() => []),
    getMetaConnectionHealth(brand.id)
      .then((accounts) => ({ available: true as const, accounts }))
      .catch(() => ({ available: false as const, accounts: [] })),
    searchParams,
  ]);

  const sections = buildBrandProfileSections(brain);
  const summary = brandSummary(brain);
  const acceptedLearnings = learnings.filter((learning) => learning.status === "accepted");
  const sourceIssues = sources.filter((source) => source.status === "failed" || source.status === "quarantined");
  const activeSources = sources.filter((source) => source.status === "active");
  const instagramSource = metaResult.accounts.find((account) => account.channel === "instagram");
  const encoded = encodeURIComponent(brand.id);
  const channelsHref = `/brands/${encoded}/channels`;

  return (
    <KairoProductShell brandId={brand.id} workspaceId={workspace.id} active="Brand" pageLabel="Brand">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main brand-v2-main">
        <header className="brand-v2-header">
          <div className="brand-v2-title">
            <p className="eyebrow">Brand</p>
            <h1>{brand.name}</h1>
            <p>Keep the Brand context Kairo uses for research, recommendations and creation accurate. Select any value to edit it in place.</p>
          </div>
          <div className="brand-v2-state" aria-label="Brand context state">
            <span><strong>{summary.confirmed}</strong> Confirmed</span>
            <span><strong>{summary.suggested}</strong> Suggested</span>
            <span><strong>{summary.stale}</strong> Needs refresh</span>
          </div>
        </header>

        {messages.notice ? <div className="notice success" role="status">{messages.notice}</div> : null}
        {messages.error ? <div className="notice error" role="alert">{messages.error}</div> : null}

        <section className="brand-summary" aria-labelledby="brand-summary-title">
          <div>
            <p className="eyebrow">At a glance</p>
            <h2 id="brand-summary-title">What Kairo should understand</h2>
          </div>
          <dl>
            <SummaryFact label="Category" value={summary.category} />
            <SummaryFact label="Positioning" value={summary.positioning} />
            <SummaryFact label="Audience" value={summary.audience} />
            <SummaryFact label="Voice" value={summary.tone} />
          </dl>
        </section>

        {(summary.suggested > 0 || summary.stale > 0) ? (
          <div className="brand-review-note" role="status">
            <div>
              <strong>{summary.suggested + summary.stale} field{summary.suggested + summary.stale === 1 ? "" : "s"} could use your review.</strong>
              <span>Suggested information stays distinct from owner-confirmed Brand truth until you save it.</span>
            </div>
            <a className="secondary-button" href="#identity">Review Brand</a>
          </div>
        ) : null}

        <nav className="brand-section-nav" aria-label="Brand sections">
          {sections.map((section) => <a href={`#${section.id}`} key={section.id}>{section.title}</a>)}
          <a href="#sources">Sources</a>
          <Link href={channelsHref}>Channels</Link>
        </nav>

        <div className="brand-v2-stack">
          {sections.map((section) => (
            <section className="brand-profile-section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
              <header>
                <div>
                  <p className="eyebrow">Brand context</p>
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
              {section.id === "content-pillars" && acceptedLearnings.length ? (
                <details className="brand-memory-disclosure">
                  <summary>Performance memory · {acceptedLearnings.length} accepted Learning{acceptedLearnings.length === 1 ? "" : "s"}</summary>
                  <div>
                    <p>Accepted Learnings are advisory evidence for future recommendations. They never overwrite confirmed Brand facts.</p>
                    <ul>{acceptedLearnings.slice(0, 5).map((learning) => <li key={learning.id}>{learning.statement}</li>)}</ul>
                    <Link className="tertiary-button" href={`/brands/${encoded}/performance`}>Open Insights</Link>
                  </div>
                </details>
              ) : null}
            </section>
          ))}

          <section className="brand-profile-section brand-sources-section" id="sources" aria-labelledby="sources-title">
            <header>
              <div>
                <p className="eyebrow">Sources</p>
                <h2 id="sources-title">Where Kairo learns this Brand</h2>
                <p>Sources are evidence used to understand the Brand. Publishing destinations are managed separately in Channels.</p>
              </div>
              <span className="brand-section-count">{activeSources.length} active{sourceIssues.length ? ` · ${sourceIssues.length} need attention` : ""}</span>
            </header>

            <div className="brand-source-snapshots">
              <article>
                <span>Website</span>
                <strong>{brand.publicSourceUrl ? safeHost(brand.publicSourceUrl) : "Not added"}</strong>
                <small>{brand.publicSourceUrl ? "Public Brand evidence" : "Add the Brand website or another public reference below."}</small>
              </article>
              <article>
                <span>Instagram source</span>
                <strong>{instagramSource?.displayName ?? (metaResult.available ? "Not connected" : "Status unavailable")}</strong>
                <small>{instagramSource
                  ? `${instagramSource.sourceStatus ?? "Source available"}${instagramSource.lastSourceSyncAt ? ` · synced ${friendlyDate(instagramSource.lastSourceSyncAt)}` : ""}`
                  : metaResult.available
                    ? "Connect Instagram from Channels when you want Kairo to learn from the account."
                    : "Existing Brand context is unchanged while connection health is unavailable."}</small>
                <Link className="tertiary-button" href={channelsHref}>{instagramSource ? "Manage in Channels" : "Open Channels"}</Link>
              </article>
            </div>

            <details className="brand-add-source">
              <summary className="secondary-button">Add source</summary>
              <div className="brand-add-source-grid">
                <form action={addKnowledgeSourceAction.bind(null, brand.id)}>
                  <input type="hidden" name="type" value="url" />
                  <label>Public link<input name="url" type="url" required inputMode="url" placeholder="https://example.com/about" /></label>
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
              <p className="brand-source-safety">File uploads remain behind Kairo's quarantine and malware-scan boundary; this surface does not bypass that control.</p>
            </details>

            <div className="brand-source-list">
              {sources.length ? sources.map((source) => <KnowledgeSourceRow key={source.id} brandId={brand.id} source={source} />) : (
                <p className="brand-empty-copy">No additional sources yet.</p>
              )}
            </div>
          </section>

          <section className="brand-profile-section brand-channels-entry" id="channels" aria-labelledby="channels-entry-title">
            <header>
              <div>
                <p className="eyebrow">Channels</p>
                <h2 id="channels-entry-title">Publishing &amp; Insights destinations</h2>
                <p>Connect and manage the accounts Kairo can publish to and read provider Insights from. Credentials stay behind the connection boundary.</p>
              </div>
              <Link className="primary-button" href={channelsHref}>Open Channels</Link>
            </header>
          </section>
        </div>
      </main>
    </KairoProductShell>
  );
}

function SummaryFact({ label, value }: { label: string; value?: string }) {
  return <div><dt>{label}</dt><dd>{value ?? "Not set"}</dd></div>;
}

function KnowledgeSourceRow({ brandId, source }: { brandId: string; source: KnowledgeSourceDto }) {
  const terminal = ["removed", "replaced"].includes(source.status);
  return (
    <article className={`brand-source-row ${terminal ? "terminal" : ""}`}>
      <div>
        <span>{friendlySourceType(source.type)}</span>
        <strong>{source.title ?? source.sourceUrl ?? "Private Brand knowledge"}</strong>
        {source.sourceUrl ? <small>{source.sourceUrl}</small> : source.hasPrivateContent ? <small>Private content retained inside this Brand.</small> : null}
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
  if (type === "url" || type === "website") return "Public link";
  if (type === "note" || type === "pasted") return "Private note";
  if (type === "document") return "File";
  if (type === "product") return "Product context";
  return "Research";
}

function friendlySourceStatus(status: KnowledgeSourceDto["status"]) {
  if (status === "quarantined") return "Needs scan";
  if (status === "failed") return "Needs attention";
  if (status === "disabled") return "Disabled";
  if (status === "removed") return "Removed";
  if (status === "replaced") return "Replaced";
  return "Active";
}

function safeHost(value: string) {
  try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return value; }
}

function friendlyDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "recently";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
