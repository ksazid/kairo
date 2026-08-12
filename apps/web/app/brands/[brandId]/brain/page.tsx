import Link from "next/link";
import { redirect } from "next/navigation";
import type { BrandBrainFieldDto, BrandBrainSection, KnowledgeSourceDto } from "@kairo/contracts";
import { getBrand, getBrandBrain, getBrands, getKnowledgeSources, getSession } from "../../../../src/lib/kairo-api";
import {
  addKnowledgeSourceAction,
  removeKnowledgeSourceAction,
  saveBrandBrainFieldAction,
  setKnowledgeSourceEnabledAction,
} from "./actions";

const primaryNav = ["Today", "Discover", "Ideas", "Campaigns", "Content Studio", "Calendar", "Performance", "Brand Brain"];
const mobileNav = ["Today", "Discover", "Ideas", "Calendar", "More"];

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;
type FieldDefinition = { key: string; label: string; hint: string };
type SectionDefinition = { section: BrandBrainSection; title: string; description: string; fields: FieldDefinition[] };

const sections: SectionDefinition[] = [
  { section: "identity", title: "Identity", description: "What this Brand is and the context it operates in.", fields: [
    { key: "identity.description", label: "Description", hint: "A concise description of the Brand." },
    { key: "identity.category", label: "Category", hint: "The market or subject area this Brand belongs to." },
    { key: "identity.geography", label: "Geography", hint: "Primary market, region or geographic context." },
    { key: "identity.language", label: "Language", hint: "Primary language or language mix for content." },
  ]},
  { section: "positioning", title: "Positioning", description: "How the Brand should be understood relative to alternatives.", fields: [
    { key: "positioning.value-proposition", label: "Value proposition", hint: "The practical value this Brand promises." },
    { key: "positioning.differentiation", label: "Differentiation", hint: "What makes this Brand meaningfully different." },
    { key: "positioning.market-position", label: "Market position", hint: "How the Brand wants to be positioned in its market." },
  ]},
  { section: "audience", title: "Audience", description: "Who the Brand serves and what matters to them.", fields: [
    { key: "audience.primary", label: "Primary audience", hint: "The people this Brand most needs to reach." },
    { key: "audience.pains", label: "Audience pains", hint: "Problems, frustrations or unmet needs." },
    { key: "audience.motivations", label: "Motivations", hint: "What the audience wants to achieve or become." },
    { key: "audience.sophistication", label: "Sophistication", hint: "How experienced the audience is with the subject." },
  ]},
  { section: "voice", title: "Voice", description: "How content should sound and what language should be avoided.", fields: [
    { key: "voice.tone", label: "Tone", hint: "For example: clear, technical, warm, direct." },
    { key: "voice.vocabulary", label: "Vocabulary", hint: "Preferred terminology, phrasing and language patterns." },
    { key: "voice.prohibited-wording", label: "Prohibited wording", hint: "Words or phrases that should not appear." },
    { key: "voice.examples", label: "Examples", hint: "Short examples that represent the desired voice." },
  ]},
  { section: "content-strategy", title: "Content strategy", description: "The themes and channels Kairo should plan around later.", fields: [
    { key: "content.pillars", label: "Content pillars", hint: "Recurring areas the Brand has authority to discuss." },
    { key: "content.preferred-topics", label: "Preferred topics", hint: "Topics the Brand wants to cover more often." },
    { key: "content.channels", label: "Channels", hint: "Relevant channels such as Instagram or LinkedIn." },
  ]},
  { section: "goals", title: "Goals", description: "What content should help this Brand accomplish.", fields: [
    { key: "goals.objectives", label: "Primary objectives", hint: "Examples: authority, education, qualified leads, retention." },
  ]},
  { section: "boundaries", title: "Boundaries", description: "Hard limits Kairo must respect when using Brand context.", fields: [
    { key: "boundaries.claims-to-avoid", label: "Claims to avoid", hint: "Claims that are unsupported, sensitive or not authorised." },
    { key: "boundaries.prohibited-subjects", label: "Prohibited subjects", hint: "Subjects this Brand should not discuss." },
    { key: "boundaries.sensitive-subjects", label: "Sensitive subjects", hint: "Subjects that need extra care or human review." },
  ]},
];

export default async function BrandBrainPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/");
  const { brandId } = await params;
  const brand = await getBrand(brandId);
  if (!brand) redirect("/");
  const workspace = session.workspaces.find((item) => item.id === brand.workspaceId);
  if (!workspace) redirect("/");

  const [brands, brain, sources, messages] = await Promise.all([
    getBrands(workspace.id),
    getBrandBrain(brand.id),
    getKnowledgeSources(brand.id),
    searchParams,
  ]);
  const fieldMap = new Map(brain.map((field) => [field.fieldKey, field]));
  const knownKeys = new Set(sections.flatMap((section) => section.fields.map((field) => field.key)));
  const additional = brain.filter((field) => !knownKeys.has(field.fieldKey));

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div>
          <div className="wordmark"><span className="brandmark" aria-hidden="true" />Kairo</div>
          <p className="sidebar-caption">Content Intelligence</p>
        </div>
        <nav className="nav-list">
          {primaryNav.map((item) => {
            if (item === "Today") return <Link key={item} className="nav-item" href={`/?workspace=${encodeURIComponent(workspace.id)}&brand=${encodeURIComponent(brand.id)}`}>{item}</Link>;
            if (item === "Brand Brain") return <Link key={item} className="nav-item active" href={`/brands/${encodeURIComponent(brand.id)}/brain`} aria-current="page">{item}</Link>;
            return <span key={item} className="nav-item disabled" aria-disabled="true">{item}<small>Later</small></span>;
          })}
        </nav>
        <div className="sidebar-footer">
          <span className="nav-item disabled">Settings<small>Later</small></span>
          <a className="nav-item" href="/auth/logout">Sign out</a>
        </div>
      </aside>

      <main className="workspace-main brain-main">
        <header className="topbar brain-topbar">
          <div>
            <p className="eyebrow">Brand Brain</p>
            <h1>{brand.name}</h1>
            <p className="lede">Keep the Brand context Kairo is allowed to rely on clear, inspectable and correctable.</p>
          </div>
          <div className="scope-picker" aria-label="Current Brand scope">
            <span className="scope-label">Brand</span>
            <strong>{brand.name}</strong>
            <span className="scope-meta">{workspace.name}</span>
          </div>
        </header>

        {messages.notice ? <div className="notice success" role="status">{messages.notice}</div> : null}
        {messages.error ? <div className="notice error" role="alert">{messages.error}</div> : null}

        <div className="brain-layout">
          <div className="brain-sections">
            <section className="brain-intro" aria-labelledby="brain-context-heading">
              <div>
                <p className="eyebrow">Trusted context</p>
                <h2 id="brain-context-heading">What Kairo knows about this Brand</h2>
              </div>
              <div className="state-legend" aria-label="Brand Brain field states">
                <span><i className="state-dot confirmed" aria-hidden="true" />Confirmed</span>
                <span><i className="state-dot inferred" aria-hidden="true" />Inferred</span>
                <span><i className="state-dot stale" aria-hidden="true" />Needs review</span>
              </div>
            </section>

            {sections.map((section) => (
              <section className="brain-section" key={section.section} aria-labelledby={`section-${section.section}`}>
                <div className="brain-section-heading">
                  <div><h2 id={`section-${section.section}`}>{section.title}</h2><p>{section.description}</p></div>
                </div>
                <div className="brain-field-list">
                  {section.fields.map((definition) => (
                    <BrainFieldEditor key={definition.key} brandId={brand.id} definition={definition} section={section.section} field={fieldMap.get(definition.key)} />
                  ))}
                </div>
              </section>
            ))}

            {additional.length ? (
              <section className="brain-section" aria-labelledby="additional-context-heading">
                <div className="brain-section-heading"><div><h2 id="additional-context-heading">Additional context</h2><p>Other scoped Brand Brain facts retained with their provenance state.</p></div></div>
                <div className="brain-field-list">
                  {additional.map((field) => <ReadOnlyField key={field.id} field={field} />)}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="knowledge-panel" aria-labelledby="knowledge-heading">
            <div className="knowledge-heading">
              <p className="eyebrow">Knowledge</p>
              <h2 id="knowledge-heading">Private sources</h2>
              <p>Sources stay inside this Brand. Removing one also removes source-only derived context under DEC-006.</p>
            </div>

            <form action={addKnowledgeSourceAction.bind(null, brand.id)} className="knowledge-form">
              <label>Source type
                <select name="type" defaultValue="url">
                  <option value="url">URL</option><option value="website">Website</option><option value="note">Note</option><option value="pasted">Pasted material</option><option value="research">Research</option><option value="product">Product information</option>
                </select>
              </label>
              <label>Title <span>optional</span><input name="title" maxLength={200} placeholder="Positioning notes" /></label>
              <label>URL <span>for URL / website</span><input name="url" type="url" inputMode="url" placeholder="https://example.com/about" /></label>
              <label>Private text <span>for note / pasted / research / product</span><textarea name="content" rows={5} maxLength={100000} placeholder="Add Brand-approved context…" /></label>
              <button className="primary-button" type="submit">Add source</button>
            </form>

            <div className="document-safety-note">
              <strong>Documents stay gated.</strong>
              <p>Secure document activation requires quarantine, content checks and a clean malware scan. This slice does not expose an unsafe direct file-upload shortcut.</p>
            </div>

            <div className="source-list">
              {sources.length === 0 ? <div className="empty-state"><strong>No private sources yet.</strong><p>Add a trusted URL or Brand-approved text when you are ready.</p></div> : sources.map((source) => <KnowledgeSourceRow key={source.id} brandId={brand.id} source={source} />)}
            </div>
          </aside>
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileNav.map((item) => item === "Today" ? (
          <Link key={item} href={`/?workspace=${encodeURIComponent(workspace.id)}&brand=${encodeURIComponent(brand.id)}`} className="mobile-nav-item">{item}</Link>
        ) : item === "More" ? (
          <Link key={item} href={`/brands/${encodeURIComponent(brand.id)}/brain`} className="mobile-nav-item active" aria-current="page">{item}</Link>
        ) : (
          <span key={item} className="mobile-nav-item disabled" aria-disabled="true">{item}</span>
        ))}
      </nav>
    </div>
  );
}

