import Link from "next/link";
import { redirect } from "next/navigation";
import type { BrandBrainFieldDto } from "@kairo/contracts";
import { getBrand, getBrandBrain, getKnowledgeSources, getSession } from "../../../../src/lib/kairo-api";
import { PilotMobileNav } from "../../../pilot-mobile-nav";
import { buildBrandBrainAction } from "./guided-actions";

const primaryNav = ["Today", "Discover", "Ideas", "Campaigns", "Content Studio", "Calendar", "Performance", "Brand Brain"];
type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string; setup?: string }>;

const summaries = [
  { title: "Positioning", keys: ["positioning.market-position", "positioning.value-proposition"] },
  { title: "Audience", keys: ["audience.primary"] },
  { title: "Voice", keys: ["voice.tone"] },
  { title: "Content strategy", keys: ["content.pillars", "content.preferred-topics"] },
] as const;

export default async function BrandBrainPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
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
  const fieldMap = new Map(brain.map((field) => [field.fieldKey, field]));
  const activePublicSource = sources.find((source) => source.status === "active" && source.sourceUrl)?.sourceUrl;
  const publicReference = brand.publicProfileUrl ?? brand.publicSourceUrl ?? activePublicSource;
  const existingObjective = fieldMap.get("goals.objectives")?.value;
  const ownerDirective = fieldMap.get("boundaries.owner-directive")?.value ?? "";
  const reviewItems = brain.filter((field) => field.state === "stale" || (field.section === "boundaries" && field.state === "inferred"));
  const suggestedCount = brain.filter((field) => field.state === "inferred").length;
  const confirmedCount = brain.filter((field) => field.state === "confirmed").length;

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div><div className="wordmark"><span className="brandmark" aria-hidden="true" />Kairo</div><p className="sidebar-caption">Content Intelligence</p></div>
        <nav className="nav-list">
          {primaryNav.map((item) => {
            const encoded = encodeURIComponent(brand.id);
            if (item === "Today") return <Link key={item} className="nav-item" href={`/?workspace=${encodeURIComponent(workspace.id)}&brand=${encoded}`}>{item}</Link>;
            if (item === "Discover") return <Link key={item} className="nav-item" href={`/brands/${encoded}/discover`}>{item}</Link>;
            if (item === "Ideas") return <Link key={item} className="nav-item" href={`/brands/${encoded}/ideas`}>{item}</Link>;
            if (item === "Campaigns" || item === "Content Studio") return <Link key={item} className="nav-item" href={`/brands/${encoded}/campaigns`}>{item}</Link>;
            if (item === "Calendar") return <Link key={item} className="nav-item" href={`/brands/${encoded}/calendar`}>{item}</Link>;
            if (item === "Performance") return <Link key={item} className="nav-item" href={`/brands/${encoded}/performance`}>{item}</Link>;
            return <Link key={item} className="nav-item active" href={`/brands/${encoded}/brain`} aria-current="page">{item}</Link>;
          })}
        </nav>
        <div className="sidebar-footer"><span className="nav-item disabled">Settings<small>Later</small></span><a className="nav-item" href="/auth/logout">Sign out</a></div>
      </aside>

      <main className="workspace-main guided-brain-main">
        <header className="topbar brain-topbar">
          <div>
            <p className="eyebrow">Brand Brain</p>
            <h1>{brand.name}</h1>
            <p className="lede">Give Kairo the few decisions only you can make. Kairo will propose the rest from your Brand setup and any readable public evidence, and you stay in control.</p>
          </div>
          <div className="scope-picker" aria-label="Current Brand scope"><span className="scope-label">Brand</span><strong>{brand.name}</strong><span className="scope-meta">{workspace.name}</span></div>
        </header>

        {messages.notice ? <div className="notice success" role="status">{messages.notice}</div> : null}
        {messages.error ? <div className="notice error" role="alert">{messages.error}</div> : null}

        <section className="guided-setup-card" aria-labelledby="guided-setup-heading">
          <div className="guided-setup-copy">
            <p className="eyebrow">Quick setup</p>
            <h2 id="guided-setup-heading">Build my Brand Brain</h2>
            <p>Kairo can start from your Brand and goal. An optional public website, social profile, article, blog or PDF gives Kairo more evidence for positioning, audience, voice and content-strategy suggestions. Suggestions stay reviewable—they do not silently become owner-confirmed truth.</p>
            {publicReference ? <div className="reference-chip"><span>Using</span><strong>{publicReference}</strong></div> : null}
          </div>

          <form action={buildBrandBrainAction.bind(null, brand.id)} className="guided-setup-form">
            {!publicReference ? <label>Public Brand reference <span>optional</span>
              <span>Website, social profile, article, blog, product page or public PDF.</span>
              <input name="publicReferenceUrl" type="url" inputMode="url" placeholder="https://yourbrand.com/about" />
            </label> : null}
            <label>What matters most right now?
              <span>This is an owner decision. Kairo will optimise suggestions around it.</span>
              <select name="primaryObjective" defaultValue={objectiveValue(existingObjective)} required>
                <option value="grow-audience">Grow audience</option>
                <option value="build-authority">Build authority</option>
                <option value="generate-leads">Generate leads</option>
                <option value="build-community">Build community</option>
                <option value="promote-offer">Promote an offer</option>
              </select>
            </label>
            <label>Anything Kairo must never say or do? <span>optional</span>
              <textarea name="ownerBoundary" rows={3} maxLength={4000} defaultValue={ownerDirective} placeholder="For example: never imply dangerous street riding is something to imitate." />
            </label>
            <button className="primary-button" type="submit">{brain.length ? "Refresh suggestions" : "Build my Brand Brain"}</button>
          </form>
        </section>

        <section className="brain-review-header" aria-labelledby="learned-heading">
          <div><p className="eyebrow">Review</p><h2 id="learned-heading">What Kairo learned</h2><p>Scan the important parts. Open Review & Control only when you want to inspect or change the details.</p></div>
          <div className="brain-review-stats" aria-label="Brand Brain states"><span><strong>{confirmedCount}</strong> confirmed</span><span><strong>{suggestedCount}</strong> suggested</span><span><strong>{reviewItems.length}</strong> need review</span></div>
        </section>

        <div className="brain-summary-grid">
          {summaries.map((summary) => {
            const field = firstField(fieldMap, summary.keys);
            return <article className="brain-summary-card" key={summary.title}>
              <div className="brain-summary-heading"><h3>{summary.title}</h3><FieldState field={field} /></div>
              <p>{field?.value ?? "Kairo will suggest this from your Brand setup and any readable public evidence."}</p>
            </article>;
          })}
        </div>

        <section className={`review-queue ${reviewItems.length ? "has-items" : ""}`} aria-labelledby="review-queue-heading">
          <div>
            <p className="eyebrow">Human attention</p>
            <h2 id="review-queue-heading">{reviewItems.length ? `${reviewItems.length} ${reviewItems.length === 1 ? "item needs" : "items need"} your review` : "Nothing urgent to review"}</h2>
            <p>{reviewItems.length ? "Kairo will not treat suggested safeguards or stale context as silently owner-approved." : "Confirmed owner context remains authoritative. Suggested strategy stays inspectable and correctable."}</p>
          </div>
          {reviewItems.length ? <div className="review-items">{reviewItems.slice(0, 4).map((field) => <div key={field.id}><strong>{friendlyFieldName(field.fieldKey)}</strong><span>{field.value}</span><FieldState field={field} /></div>)}</div> : null}
          <Link className="secondary-button" href={`/brands/${encodeURIComponent(brand.id)}/brand-brain-control`}>Advanced Brand Brain / Review &amp; Control</Link>
        </section>

        <section className="advanced-entry-card">
          <div><p className="eyebrow">Advanced</p><h2>Need full control?</h2><p>Inspect every field, correct wording, confirm suggestions, and manage private Knowledge sources without cluttering normal setup.</p></div>
          <Link className="secondary-button" href={`/brands/${encodeURIComponent(brand.id)}/brand-brain-control`}>Open Review &amp; Control</Link>
        </section>
      </main>

      <PilotMobileNav brandId={brand.id} active="More" />
    </div>
  );
}

function firstField(map: Map<string, BrandBrainFieldDto>, keys: readonly string[]) {
  for (const key of keys) { const field = map.get(key); if (field) return field; }
  return undefined;
}

function FieldState({ field }: { field?: BrandBrainFieldDto }) {
  if (!field) return <span className="field-state unset">Not set</span>;
  const label = field.state === "confirmed" ? "Confirmed" : field.state === "inferred" ? "Suggested" : "Needs refresh";
  return <span className={`field-state ${field.state}`}><i className={`state-dot ${field.state}`} aria-hidden="true" />{label}</span>;
}

function objectiveValue(value?: string) {
  if (value === "Build authority") return "build-authority";
  if (value === "Generate leads") return "generate-leads";
  if (value === "Build community") return "build-community";
  if (value === "Promote an offer") return "promote-offer";
  return "grow-audience";
}

function friendlyFieldName(key: string) {
  const names: Record<string, string> = {
    "boundaries.claims-to-avoid": "Claims to avoid",
    "boundaries.prohibited-subjects": "Prohibited subjects",
    "boundaries.sensitive-subjects": "Sensitive subjects",
  };
  return names[key] ?? key.split(".").at(-1)?.replace(/-/g, " ") ?? key;
}
