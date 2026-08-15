"use client";

export default function OperationsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="workspace-main operations-main"><p className="eyebrow">Pilot Operations</p><h1>Operational diagnostics are temporarily unavailable.</h1><p className="lede">No automation, retry or Brand state was changed. Retry the read when the API is available.</p><button className="primary-button" type="button" onClick={() => reset()} style={{ marginTop: 24 }}>Retry</button></main>;
}
