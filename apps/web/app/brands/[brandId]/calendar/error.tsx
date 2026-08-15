"use client";

export default function CalendarError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="workspace-main calendar-main"><p className="eyebrow">Calendar</p><h1>Calendar is temporarily unavailable.</h1><p className="lede">No approval or publishing state was changed. Retry the read when the API is available.</p><button className="primary-button" type="button" onClick={() => reset()} style={{ marginTop: 24 }}>Retry</button></main>;
}
