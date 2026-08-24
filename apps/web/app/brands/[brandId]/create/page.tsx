import Link from "next/link";
import { redirect } from "next/navigation";
import { getBrand, getSession } from "../../../../src/lib/kairo-api";
import { getBrandPresenter } from "../../../../src/lib/presenter-api";
import {
  KairoProductShell,
  KairoScopePicker,
} from "../../../kairo-product-shell";
import { startSimpleCreationAction } from "./actions";
type Params = Promise<{ brandId: string }>;
type Search = Promise<{ goal?: string; error?: string }>;
export default async function CreatePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const session = await getSession();
  if (!session) redirect("/");
  const { brandId } = await params,
    q = await searchParams,
    brand = await getBrand(brandId);
  if (!brand) redirect("/");
  const presenter = await getBrandPresenter(brandId)
    .then((value) => value.presenter?.status === "ready" ? value.presenter : null)
    .catch(() => null);
  return (
    <KairoProductShell brandId={brandId} active="Create">
      <main
        id="kairo-main-content"
        tabIndex={-1}
        className="workspace-main simple-create-main"
      >
        <header className="simple-create-hero">
          <div>
            <p className="eyebrow">Create</p>
            <h1>What are you trying to achieve today?</h1>
            <p className="lede">
              Give Kairo one clear goal and any useful starting point. Kairo
              handles research, angles and setup behind the scenes.
            </p>
          </div>
          <KairoScopePicker brandName={brand.name} />
        </header>
        {q.error ? (
          <p className="notice error" role="alert">
            {q.error}
          </p>
        ) : null}
        <form
          className="simple-create-form"
          action={startSimpleCreationAction.bind(null, brandId)}
        >
          <fieldset>
            <legend>Choose a goal</legend>
            <div className="simple-goal-grid">
              {[
                "Promote a product",
                "Educate my audience",
                "Grow engagement",
                "Announce something",
                "Start from an idea",
              ].map((goal) => (
                <label key={goal}>
                  <input
                    type="radio"
                    name="goal"
                    value={goal}
                    defaultChecked={
                      q.goal?.replaceAll("-", " ").toLowerCase() ===
                      goal.toLowerCase()
                    }
                    required
                  />
                  <span>
                    <strong>{goal}</strong>
                    <small>Kairo recommends the strongest direction.</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            What should Kairo work with? <span>optional</span>
            <textarea
              name="input"
              rows={4}
              maxLength={4000}
              placeholder="Describe it, or paste a topic, product URL, Instagram post, website or rough idea…"
            />
          </label>
          <label>
            Source link <span>optional</span>
            <input
              name="source"
              type="url"
              inputMode="url"
              placeholder="https://example.com/reference"
            />
          </label>
          <label>
            Preferred format <span>optional</span>
            <select name="contentPreference" defaultValue="auto">
              <option value="auto">Let Kairo recommend</option>
              <option value="image">Post</option>
              <option value="carousel">Carousel</option>
              <option value="reel">Reel</option>
              <option value="campaign">Campaign</option>
            </select>
            <small>You can review other formats before publishing.</small>
          </label>
          {presenter ? (
            <label>
              Presenter <span>optional</span>
              <select name="presenterId" defaultValue="">
                <option value="">None</option>
                <option value={presenter.id}>{presenter.displayName}</option>
              </select>
              <small>
                None is the default. Selecting {presenter.displayName} records presenter intent for this creation; avatar rendering is enabled only when a governed provider is configured.{" "}
                <Link href={`/brands/${encodeURIComponent(brandId)}/avatar`}>Manage presenter</Link>
              </small>
            </label>
          ) : null}
          <button className="primary-button simple-create-submit" type="submit">
            Recommend what to create
          </button>
          <details className="simple-advanced">
            <summary>Advanced details</summary>
            <p>
              Kairo will create an Idea, research evidence, compare Angles and
              build a Campaign. Claims and sources remain inspectable in the
              full workflow.
            </p>
          </details>
        </form>
      </main>
    </KairoProductShell>
  );
}
