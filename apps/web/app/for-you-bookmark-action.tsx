"use client";

import { useState } from "react";
import { KairoIcon } from "./kairo-icons";
import { saveOpportunityAction } from "./opportunity-actions";
import styles from "./home-approved.module.css";

export function ForYouBookmarkAction({ brandId, opportunityId, saved }: { brandId: string; opportunityId: string; saved: boolean }) {
  const [isSaved, setIsSaved] = useState(saved);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (busy || isSaved) return;
    setBusy(true);
    try {
      const result = await saveOpportunityAction(brandId, opportunityId);
      setIsSaved(result.status === "saved");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className={styles.bookmarkButton}
      type="button"
      disabled={busy || isSaved}
      aria-label={`${isSaved ? "Saved recommendation" : "Save recommendation"}`}
      aria-pressed={isSaved}
      onClick={save}
    >
      <KairoIcon name="bookmark" />
    </button>
  );
}