function BrainFieldEditor({ brandId, definition, section, field }: { brandId: string; definition: FieldDefinition; section: BrandBrainSection; field?: BrandBrainFieldDto }) {
  const action = saveBrandBrainFieldAction.bind(null, brandId, definition.key, section);
  return (
    <form action={action} className="brain-field">
      <div className="brain-field-label">
        <div><label htmlFor={`field-${definition.key}`}>{definition.label}</label><p>{definition.hint}</p></div>
        <FieldState field={field} />
      </div>
      <textarea id={`field-${definition.key}`} name="value" defaultValue={field?.value ?? ""} rows={3} maxLength={10000} placeholder="Not set yet" aria-describedby={`hint-${definition.key}`} />
      <span id={`hint-${definition.key}`} className="sr-only">{definition.hint}</span>
      {field ? <input type="hidden" name="expectedVersion" value={field.version} /> : null}
      <div className="field-actions">
        <span className="field-meta">{field ? `Version ${field.version}` : "Not set"}</span>
        <button className="secondary-button" type="submit">{field?.state === "inferred" || field?.state === "stale" ? "Confirm / correct" : "Save"}</button>
      </div>
    </form>
  );
}

function FieldState({ field }: { field?: BrandBrainFieldDto }) {
  if (!field) return <span className="field-state unset">Not set</span>;
  const label = field.state === "confirmed" ? "Confirmed" : field.state === "inferred" ? "Inferred" : "Needs review";
  return <span className={`field-state ${field.state}`}><i className={`state-dot ${field.state}`} aria-hidden="true" />{label}</span>;
}

function ReadOnlyField({ field }: { field: BrandBrainFieldDto }) {
  return <div className="brain-field readonly"><div className="brain-field-label"><div><strong>{field.fieldKey}</strong><p>{field.value}</p></div><FieldState field={field} /></div></div>;
}

function KnowledgeSourceRow({ brandId, source }: { brandId: string; source: KnowledgeSourceDto }) {
  const removed = source.status === "removed";
  return (
    <article className={`source-row ${removed ? "removed" : ""}`}>
      <div className="source-row-heading">
        <div><span className="source-type">{source.type}</span><strong>{removed ? "Removed private source" : source.title ?? source.sourceUrl ?? "Untitled source"}</strong></div>
        <span className={`source-status ${source.status}`}>{sourceStatusLabel(source.status)}</span>
      </div>
      {!removed && source.sourceUrl ? <p className="source-url">{source.sourceUrl}</p> : null}
      {source.status === "quarantined" ? <p className="source-detail">Waiting for an approved validation and malware-scan path before activation.</p> : null}
      {removed ? <p className="source-detail">Content was removed. Only the content-free audit tombstone remains.</p> : null}
      {!removed ? (
        <div className="source-actions">
          {source.status === "active" ? <form action={setKnowledgeSourceEnabledAction.bind(null, brandId, source.id, false)}><button className="tertiary-button" type="submit">Disable</button></form> : null}
          {source.status === "disabled" ? <form action={setKnowledgeSourceEnabledAction.bind(null, brandId, source.id, true)}><button className="tertiary-button" type="submit">Enable</button></form> : null}
          <details className="remove-confirm">
            <summary>Remove source</summary>
            <div className="remove-confirm-panel">
              <p>This permanently removes the private source and source-only derived context. Confirmed Brand Brain facts remain.</p>
              <form action={removeKnowledgeSourceAction.bind(null, brandId, source.id)}><button className="danger-button" type="submit">Confirm removal</button></form>
            </div>
          </details>
        </div>
      ) : null}
    </article>
  );
}

function sourceStatusLabel(status: KnowledgeSourceDto["status"]): string {
  if (status === "active") return "Active";
  if (status === "disabled") return "Disabled";
  if (status === "quarantined") return "Quarantined";
  if (status === "removed") return "Removed";
  if (status === "replaced") return "Replaced";
  return "Failed";
}
