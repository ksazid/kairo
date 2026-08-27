"use client";

import { useEffect, useState } from "react";
import { KairoIcon } from "./kairo-icons";
import type { HomeForYouItem } from "../src/lib/home-intelligence";
import styles from "./for-you-batch-action.module.css";

type Props = { brandId: string; items: HomeForYouItem[] };

export function ForYouBatchAction({ brandId, items }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const onSelection = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; selected: boolean }>).detail;
      setSelected((current) => detail.selected
        ? current.includes(detail.id) || current.length >= 5 ? current : [...current, detail.id]
        : current.filter((value) => value !== detail.id));
    };
    window.addEventListener("kairo:for-you-selection", onSelection);
    return () => window.removeEventListener("kairo:for-you-selection", onSelection);
  }, []);

  async function generate() {
    if (!selected.length || running) return;
    setRunning(true); setMessage("");
    try {
      const response = await fetch("/api/home/my-idea/batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brandId, items: selected.map((id) => {
          const item = items.find((candidate) => candidate.id === id);
          return item ? { opportunityId: item.id, format: formatFor(item) } : null;
        }).filter(Boolean) }),
      });
      const body = (await response.json().catch(() => ({}))) as { startedCount?: number; failedCount?: number; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Kairo could not start the selected ideas.");
      const started = body.startedCount ?? 0;
      const failed = body.failedCount ?? 0;
      setMessage(`${started} of ${selected.length} drafts queued${failed ? `, ${failed} needs attention` : ""}. Check Content for progress.`);
      window.dispatchEvent(new CustomEvent("kairo:for-you-selection-cleared"));
      setSelected([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kairo could not start the selected ideas.");
    } finally {
      setRunning(false);
    }
  }

  return <div className={styles.batch}>
    <div className={styles.controls}><button type="button" disabled={!selected.length || running} onClick={generate}><KairoIcon name="sparkles" />{running ? "Generating selected…" : `AI Generate selected${selected.length ? ` (${selected.length})` : ""}`}</button></div>
    {message ? <p className={styles.status} role="status">{message}</p> : null}
  </div>;
}

function formatFor(item: HomeForYouItem) {
  return item.format === "reel" ? "reel" : item.format === "carousel" ? "carousel" : "image";
}
