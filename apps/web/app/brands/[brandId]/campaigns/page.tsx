import Link from "next/link";
import { getBrand, getCampaignDetail, getCampaigns, getIdeas } from "../../../../src/lib/kairo-api";
import { KairoProductShell, KairoScopePicker } from "../../../kairo-product-shell";
import { KairoIcon } from "../../../kairo-icons";
import { createCampaignAction } from "./actions";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ error?: string }>;

export default async function CampaignsPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { brandId } = await params;
  const [brand, campaigns, ideas, messages] = await Promise.all([
    getBrand(brandId),
    getCampaigns(brandId),
    getIdeas(brandId),
    searchParams,
  ]);

  if (!brand) {
    return <main className="auth-page"><section className="auth-card"><h1>Brand not found.</h1><Link className="primary-button" href="/">Return to Today</Link></section></main>;
  }

  const eligibleIdeas = ideas.filter((idea) => idea.status === "angles-ready");
  const details = await Promise.all(campaigns.map((campaign) => getCampaignDetail(brand.id, campaign.id).catch(() => null)));
  const create = createCampaignAction.bind(null, brand.id);
  const base = `/brands/${encodeURIComponent(brand.id)}`;

  return (
    <KairoProductShell brandId={brand.id} active="Campaigns">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main campaigns-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Campaigns</p>
            <h1>Develop one strong direction across the right channels.</h1>
            <p className="lede">Campaigns keep Idea, Research and selected Angle lineage intact while Content Studio handles execution.</p>
          </div>
          <KairoScopePicker brandName={brand.name} meta="Campaign lineage · human controlled" />
        </header>

        {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

        <section className="campaign-list" aria-labelledby="campaign-list-title">
          <div className="section-heading campaign-section-heading">
            <div>
              <p className="eyebrow">Current work</p>
              <h2 id="campaign-list-title">{campaigns.length ? `${campaigns.length} ${campaigns.length === 1 ? "Campaign" : "Campaigns"}` : "No Campaigns yet"}</h2>
              <p>Open a Campaign to edit channel content, review evidence and approve the exact version that may proceed.</p>
            </div>
            <Link className="secondary-button" href={`${base}/content-assets`}>Content Assets</Link>
            <details className="campaign-create-disclosure">
              <summary className="secondary-button">New Campaign</summary>
              <div className="campaign-create-panel">
                <p className="eyebrow">Start from a selected Angle</p>
                {eligibleIdeas.length ? (
                  <form className="campaign-create-form" action={create}>
                    <label>
                      Idea
                      <select name="ideaId" required>
                        {eligibleIdeas.map((idea) => <option value={idea.id} key={idea.id}>{idea.title}</option>)}
                      </select>
                    </label>
                    <label>Campaign name<input name="name" maxLength={300} required /></label>
                    <label>Objective<textarea name="objective" maxLength={1000} required rows={3} /></label>
                    <button className="primary-button" type="submit">Create Campaign</button>
                  </form>
                ) : (
                  <div className="campaign-create-empty">
                    <strong>No selected Angle is ready yet.</strong>
                    <p>Choose an Angle from an Idea before creating a Campaign.</p>
                    <Link href={`${base}/ideas`}>Review Ideas</Link>
                  </div>
                )}
              </div>
            </details>
          </div>

          {campaigns.length ? campaigns.map((campaign, index) => {
            const detail = details[index];
            const assets = detail?.assets ?? [];
            const ready = assets.filter(({ asset }) => asset.status !== "draft").length;
            const formats = [...new Set(assets.map(({ asset }) => asset.format.toLowerCase()))];
            return (
            <Link
              className="campaign-row"
              href={`${base}/campaigns/${encodeURIComponent(campaign.id)}`}
              key={campaign.id}
            >
              <div className="campaign-row-main">
                <span className="idea-source">Campaign</span>
                <h3>{campaign.name}</h3>
                <p>{campaign.objective}</p>
                <div className="campaign-format-list" aria-label="Campaign formats">
                  {formats.map((format) => <span key={format}><KairoIcon name={format.includes("video") || format.includes("reel") ? "video" : format.includes("carousel") ? "grid" : "image"} />{formatLabel(format)}</span>)}
                </div>
              </div>
              <div className="campaign-progress"><strong>{ready} / {assets.length || 0}</strong><span>assets ready</span></div>
              <span className="campaign-date">{new Date(campaign.createdAt).toLocaleDateString()}</span>
              <span className="secondary-button campaign-open"><KairoIcon name="eye" />Open campaign</span>
            </Link>
          );}) : (
            <div className="ideas-empty">
              <h3>Turn a selected Angle into the first Campaign.</h3>
              <p>Kairo keeps the content lineage intact from Idea and Research through Campaign and channel execution.</p>
            </div>
          )}
        </section>
      </main>
    </KairoProductShell>
  );
}

function formatLabel(format: string) {
  if (format.includes("carousel")) return "Carousel";
  if (format.includes("reel")) return "Reel";
  if (format.includes("video")) return "Video";
  return "Post";
}
