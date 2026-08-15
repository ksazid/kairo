"use client";

export default function PerformanceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="workspace-main performance-main"><p className="eyebrow">Performance Intelligence</p><h1>Performance evidence is temporarily unavailable.</h1><p className="lede">Kairo has not changed Brand Learning or channel connection state. Retry the read when the API is available.</p><button className="primary-button" type="button" onClick={() => reset()} style={{ marginTop: 24 }}>Retry</button></main>;
}
