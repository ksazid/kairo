import Link from "next/link";
import { redirect } from "next/navigation";
import type { BrandBrainFieldDto, BrandBrainSection, KnowledgeSourceDto } from "@kairo/contracts";
import { getBrand, getBrandBrain, getKnowledgeSources, getSession } from "../../../../src/lib/kairo-api";
import {
  BRAND_BRAIN_SECTIONS,
  buildBrandBrainOverview,
  fieldAnchor,
  fieldEvidenceLabel,
  fieldStateLabel,
  findFieldDefinition,
  type BrandBrainFieldDefinition,
} from "../../../../src/lib/brand-brain-view-model";
import { KairoProductShell, KairoScopePicker } from "../../../kairo-product-shell";
import {
  addKnowledgeSourceAction,
  removeKnowledgeSourceAction,
  saveBrandBrainFieldAction,
  setKnowledgeSourceEnabledAction,
} from "./actions";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;

export default async function BrandBrainControlPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/");
  const { brandId } = await params;
  const brand = await getBrand(brandId);
  if (!brand) redirect("/");
  const workspace = session.workspaces.find((item) => item.id === brand.workspaceId);
  if (!workspace) redirect("/");

  const [brain, sources, messages] = await Promise.all([
    getBrandBrain(brand.id),
    getKnowledgeSources(brand.id),
    searchParams,
  ]);
  const overview = buildBrandBrainOverview(brain);
  const sourceIssues = sources.filter((source) => source.status === "failed" || source.status === "quarantined");
  const encoded = encodeURIComponent(brand.id);

  return (
    <KairoProductShell brandId={brand.id} workspaceId={workspace.id} active="Brand Brain" mobileActive="More">
      <main id="kairo-main-content" className="workspace-main brand-brain-workspace brand-brain-control-workspace">
        <header className="topbar brain-page-header">
          <div>
            <p className="eyebrow">Brand Brain</p>
            <h1>Review &amp; Control</h1>
            <p className="lede">Confirm Kairo's suggestions, correct Brand context and manage Knowledge sources. Saving a suggested field turns that field into owner-confirmed Brand truth.</p>
          </div>
          <KairoScopePicker brandName={brand.name} workspaceName={workspace.name} />
        </header>

        <Link className="brain-back-link" href={`/brands/${encoded}/brain`}>← Back to Brand Brain</Link>
        {messages.notice ? <div className="notice success" role="status">{messages.notice}</div> : null}
        {messages.error ? <div className="notice error" role="alert">{messages.error}</div> : null}

        <section className={`brain-control-review ${overview.reviewItems.length ? "has-items" : ""}`} aria-labelledby="control-review-heading">
          <div className="brain-control-review-heading">
            <div>
              <p className="eyebrow">Human control</p>
              <h2 id="control-review-heading">{overview.reviewItems.length ? `${overview.reviewItems.length} ${overview.reviewItems.length === 1 ? "item needs" : "items need"} review` : "Nothing needs review"}</h2>
              <p>{overview.reviewItems.length ? "Review suggestions and stale context before Kairo treats them as owner-confirmed Brand truth." : "All saved Brand Brain context is currently confirmed. You can still edit any section below."}</p>
            </div>
            <div className="state-legend" aria-label="Brand Brain state legend">
              <span><i className="state-dot confirmed" aria-hidden="true" />Confirmed</span>
              <span><i className="state-dot inferred" aria-hidden="true" />Suggested</span>
              <span><i className="state-dot stale" aria-hidden="true" />Needs refresh</span>
            </div>
          </div>

          {overview.reviewItems.length ? (
            <nav className="brain-control-review-list" aria-label="Items requiring Brand Brain review">
              {overview.reviewItems.map((field) => {
                const definition = findFieldDefinition(field.fieldKey);
                return (
                  <a key={field.id} href={`#${fieldAnchor(field.fieldKey)}`}>
                    <span>
                      <strong>{definition?.label ?? friendlyFieldName(field.fieldKey)}</strong>
                      <small>{field.value}</small>
                    </span>
                    <FieldState field={field} />
                  </a>
                );
              })}
            </nav>
          ) : null}
        </section>

        <div className="brain-control-stack">
          {BRAND_BRAIN_SECTIONS.map((section) => {
            const sectionFields = section.fields.map((definition) => overview.fieldMap.get(definition.key)).filter(Boolean) as BrandBrainFieldDto[];
            const reviewCount = sectionFields.filter((field) => field.state === "inferred" || field.state === "stale").length;
            const confirmedCount = sectionFields.filter((field) => field.state === "confirmed").length;
            return (
              <details className="brain-control-section" key={section.section} open={reviewCount > 0}>
                <summary>
                  <div>
                    <strong>{section.title}</strong>
                    <span>{section.description}</span>
                  </div>
                  <span className="section-summary-state">{reviewCount ? `${reviewCount} to review` : `${confirmedCount} confirmed`}</span>
                </summary>
                <div className="brain-field-list">
                  {section.fields.map((definition) => (
                    <BrainFieldEditor
                      key={definition.key}
                      brandId={brand.id}
                      section={section.section}
                      definition={definition}
                      field={overview.fieldMap.get(definition.key)}
                    />
                  ))}
                </div>
              </details>
            );
          })}

          <details id="knowledge-sources" className="brain-control-section knowledge-workspace" open={sourceIssues.length > 0}>
            <summary>
              <div>
                <strong>Knowledge sources</strong>
                <span>Add or manage Brand-private links and notes used as supporting context.</span>
              </div>
              <span className="section-summary-state">{sourceIssues.length ? `${sourceIssues.length} need attention` : `${sources.length} total`}</span>
            </summary>
            <div className="knowledge-body">
              <div className="knowledge-intro">
                <p>Kairo keeps source taxonomy and provenance mechanics behind the scenes. External content remains evidence, not automatic owner truth.</p>
              </div>

              <div className="knowledge-forms">
                <form action={addKnowledgeSourceAction.bind(null, brand.id)} className="knowledge-form">
                  <input type="hidden" name="type" value="url" />
                  <label>
                    Add a link <span>website, article or public Brand page</span>
                    <input name="url" type="url" required inputMode="url" placeholder="https://example.com/about" />
                  </label>
                  <label>
                    Title <span>optional</span>
                    <input name="title" placeholder="Brand story" maxLength={200} />
                  </label>
                  <button className="secondary-button" type="submit">Add link</button>
                </form>

                <form action={addKnowledgeSourceAction.bind(null, brand.id)} className="knowledge-form">
                  <input type="hidden" name="type" value="note" />
                  <label>
                    Paste something Kairo should know <span>private Brand context</span>
                    <textarea name="content" required rows={5} maxLength={100000} placeholder="Paste approved positioning, product context, research notes or operating guidance…" />
                  </label>
                  <label>
                    Title <span>optional</span>
                    <input name="title" placeholder="Owner notes" maxLength={200} />
                  </label>
                  <button className="secondary-button" type="submit">Add private knowledge</button>
                </form>
              </div>

              <div className="document-safety-note">
                <strong>Files</strong>
                <p>Uploaded document bytes must continue through Kairo's quarantine and malware-scan boundary. This screen does not bypass that control with a raw upload shortcut.</p>
              </div>

              <div className="source-list">
                {sources.length ? sources.map((source) => (
                  <KnowledgeSourceRow key={source.id} brandId={brand.id} source={source} />
                )) : (
                  <p className="muted">No additional Knowledge sources yet.</p>
                )}
              </div>
            </div>
          </details>
        </div>
      </main>
    </KairoProductShell>
  );
}

