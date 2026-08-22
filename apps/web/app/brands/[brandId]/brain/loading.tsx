import { SkeletonGroup } from "../../../ui-states";

export default function LoadingBrandBrain() {
  return (
    <main className="loading-page" aria-busy="true" aria-live="polite">
      <div className="wordmark"><span className="brandmark" aria-hidden="true" />Kairo</div>
      <div className="loading-card">
        <p className="eyebrow">Brand Brain</p>
        <h1>Loading trusted Brand context…</h1>
        <p className="lede">Checking Brand scope, confirmed facts and private Knowledge sources.</p>
        <SkeletonGroup rows={4} label="Loading Brand Brain" />
      </div>
    </main>
  );
}
