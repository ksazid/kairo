"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { homeFormatLabel, type HomeCreationFormat } from "../src/lib/home-creation-format";
import { KairoIcon } from "./kairo-icons";
import { prepareOpportunityDevelopmentAction } from "./opportunity-actions";
import styles from "./for-you-create-action.module.css";

type EligiblePresenter = { id: string; displayName: string; mode: string };
type Props = {
  brandId: string;
  opportunityId: string;
  title: string;
  direction: string;
  initialFormat: HomeCreationFormat;
  eligiblePresenter?: EligiblePresenter;
  allowFormatChange?: boolean;
};
type StartResponse = { creationId?: string; error?: string };
type ProgressResponse = { status?: string; message?: string; campaignId?: string; assetId?: string; error?: string };
const FORMATS: HomeCreationFormat[] = ["image", "carousel", "reel", "video"];

export function ForYouCreateAction({ brandId, opportunityId, title, direction, initialFormat, eligiblePresenter, allowFormatChange = false }: Props) {
  const router = useRouter();
  const [format, setFormat] = useState<HomeCreationFormat>(initialFormat);
  const [presenterId, setPresenterId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const showPresenter = Boolean(eligiblePresenter) && (format === "reel" || format === "video");

  async function generate() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const development = await prepareOpportunityDevelopmentAction(brandId, opportunityId);
      const response = await fetch("/api/home/my-idea", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          brandId,
          ideaId: development.ideaId,
          text: [title, direction].filter(Boolean).join("\n\n"),
          format,
          presenterId: showPresenter && presenterId ? presenterId : undefined,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as StartResponse;
      if (!response.ok || !body.creationId) throw new Error(body.error ?? "Kairo could not start this creation.");
      await waitForCreation(body.creationId);
    } catch (caught) {
      setBusy(false);
      setError(caught instanceof Error ? caught.message : "Kairo could not generate this content.");
    }
  }

  async function waitForCreation(creationId: string) {
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      await delay(1100);
      const response = await fetch(`/api/home/my-idea?brandId=${encodeURIComponent(brandId)}&creationId=${encodeURIComponent(creationId)}`, { cache: "no-store" });
      const body = (await response.json().catch(() => ({}))) as ProgressResponse;
      if (!response.ok) throw new Error(body.error ?? "Kairo could not read this creation.");
      if (body.status === "ready" && body.campaignId && body.assetId) {
        router.push(`/brands/${encodeURIComponent(brandId)}/content/${encodeURIComponent(body.campaignId)}/${encodeURIComponent(body.assetId)}`);
        return;
      }
      if (body.status === "needs-attention") throw new Error(body.message ?? "Kairo could not finish this creation.");
    }
    throw new Error("Generation is still running. Check Content shortly.");
  }

  return (
    <div className={styles.actionPanel}>
      {allowFormatChange ? <div className={styles.formatRow} role="group" aria-label="Content format">
        {FORMATS.map((item) => (
          <button key={item} type="button" data-selected={format === item} aria-pressed={format === item} onClick={() => { setFormat(item); if (item !== "reel" && item !== "video") setPresenterId(""); }}>
            {homeFormatLabel(item)}
          </button>
        ))}
      </div> : <p className={styles.formatHint}>Recommended format: {homeFormatLabel(format)}. You can change this before generating.</p>}
      {showPresenter && eligiblePresenter ? (
        <label className={styles.presenter}>
          <span>Presenter</span>
          <select value={presenterId} onChange={(event) => setPresenterId(event.target.value)}>
            <option value="">None</option>
            <option value={eligiblePresenter.id}>{eligiblePresenter.displayName}</option>
          </select>
        </label>
      ) : null}
      <button type="button" className={styles.generate} disabled={busy} onClick={generate}>
        <KairoIcon name="sparkles" />
        <span>{busy ? "Generating…" : "AI Generate"}</span>
      </button>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </div>
  );
}

function delay(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }
