"use client";

import { useEffect, useState } from "react";
import { KairoIcon } from "./kairo-icons";
import { prepareOpportunityDevelopmentAction } from "./opportunity-actions";
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
    let completed = 0;
    for (const id of selected) {
      const item = items.find((candidate) => candidate.id === id);
      if (!item) continue;
      try {
        const development = await prepareOpportunityDevelopmentAction(brandId, id);
        const response = await fetch("/api/home/my-idea", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ brandId, ideaId: development.ideaId, text: [item.title, item.direction].filter(Boolean).join("\n\n") }) });
        if (response.ok) completed += 1;
      } catch { /* preserve per-item progress and continue the queue */ }
    }
    setRunning(false); setMessage(`${completed} of ${selected.length} drafts started. Check Content for progress.`);
  }

  return <div className={styles.batch}>
    <div className={styles.toolbar}>
      <span>{selected.length ? `${selected.length} selected` : "Select ideas to generate together"}</span>
      <div className={styles.controls}><button type="button" disabled={!selected.length || running} onClick={generate}><KairoIcon name="sparkles" />{running ? "Starting…" : "Generate selected"}</button></div>
    </div>
    {message ? <p className={styles.status} role="status">{message}</p> : null}
  </div>;
}
