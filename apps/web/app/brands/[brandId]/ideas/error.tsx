"use client";

export default function IdeasError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="loading-page"><div className="loading-card"><p className="eyebrow">Ideas</p><h1>Ideas are temporarily unavailable.</h1><p className="lede">Your Research and Angle selections have not been changed. Retry when the API is available.</p><div className="error-actions"><button className="primary-button" type="button" onClick={() => reset()}>Retry</button><a className="secondary-button" href="/">Return to Today</a></div></div></main>;
}
