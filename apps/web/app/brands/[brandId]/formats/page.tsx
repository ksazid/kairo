import Link from "next/link";
import {
  isFormatChannel,
  isFormatObjective,
  isProductionEffort,
  recommendFormats,
  type FormatObjective,
  type ProductionEffort,
  type AcceptedFormatLearning,
} from "@kairo/domain/format-intelligence";
import type { PublishChannel } from "@kairo/domain/publishing";
import { getBrand, getLearnings } from "../../../../src/lib/kairo-api";
import { PilotMobileNav } from "../../../pilot-mobile-nav";
import { KairoSidebar } from "../ideas/page";
import "./formats.css";

type Params = Promise<{ brandId: string }>;
type Search = Promise<{ channel?: string; objective?: string; effort?: string }>;

const CHANNEL_OPTIONS: Array<{ value: PublishChannel; label: string }> = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "manual", label: "Manual" },
];
const OBJECTIVE_OPTIONS: Array<{ value: FormatObjective; label: string }> = [
  { value: "educate", label: "Educate" },
  { value: "explain", label: "Explain" },
  { value: "compare", label: "Compare" },
  { value: "demonstrate", label: "Demonstrate" },
  { value: "story", label: "Tell a story" },
  { value: "opinion", label: "Share an opinion" },
  { value: "announce", label: "Announce" },
  { value: "conversation", label: "Start a conversation" },
];
const EFFORT_OPTIONS: Array<{ value: ProductionEffort; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default async function FormatsPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [{ brandId }, query] = await Promise.all([params, searchParams]);
  const [brand, learnings] = await Promise.all([getBrand(brandId), getLearnings(brandId).catch(() => [])]);
  if (!brand) {
    return <main className="auth-page"><section className="auth-card"><h1>Brand not found.</h1><Link className="primary-button" href="/">Return to Today</Link></section></main>;
  }

  const channel = query.channel && isFormatChannel(query.channel) ? query.channel : undefined;
  const objective = query.objective && isFormatObjective(query.objective) ? query.objective : undefined;
  const maxEffort = query.effort && isProductionEffort(query.effort) ? query.effort : undefined;
  const acceptedLearnings: AcceptedFormatLearning[] = learnings.flatMap(item => { const format=item.applicability.format; if(item.status!=="accepted"||!isPublishFormat(format))return[];return[{ learningId: item.id, format, ...(isFormatChannel(item.applicability.channel ?? "") ? { channel: item.applicability.channel as PublishChannel } : {}), confidence: item.confidence, evidenceObservationIds: [...new Set(item.evidence.flatMap(group => group.metricObservationIds))], reason: item.statement }] });
  const recommendations = recommendFormats({ channel, objective, maxEffort, acceptedLearnings });
  const base = `/brands/${encodeURIComponent(brand.id)}/formats`;

  return <div className="app-shell">
    <KairoSidebar brandId={brand.id} active="" />
    <main className="workspace-main format-main">
      <header className="topbar format-topbar">
        <div>
          <p className="eyebrow">Format intelligence</p>
          <h1>Choose the shape that serves the idea.</h1>
          <p className="lede">Kairo ranks formats by your channel, objective and production effort. These are explainable content-fit recommendations—not publishing permission or a promise of performance.</p>
        </div>
        <div className="scope-picker"><span className="scope-label">Brand</span><strong>{brand.name}</strong><span className="scope-meta">Private Brand scope</span></div>
      </header>

      <section className="format-filter-panel" aria-labelledby="format-filter-title">
        <div>
          <p className="eyebrow">Narrow the library</p>
          <h2 id="format-filter-title">What are you trying to make?</h2>
        </div>
        <form className="format-filters" method="get">
          <label>Channel
            <select name="channel" defaultValue={channel ?? "all"}>
              <option value="all">Any channel</option>
              {CHANNEL_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>Objective
            <select name="objective" defaultValue={objective ?? "all"}>
              <option value="all">Any objective</option>
              {OBJECTIVE_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>Maximum effort
            <select name="effort" defaultValue={maxEffort ?? "all"}>
              <option value="all">Any effort</option>
              {EFFORT_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
          <div className="format-filter-actions">
            <button className="primary-button" type="submit">Rank formats</button>
            <Link className="tertiary-button" href={base}>Reset</Link>
          </div>
        </form>
      </section>

      <section className="format-results" aria-labelledby="format-results-title">
        <div className="format-results-heading">
          <div>
            <p className="eyebrow">Recommended order</p>
            <h2 id="format-results-title">{recommendations.length ? `${recommendations.length} formats to consider` : "No format matches these filters"}</h2>
          </div>
          <p>Final publishing support is checked later against the selected connected account.</p>
        </div>

        {recommendations.length ? <div className="format-list">
          {recommendations.map((recommendation, index) => {
            const profile = recommendation.profile;
            const selectedFit = channel ? profile.channelFit.find((item) => item.channel === channel) : undefined;
            return <article className="format-row" key={profile.key}>
              <div className="format-rank" aria-label={`Recommendation ${index + 1}`}>{String(index + 1).padStart(2, "0")}</div>
              <div className="format-copy">
                <div className="format-title-row">
                  <div><h3>{profile.label}</h3><p>{profile.summary}</p></div>
                  <span className="format-effort">{profile.effort} effort</span>
                </div>
                {recommendation.reasons.length ? <ul className="format-reasons" aria-label="Why Kairo ranked this format here">
                  {recommendation.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul> : null}
                {selectedFit ? <p className="format-fit-note"><strong>{selectedFit.strength} fit:</strong> {selectedFit.rationale}</p> : null}
                <div className="format-objectives" aria-label="Common objectives">
                  <span>Best for</span>{profile.objectives.map((item) => <span className="format-tag" key={item}>{objectiveLabel(item)}</span>)}
                </div>
                {profile.creativePlanContract ? <p className="format-contract">Uses Kairo's existing <strong>{profile.creativePlanContract === "carousel-plan" ? "CarouselPlan" : "ReelPlan"}</strong> validation contract.</p> : null}
                <details className="format-details">
                  <summary>Build and review guidance</summary>
                  <div className="format-detail-grid">
                    <Guidance title="Strengths" items={profile.strengths} />
                    <Guidance title="Trade-offs" items={profile.tradeoffs} />
                    <Guidance title="Compose" items={profile.composition} />
                    <Guidance title="Review before approval" items={profile.reviewChecks} />
                  </div>
                </details>
              </div>
            </article>;
          })}
        </div> : <div className="format-empty"><p>Try allowing a higher production effort or clearing one of the filters.</p><Link className="secondary-button" href={base}>Show the full library</Link></div>}
      </section>
    </main>
    <PilotMobileNav brandId={brand.id} active="More" />
  </div>;
}

function Guidance({ title, items }: { title: string; items: readonly string[] }) {
  return <section><h4>{title}</h4><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}

function objectiveLabel(value: FormatObjective) {
  return value === "conversation" ? "conversation" : value;
}

function isPublishFormat(value: string | undefined): value is "text" | "image" | "video" | "carousel" | "reel" {
  return !!value && ["text", "image", "video", "carousel", "reel"].includes(value);
}
