import Link from "next/link";
import { redirect } from "next/navigation";
import type { BrandBrainFieldDto, BrandBrainSection, KnowledgeSourceDto } from "@kairo/contracts";
import { getBrand, getBrandBrain, getKnowledgeSources, getSession } from "../../../../src/lib/kairo-api";
import { PilotMobileNav } from "../../../pilot-mobile-nav";
import {
  addKnowledgeSourceAction,
  removeKnowledgeSourceAction,
  saveBrandBrainFieldAction,
  setKnowledgeSourceEnabledAction,
} from "./actions";

const primaryNav = ["Today", "Discover", "Ideas", "Campaigns", "Content Studio", "Calendar", "Performance", "Brand Brain"];
type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;
type FieldDefinition = { key: string; label: string; hint: string };
type SectionDefinition = { section: BrandBrainSection; title: string; description: string; fields: FieldDefinition[] };

const sections: SectionDefinition[] = [
  { section: "identity", title: "Identity", description: "Stable facts about what the Brand is and where it operates.", fields: [
    { key: "identity.description", label: "Description", hint: "What the Brand does in plain language." },
    { key: "identity.category", label: "Category", hint: "The Brand's primary category or sector." },
    { key: "identity.geography", label: "Geography", hint: "Primary market, region or geographic context." },
    { key: "identity.language", label: "Language", hint: "Primary language or language mix for content." },
  ] },
  { section: "positioning", title: "Positioning", description: "How the Brand should be understood relative to alternatives.", fields: [
    { key: "positioning.value-proposition", label: "Value proposition", hint: "The useful promise the Brand makes to its audience." },
    { key: "positioning.differentiation", label: "Differentiation", hint: "What makes this Brand meaningfully different." },
    { key: "positioning.market-position", label: "Market position", hint: "How the Brand wants to be positioned in its market." },
  ] },
  { section: "audience", title: "Audience", description: "Who the Brand serves and what matters to them.", fields: [
    { key: "audience.primary", label: "Primary audience", hint: "The people this Brand most needs to reach." },
    { key: "audience.pains", label: "Audience pains", hint: "Problems, frustrations or unmet needs." },
    { key: "audience.motivations", label: "Motivations", hint: "What the audience wants to achieve or become." },
    { key: "audience.sophistication", label: "Sophistication", hint: "How experienced the audience is with the subject." },
  ] },
  { section: "voice", title: "Voice", description: "How content should sound and what language should be avoided.", fields: [
    { key: "voice.tone", label: "Tone", hint: "For example: clear, technical, warm, direct." },
    { key: "voice.vocabulary", label: "Vocabulary", hint: "Preferred terminology, phrasing and language patterns." },
    { key: "voice.prohibited-wording", label: "Prohibited wording", hint: "Words or phrases that should not appear." },
    { key: "voice.examples", label: "Examples", hint: "Short examples that represent the desired voice." },
  ] },
  { section: "content-strategy", title: "Content strategy", description: "The themes and channels Kairo should plan around.", fields: [
    { key: "content.pillars", label: "Content pillars", hint: "Recurring areas the Brand has authority to discuss." },
    { key: "content.preferred-topics", label: "Preferred topics", hint: "Topics the Brand wants to cover more often." },
    { key: "content.channels", label: "Channels", hint: "Relevant channels such as Instagram or LinkedIn." },
  ] },
  { section: "goals", title: "Goals", description: "What content should help this Brand accomplish.", fields: [
    { key: "goals.objectives", label: "Primary objectives", hint: "Owner-confirmed business objective used to steer Kairo." },
  ] },
  { section: "boundaries", title: "Boundaries", description: "Hard limits and safeguards Kairo must respect.", fields: [
    { key: "boundaries.owner-directive", label: "Owner directive", hint: "Anything the owner explicitly says Kairo must never say or do." },
    { key: "boundaries.claims-to-avoid", label: "Claims to avoid", hint: "Claims that are unsupported, sensitive or not authorised." },
    { key: "boundaries.prohibited-subjects", label: "Prohibited subjects", hint: "Subjects this Brand should not discuss." },
    { key: "boundaries.sensitive-subjects", label: "Sensitive subjects", hint: "Subjects that need extra care or human review." },
  ] },
];

