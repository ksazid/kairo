"use client";

export default function DiscoverError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="workspace-main discovery-main"><p className="eyebrow">Discover</p><h1>Discover is temporarily unavailable.</h1><p className="lede">Your Brand data has not been changed. Retry the read when the API is available.</p><button className="primary-button" type="button" onClick={() => reset()} style={{ marginTop: 24 }}>Retry</button></main>;
}
