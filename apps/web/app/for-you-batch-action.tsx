"use client";

import { useState } from "react";
import { KairoIcon } from "./kairo-icons";
import { prepareOpportunityDevelopmentAction } from "./opportunity-actions";
import type { HomeForYouItem } from "../src/lib/home-intelligence";
import type { HomeCreationFormat } from "../src/lib/home-creation-format";
import styles from "./for-you-batch-action.module.css";

type Props = { brandId: string; items: HomeForYouItem[] };

export function ForYouBatchAction({ brandId, items }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [format, setFormat] = useState<HomeCreationFormat>("image");
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : current.length < 5 ? [...current, id] : current);
  }

  async function generate() {
    if (!selected.length || running) return;
    setRunning(true); setMessage("");
    let completed = 0;
    for (const id of selected) {
      const item = items.find((candidate) => candidate.id === id);
      if (!item) continue;
      try {
        const development = await prepareOpportunityDevelopmentAction(brandId, id);
        const response = await fetch("/api/home/my-idea", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ brandId, ideaId: development.ideaId, text: [item.title, item.direction].filter(Boolean).join("\n\n"), format }) });
        if (response.ok) completed += 1;
      } catch { /* preserve per-item progress and continue the queue */ }
    }
    setRunning(false); setMessage(`${completed} of ${selected.length} drafts started. Check Content for progress.`);
  }

  return <div className={styles.batch}>
    <div className={styles.toolbar}>
      <span>{selected.length ? `${selected.length} selected` : "Select ideas to generate together"}</span>
      <div className={styles.controls}>
        <label>Format <select value={format} onChange={(event) => setFormat(event.target.value as HomeCreationFormat)}><option value="image">Post</option><option value="carousel">Carousel</option><option value="reel">Reel</option><option value="video">Video</option></select></label>
        <button type="button" disabled={!selected.length || running} onClick={generate}><KairoIcon name="sparkles" />{running ? "Starting…" : "Generate selected"}</button>
      </div>
    </div>
    {message ? <p className={styles.status} role="status">{message}</p> : null}
    <div className={styles.selectionGrid}>{items.map((item) => <label key={item.id} className={styles.item}><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} /><span>{item.title}</span><small>{item.reason}</small></label>)}</div>
  </div>;
}