export default async function BrandBrainControlPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/");
  const { brandId } = await params;
  const brand = await getBrand(brandId);
  if (!brand) redirect("/");
  const workspace = session.workspaces.find((item) => item.id === brand.workspaceId);
  if (!workspace) redirect("/");
  const [brain, sources, messages] = await Promise.all([getBrandBrain(brand.id), getKnowledgeSources(brand.id), searchParams]);
  const fields = new Map(brain.map((field) => [field.fieldKey, field]));
  const encoded = encodeURIComponent(brand.id);

  return <div className="app-shell">
    <aside className="sidebar" aria-label="Primary navigation">
      <div><div className="wordmark"><span className="brandmark" aria-hidden="true" />Kairo</div><p className="sidebar-caption">Content Intelligence</p></div>
      <nav className="nav-list">{primaryNav.map((item) => {
        if (item === "Today") return <Link key={item} className="nav-item" href={`/?workspace=${encodeURIComponent(workspace.id)}&brand=${encoded}`}>{item}</Link>;
        if (item === "Discover") return <Link key={item} className="nav-item" href={`/brands/${encoded}/discover`}>{item}</Link>;
        if (item === "Ideas") return <Link key={item} className="nav-item" href={`/brands/${encoded}/ideas`}>{item}</Link>;
        if (item === "Campaigns" || item === "Content Studio") return <Link key={item} className="nav-item" href={`/brands/${encoded}/campaigns`}>{item}</Link>;
        if (item === "Calendar") return <Link key={item} className="nav-item" href={`/brands/${encoded}/calendar`}>{item}</Link>;
        if (item === "Performance") return <Link key={item} className="nav-item" href={`/brands/${encoded}/performance`}>{item}</Link>;
        return <Link key={item} className="nav-item active" href={`/brands/${encoded}/brain`}>{item}</Link>;
      })}</nav>
      <div className="sidebar-footer"><span className="nav-item disabled">Settings<small>Later</small></span><a className="nav-item" href="/auth/logout">Sign out</a></div>
    </aside>

    <main className="workspace-main brain-main">
      <header className="topbar brain-topbar">
        <div><p className="eyebrow">Advanced Brand Brain</p><h1>Review &amp; Control</h1><p className="lede">Inspect every field, confirm or correct Kairo's suggestions, and manage Brand-private Knowledge. This is the expert surface—not a required setup checklist.</p></div>
        <div className="scope-picker"><span className="scope-label">Brand</span><strong>{brand.name}</strong><span className="scope-meta">{workspace.name}</span></div>
      </header>
      <div style={{ marginBottom: 20 }}><Link className="text-link" href={`/brands/${encoded}/brain`}>← Back to guided Brand Brain</Link></div>
      {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
      {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

      <div className="brain-layout">
        <div className="brain-sections">
          <section className="brain-intro">
            <div><p className="eyebrow">Context states</p><h2>Owner truth stays distinct from suggestions</h2></div>
            <div className="state-legend"><span><i className="state-dot confirmed" />Confirmed</span><span><i className="state-dot inferred" />Suggested</span><span><i className="state-dot stale" />Needs refresh</span></div>
          </section>
          {sections.map((section) => <section className="brain-section" key={section.section}>
            <div className="brain-section-heading"><h2>{section.title}</h2><p>{section.description}</p></div>
            <div className="brain-field-list">{section.fields.map((definition) => <BrainFieldEditor key={definition.key} brandId={brand.id} section={section.section} definition={definition} field={fields.get(definition.key)} />)}</div>
          </section>)}
        </div>

        <aside className="knowledge-panel" aria-labelledby="knowledge-heading">
          <div className="knowledge-heading"><p className="eyebrow">Knowledge</p><h2 id="knowledge-heading">Private sources</h2><p>Add knowledge in human terms. Kairo keeps the internal source taxonomy and provenance mechanics behind the scenes.</p></div>

          <form action={addKnowledgeSourceAction.bind(null, brand.id)} className="knowledge-form">
            <input type="hidden" name="type" value="url" />
            <label>Add a link <span>website, article or public Brand page</span><input name="url" type="url" required inputMode="url" placeholder="https://example.com/about" /></label>
            <label>Title <span>optional</span><input name="title" placeholder="Brand story" maxLength={200} /></label>
            <button className="secondary-button" type="submit">Add link</button>
          </form>

          <form action={addKnowledgeSourceAction.bind(null, brand.id)} className="knowledge-form">
            <input type="hidden" name="type" value="note" />
            <label>Paste something Kairo should know <span>private Brand context</span><textarea name="content" required rows={5} maxLength={100000} placeholder="Paste approved positioning, product context, research notes or operating guidance…" /></label>
            <label>Title <span>optional</span><input name="title" placeholder="Owner notes" maxLength={200} /></label>
            <button className="secondary-button" type="submit">Add private knowledge</button>
          </form>

          <div className="document-safety-note"><strong>Files</strong><p>Document bytes must continue through Kairo's quarantine and malware-scan boundary. This screen will not bypass that control with a raw upload shortcut.</p></div>
          <div className="source-list">{sources.length ? sources.map((source) => <KnowledgeSourceRow key={source.id} brandId={brand.id} source={source} />) : <p className="muted">No additional Knowledge sources yet.</p>}</div>
        </aside>
      </div>
    </main>
    <PilotMobileNav brandId={brand.id} active="More" />
  </div>;
}

function BrainFieldEditor({ brandId, section, definition, field }: { brandId: string; section: BrandBrainSection; definition: FieldDefinition; field?: BrandBrainFieldDto }) {
  const label = field?.state === "confirmed" ? "Confirmed" : field?.state === "inferred" ? "Suggested" : field?.state === "stale" ? "Needs refresh" : "Not set";
  return <form className="brain-field" action={saveBrandBrainFieldAction.bind(null, brandId, definition.key, section)}>
    <div className="brain-field-label"><div><label htmlFor={definition.key}>{definition.label}</label><p>{definition.hint}</p></div><span className={`field-state ${field?.state ?? "unset"}`}><i className={`state-dot ${field?.state ?? ""}`} />{label}</span></div>
    <textarea id={definition.key} name="value" required maxLength={10000} defaultValue={field?.value ?? ""} placeholder={field ? undefined : "Not set yet"} />
    {field ? <input type="hidden" name="expectedVersion" value={field.version} /> : null}
    <div className="field-actions"><span className="field-meta">{field ? `Version ${field.version}${field.sourceIds.length ? ` · ${field.sourceIds.length} source${field.sourceIds.length === 1 ? "" : "s"}` : ""}` : "Not set"}</span><button className="secondary-button" type="submit">{field?.state === "inferred" ? "Confirm / edit" : "Save"}</button></div>
  </form>;
}

function KnowledgeSourceRow({ brandId, source }: { brandId: string; source: KnowledgeSourceDto }) {
  const terminal = ["removed", "replaced"].includes(source.status);
  return <div className={`source-row ${terminal ? "removed" : ""}`}>
    <div className="source-row-heading"><div><span className="source-type">{friendlySourceType(source.type)}</span><strong>{source.title ?? source.sourceUrl ?? "Private Brand knowledge"}</strong></div><span className={`source-status ${source.status}`}>{source.status}</span></div>
    {source.sourceUrl ? <p className="source-url">{source.sourceUrl}</p> : null}
    {source.hasPrivateContent ? <p className="source-detail">Private content retained inside this Brand.</p> : null}
    {!terminal ? <div className="source-actions">
      {source.status === "active" ? <form action={setKnowledgeSourceEnabledAction.bind(null, brandId, source.id, false)}><button className="tertiary-button" type="submit">Disable</button></form> : null}
      {source.status === "disabled" ? <form action={setKnowledgeSourceEnabledAction.bind(null, brandId, source.id, true)}><button className="tertiary-button" type="submit">Enable</button></form> : null}
      {!['quarantined','failed'].includes(source.status) ? <form action={removeKnowledgeSourceAction.bind(null, brandId, source.id)}><button className="danger-button" type="submit">Remove</button></form> : null}
    </div> : null}
  </div>;
}

function friendlySourceType(type: KnowledgeSourceDto["type"]) {
  if (type === "url" || type === "website") return "Link";
  if (type === "note" || type === "pasted") return "Private note";
  if (type === "document") return "File";
  if (type === "product") return "Product context";
  return "Research";
}