function BrainFieldEditor({
  brandId,
  section,
  definition,
  field,
}: {
  brandId: string;
  section: BrandBrainSection;
  definition: BrandBrainFieldDefinition;
  field?: BrandBrainFieldDto;
}) {
  const actionLabel = field?.state === "inferred"
    ? "Confirm suggestion"
    : field?.state === "stale"
      ? "Review & save"
      : field?.state === "confirmed"
        ? "Save changes"
        : "Save";

  return (
    <form id={fieldAnchor(definition.key)} className={`brain-field ${field?.state === "inferred" || field?.state === "stale" ? "needs-review" : ""}`} action={saveBrandBrainFieldAction.bind(null, brandId, definition.key, section)}>
      <div className="brain-field-label">
        <div>
          <label htmlFor={`input-${fieldAnchor(definition.key)}`}>{definition.label}</label>
          <p>{definition.hint}</p>
        </div>
        <FieldState field={field} />
      </div>
      <textarea
        id={`input-${fieldAnchor(definition.key)}`}
        name="value"
        required
        maxLength={10000}
        defaultValue={field?.value ?? ""}
        placeholder={field ? undefined : "Not set yet"}
      />
      {field ? <input type="hidden" name="expectedVersion" value={field.version} /> : null}
      <div className="field-actions">
        <div className="field-context">
          <span className="field-meta">{field ? `Version ${field.version}` : "Not set"}</span>
          <span className="field-evidence">{fieldEvidenceLabel(field)}</span>
          {field?.state === "inferred" ? <span className="field-confirm-note">Saving confirms this suggestion. Edit it first if needed.</span> : null}
        </div>
        <button className={field?.state === "inferred" ? "primary-button" : "secondary-button"} type="submit">{actionLabel}</button>
      </div>
    </form>
  );
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

function KnowledgeSourceRow({ brandId, source }: { brandId: string; source: KnowledgeSourceDto }) {
  const terminal = ["removed", "replaced"].includes(source.status);
  return (
    <article className={`source-row ${terminal ? "removed" : ""}`}>
      <div className="source-row-heading">
        <div>
          <span className="source-type">{friendlySourceType(source.type)}</span>
          <strong>{source.title ?? source.sourceUrl ?? "Private Brand knowledge"}</strong>
        </div>
        <span className={`source-status ${source.status}`}>{friendlySourceStatus(source.status)}</span>
      </div>
      {source.sourceUrl ? <p className="source-url">{source.sourceUrl}</p> : null}
      {source.hasPrivateContent ? <p className="source-detail">Private content retained inside this Brand.</p> : null}
      {!terminal ? (
        <div className="source-actions">
          {source.status === "active" ? (
            <form action={setKnowledgeSourceEnabledAction.bind(null, brandId, source.id, false)}><button className="tertiary-button" type="submit">Disable</button></form>
          ) : null}
          {source.status === "disabled" ? (
            <form action={setKnowledgeSourceEnabledAction.bind(null, brandId, source.id, true)}><button className="tertiary-button" type="submit">Enable</button></form>
          ) : null}
          {!['quarantined', 'failed'].includes(source.status) ? (
            <form action={removeKnowledgeSourceAction.bind(null, brandId, source.id)}><button className="danger-button" type="submit">Remove</button></form>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function friendlySourceType(type: KnowledgeSourceDto["type"]) {
  if (type === "url" || type === "website") return "Link";
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

function friendlyFieldName(key: string) {
  return key.split(".").at(-1)?.replace(/-/g, " ") ?? key;
}
