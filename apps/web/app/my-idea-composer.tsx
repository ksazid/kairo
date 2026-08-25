"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HomeCreationFormat, MyIdeaRecommendation } from "../src/lib/home-intelligence";
import { KairoIcon } from "./kairo-icons";
import styles from "./home-vs85.module.css";

type Props = { brandId: string; initialText?: string };
type RecommendResponse = { recommendation?: MyIdeaRecommendation; error?: string };
type CreateResponse = { href?: string; error?: string };
const formatLabels: Record<HomeCreationFormat, string> = { carousel: "Carousel", reel: "Reel", image: "Post" };

export function MyIdeaComposer({ brandId, initialText = "" }: Props) {
  const router = useRouter();
  const [idea, setIdea] = useState(initialText);
  const [source, setSource] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [recommendation, setRecommendation] = useState<MyIdeaRecommendation | null>(null);
  const [format, setFormat] = useState<HomeCreationFormat | "">("");
  const [state, setState] = useState<"idle" | "recommending" | "creating">("idle");
  const [error, setError] = useState("");
  const canRecommend = idea.trim().length >= 4 || isHttpUrl(source.trim());

  function invalidateRecommendation() { setRecommendation(null); setFormat(""); setError(""); }

  async function recommend() {
    if (!canRecommend || state !== "idle") return;
    setState("recommending"); setError("");
    try {
      const response = await fetch("/api/home/my-idea", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ brandId, text: idea.trim(), source: source.trim() || undefined }) });
      const body = (await response.json().catch(() => ({}))) as RecommendResponse;
      if (!response.ok || !body.recommendation) throw new Error(body.error ?? "Kairo could not recommend a format.");
      setRecommendation(body.recommendation); setFormat(body.recommendation.format); setState("idle");
    } catch (caught) {
      setRecommendation(null); setFormat(""); setState("idle"); setError(caught instanceof Error ? caught.message : "Kairo could not recommend a format.");
    }
  }

  async function create() {
    if (!recommendation || !format || state !== "idle") return;
    setState("creating"); setError("");
    try {
      const response = await fetch("/api/home/my-idea", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ brandId, text: idea.trim(), source: source.trim() || undefined, format }) });
      const body = (await response.json().catch(() => ({}))) as CreateResponse;
      if (!response.ok || !body.href) throw new Error(body.error ?? "Kairo could not start this creation.");
      router.push(body.href);
    } catch (caught) {
      setState("idle"); setError(caught instanceof Error ? caught.message : "Kairo could not start this creation.");
    }
  }

  return (
    <div className={styles.ideaComposerWrap}>
      <div className={styles.ideaComposer}>
        <textarea
          id="home-my-idea"
          aria-label="Your idea"
          value={idea}
          onChange={(event) => { setIdea(event.target.value); invalidateRecommendation(); }}
          placeholder="What do you want to create?"
          rows={2}
          maxLength={4000}
        />
        {showUrl ? (
          <input
            className={styles.urlField}
            aria-label="Idea source URL"
            type="url"
            value={source}
            onChange={(event) => { setSource(event.target.value); invalidateRecommendation(); }}
            placeholder="https://…"
            maxLength={2000}
            inputMode="url"
          />
        ) : null}
        <div className={styles.composerTools} aria-label="Idea sources">
          <button className={styles.toolButton} data-tone="url" type="button" aria-pressed={showUrl} onClick={() => { setShowUrl((value) => !value); if (showUrl) setSource(""); invalidateRecommendation(); }}><KairoIcon name="link" /><span>URL</span></button>
          <button className={styles.toolButton} data-tone="photo" type="button" disabled title="Photo attachments are not connected yet"><KairoIcon name="image" /><span>Photo</span></button>
          <button className={styles.toolButton} data-tone="video" type="button" disabled title="Video attachments are not connected yet"><KairoIcon name="video" /><span>Video</span></button>
          <button className={styles.toolButton} data-tone="media" type="button" disabled title="Existing media selection is not connected yet"><KairoIcon name="plus" /><span>Media</span></button>
        </div>
      </div>

      <button className={styles.recommendButton} type="button" onClick={recommend} disabled={!canRecommend || state !== "idle"}>
        <KairoIcon name="sparkles" />
        <span>{state === "recommending" ? "Recommending format…" : recommendation ? "Update format" : "Recommend format"}</span>
      </button>

      <p className={styles.recommendationHint}><KairoIcon name="shield" /><span>Kairo recommends the format before it creates anything.</span></p>

      <div className={styles.recommendationSlot} aria-live="polite" aria-atomic="true">
        {recommendation ? (
          <div className={styles.recommendationResult}>
            <div><span>Kairo recommends</span><strong>{formatLabels[recommendation.format]}</strong><p>{recommendation.reason}</p></div>
            <label><span>Format</span><select value={format} onChange={(event) => setFormat(event.target.value as HomeCreationFormat)}>{recommendation.choices.map((choice) => <option key={choice} value={choice}>{formatLabels[choice]}</option>)}</select></label>
            <button type="button" onClick={create} disabled={!format || state !== "idle"}>{state === "creating" ? "Creating…" : format ? `Create ${formatLabels[format].toLowerCase()}` : "Create"}</button>
          </div>
        ) : null}
      </div>
      {error ? <p className={styles.inlineError} role="alert">{error}</p> : null}
    </div>
  );
}

function isHttpUrl(value: string) {
  try { const parsed = new URL(value); return parsed.protocol === "http:" || parsed.protocol === "https:"; }
  catch { return false; }
}
