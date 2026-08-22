import Link from "next/link";
import { getBrand, getIdeas } from "../../../../src/lib/kairo-api";
import { KairoProductShell, KairoScopePicker } from "../../../kairo-product-shell";
import { createIdeaAction } from "./actions";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;

export default async function IdeasPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { brandId } = await params;
  const [brand, ideas, messages] = await Promise.all([getBrand(brandId), getIdeas(brandId), searchParams]);
  if (!brand) return <main className="auth-page"><section className="auth-card"><h1>Brand not found.</h1><Link className="primary-button" href="/">Return to Today</Link></section></main>;

  const base = `/brands/${encodeURIComponent(brand.id)}`;
  const create = createIdeaAction.bind(null, brand.id);

  return (
    <KairoProductShell brandId={brand.id} active="Ideas">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main ideas-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Ideas</p>
            <h1>Turn a worthwhile thought into a strong direction.</h1>
            <p className="lede">Keep the thought, evidence and uncertainty intact before choosing a strategic Angle.</p>
          </div>
          <KairoScopePicker brandName={brand.name} meta="Private research context" />
        </header>

        {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
        {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

        <details className="idea-capture-disclosure">
          <summary>
            <span>
              <strong>Capture a new Idea</strong>
              <small>Start from your own insight. Research and multiple Angles come next.</small>
            </span>
            <span className="context-summary-action">New Idea</span>
          </summary>
          <div className="idea-capture-body">
            <form className="new-idea-form" action={create}>
              <label>
                Idea title
                <input name="title" required maxLength={300} placeholder="What should this Brand explore?" />
              </label>
              <label>
                Premise
                <textarea name="premise" required maxLength={2000} rows={5} placeholder="Why might this matter to the audience?" />
              </label>
              <div className="idea-capture-footer">
                <p>This creates an Idea only. It does not generate final content.</p>
                <button className="primary-button" type="submit">Create Idea</button>
              </div>
            </form>
          </div>
        </details>

        <section className="ideas-list ideas-worklist" aria-labelledby="idea-list-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Current work</p>
              <h2 id="idea-list-title">{ideas.length ? `${ideas.length} ${ideas.length === 1 ? "Idea" : "Ideas"}` : "No Ideas yet"}</h2>
              <p>Open an Idea to inspect its Research dossier and choose or refine an Angle.</p>
            </div>
          </div>

          {ideas.length ? ideas.map((idea) => (
            <Link className="idea-row" href={`${base}/ideas/${encodeURIComponent(idea.id)}`} key={idea.id}>
              <div className="idea-row-content">
                <span className="idea-source">{idea.source.type === "opportunity" ? "From Discover" : "Your Idea"}</span>
                <h3>{idea.title}</h3>
                <p>{idea.premise}</p>
              </div>
              <span className="idea-row-tail">
                <span className={`idea-status ${idea.status}`}>{statusLabel(idea.status)}</span>
                <span className="idea-open-cue" aria-hidden="true">→</span>
              </span>
            </Link>
          )) : (
            <div className="ideas-empty">
              <h3>Capture the first useful thought.</h3>
              <p>Create an Idea here, or develop a strong Opportunity from Discover. Kairo will not fabricate research to make the list look busy.</p>
            </div>
          )}
        </section>
      </main>
    </KairoProductShell>
  );
}

function statusLabel(status: string) {
  return ({
    new: "Ready to research",
    researching: "Researching",
    "research-ready": "Research ready",
    "angles-ready": "Angles ready",
  } as Record<string, string>)[status] ?? status;
}
