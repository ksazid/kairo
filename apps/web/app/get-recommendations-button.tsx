"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KairoIcon } from "./kairo-icons";
import styles from "./get-recommendations-button.module.css";

type Result = { opportunityCount?: number; degradedSources?: string[]; error?: string };

export function GetRecommendationsButton({ brandId, hasRecommendations }: { brandId: string; hasRecommendations: boolean }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function runHunter() {
    if (running) return;
    setRunning(true);
    setMessage("");
    setError(false);
    try {
      const response = await fetch("/api/home/recommendations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brandId }),
      });
      const body = (await response.json().catch(() => ({}))) as Result;
      if (!response.ok) throw new Error(body.error ?? "Kairo could not refresh recommendations.");
      const count = typeof body.opportunityCount === "number" ? body.opportunityCount : 0;
      const degraded = Array.isArray(body.degradedSources) ? body.degradedSources.filter(Boolean) : [];
      if (degraded.length) {
        setMessage(`${count > 0 ? "Recommendations updated" : "No strong new opportunity"}. Some sources were unavailable: ${degraded.slice(0, 2).join(", ")}${degraded.length > 2 ? "…" : ""}.`);
      } else {
        setMessage(count > 0 ? "Recommendations updated." : "No strong new opportunity right now.");
      }
      router.refresh();
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : "Kairo could not refresh recommendations.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className={styles.action}>
      <button className={styles.button} type="button" onClick={runHunter} disabled={running}>
        <KairoIcon name="sparkles" />
        <span>{running ? "Finding opportunities…" : hasRecommendations ? "Refresh recommendations" : "Get recommendations"}</span>
      </button>
      {message ? <span className={error ? styles.error : styles.status} role={error ? "alert" : "status"}>{message}</span> : null}
    </div>
  );
}
