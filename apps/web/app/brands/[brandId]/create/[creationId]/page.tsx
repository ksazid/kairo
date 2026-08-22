import Link from "next/link";
import { redirect } from "next/navigation";
import { getBrand } from "../../../../../src/lib/kairo-api";
import { getSimpleCreation } from "../../../../../src/lib/simple-creation-api";
import { KairoProductShell } from "../../../../kairo-product-shell";
import { AutoRefresh } from "./auto-refresh";
type Params = Promise<{ brandId: string; creationId: string }>;
export default async function CreationProgress({ params }: { params: Params }) {
  const { brandId, creationId } = await params,
    [brand, creation] = await Promise.all([
      getBrand(brandId),
      getSimpleCreation(brandId, creationId),
    ]);
  if (!brand) redirect("/");
  const pending = !["ready", "needs-attention"].includes(creation.status),
    r = creation.recommendation;
  return (
    <KairoProductShell brandId={brandId} active="Create">
      <main
        id="kairo-main-content"
        tabIndex={-1}
        className="workspace-main simple-create-main"
      >
        {pending ? <AutoRefresh /> : null}
        <section
          className="creation-progress"
          aria-live="polite"
          aria-busy={pending}
        >
          <p className="eyebrow">{pending ? "Creating" : "Recommendation"}</p>
          <h1>{creation.progress.message}</h1>
          {pending ? (
            <>
              <div className="progress-track">
                <span data-stage={creation.status} />
              </div>
              <p>
                Kairo is working through the useful detail. You can safely leave
                and return.
              </p>
            </>
          ) : creation.status === "needs-attention" ? (
            <>
              <p>
                Kairo kept your work but needs another try. No content was
                approved or published.
              </p>
              <Link
                className="primary-button"
                href={`/brands/${encodeURIComponent(brandId)}/create`}
              >
                Try a new creation
              </Link>
            </>
          ) : (
            <div className="creation-recommendation">
              <span>
                {r?.channel} · {r?.format}
              </span>
              <h2>{r?.title ?? "Recommended direction"}</h2>
              <p>{r?.framing}</p>
              <strong>
                Why this:{" "}
                {r?.reason ?? "Best fit for the goal and available evidence."}
              </strong>
              {r?.alternatives?.length ? (
                <div className="creation-alternatives">
                  <h3>Other strong directions</h3>
                  {r.alternatives.map((alternative) => (
                    <article key={`${alternative.title}-${alternative.format}`}>
                      <span>{alternative.channel} · {alternative.format}</span>
                      <strong>{alternative.title}</strong>
                      <p>{alternative.framing}</p>
                    </article>
                  ))}
                </div>
              ) : null}
              <div className="creation-actions">
                <Link
                  className="primary-button"
                  href={`/brands/${encodeURIComponent(brandId)}/campaigns/${encodeURIComponent(creation.campaignId!)}`}
                >
                  Develop this recommendation
                </Link>
                <Link
                  className="secondary-button"
                  href={`/brands/${encodeURIComponent(brandId)}/create`}
                >
                  Try another goal or format
                </Link>
              </div>
              <details>
                <summary>Advanced details</summary>
                <p>
                  {r?.supportingClaimIds?.length ?? 0} supporting Claims are
                  preserved. Open the Campaign and linked Idea to inspect
                  research, evidence and alternative Angles.
                </p>
              </details>
            </div>
          )}
        </section>
      </main>
    </KairoProductShell>
  );
}
