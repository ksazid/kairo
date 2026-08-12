"use client";

export default function BrandBrainError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="loading-page">
      <div className="wordmark"><span className="brandmark" aria-hidden="true" />Kairo</div>
      <div className="loading-card" role="alert">
        <p className="eyebrow">Brand Brain</p>
        <h1>We couldn’t load this Brand context.</h1>
        <p className="lede">Nothing was changed. Retry the request, or return to Today and try again later.</p>
        <div className="error-actions">
          <button className="primary-button" type="button" onClick={() => reset()}>Try again</button>
          <a className="secondary-button" href="/">Return to Today</a>
        </div>
      </div>
    </main>
  );
}
