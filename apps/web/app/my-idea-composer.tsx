"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HomeCreationFormat, MyIdeaRecommendation } from "../src/lib/home-intelligence";
import { KairoIcon } from "./kairo-icons";
import styles from "./home-frozen.module.css";

type Props = {
  brandId: string;
  initialText?: string;
};

type RecommendResponse = { recommendation?: MyIdeaRecommendation; error?: string };
type CreateResponse = { href?: string; error?: string };

const formatLabels: Record<HomeCreationFormat, string> = {
  carousel: "Carousel",
  reel: "Reel",
  image: "Post",
};

export function MyIdeaComposer({ brandId, initialText = "" }: Props) {
  const router = useRouter();
  const [idea, setIdea] = useState(initialText);
  const [source, setSource] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [recommendation, setRecommendation] = useState<MyIdeaRecommendation | null>(null);
  const [format, setFormat] = useState<HomeCreationFormat | "">("");
  const [state, setState] = useState<"idle" | "analysing" | "creating">("idle");
  const [error, setError] = useState("");
  const canAnalyse = idea.trim().length >= 4 || isHttpUrl(source.trim());

  function resetRecommendation() {
    setRecommendation(null);
    setFormat("");
    setError("");
  }

  async function analyse() {
    if (!canAnalyse || state !== "idle") return;
    setState("analysing");
    setError("");
    try {
      const response = await fetch("/api/home/my-idea", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brandId, text: idea.trim(), source: source.trim() || undefined }),
      });
      const body = (await response.json().catch(() => ({}))) as RecommendResponse;
      if (!response.ok || !body.recommendation) throw new Error(body.error ?? "Kairo could not analyse this idea.");
      setRecommendation(body.recommendation);
      setFormat(body.recommendation.format);
    } catch (caught) {
      setRecommendation(null);
      setFormat("");
      setError(caught instanceof Error ? caught.message : "Kairo could not analyse this idea.");
    } finally {
      setState("idle");
    }
  }

  async function create() {
    if (!recommendation || !format || state !== "idle") return;
    setState("creating");
    setError("");
    try {
      const response = await fetch("/api/home/my-idea", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brandId, text: idea.trim(), source: source.trim() || undefined, format }),
      });
      const body = (await response.json().catch(() => ({}))) as CreateResponse;
      if (!response.ok || !body.href) throw new Error(body.error ?? "Kairo could not start this creation.");
      router.push(body.href);
    } catch (caught) {
      setState("idle");
      setError(caught instanceof Error ? caught.message : "Kairo could not start this creation.");
    }
  }

  return (
    <div className={styles.ideaComposer}>
      <label className={styles.ideaField} htmlFor="home-my-idea">
        <span className={styles.fieldLabel}>Your idea</span>
        <textarea
          id="home-my-idea"
          value={idea}
          onChange={(event) => {
            setIdea(event.target.value);
            resetRecommendation();
          }}
          placeholder="A topic, thought, offer or rough idea…"
          rows={5}
          maxLength={4000}
        />
      </label>

      {showLink ? (
        <label className={styles.linkField}>
          <span>URL</span>
          <input
            type="url"
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              resetRecommendation();
            }}
            placeholder="https://…"
            maxLength={2000}
            inputMode="url"
          />
        </label>
      ) : null}

      <div className={styles.composerFooter}>
        <div className={styles.composerTools} aria-label="Idea inputs">
          <button
            className={styles.toolButton}
            type="button"
            aria-pressed={showLink}
            onClick={() => {
              setShowLink((value) => !value);
              if (showLink) setSource("");
              resetRecommendation();
            }}
          >
            <KairoIcon name="link" />
            <span>URL</span>
          </button>
          <button className={styles.toolButton} type="button" disabled title="Photo attachment is not configured yet">
            <KairoIcon name="photo" />
            <span>Photo</span>
          </button>
          <button className={styles.toolButton} type="button" disabled title="Video attachment is not configured yet">
            <KairoIcon name="video" />
            <span>Video</span>
          </button>
          <button className={styles.toolButton} type="button" disabled title="Media library attachment is not configured yet">
            <KairoIcon name="attachment" />
            <span>+ Media</span>
          </button>
        </div>

        <button
          className={`${styles.recommendButton} primary-button`}
          type="button"
          onClick={analyse}
          disabled={!canAnalyse || state !== "idle"}
        >
          {state === "analysing" ? "Finding the best format…" : "Get recommendations"}
        </button>
      </div>

      <div className={styles.recommendationSlot} aria-live="polite" aria-atomic="true">
        {recommendation ? (
          <div className={styles.recommendation}>
            <div className={styles.recommendationCopy}>
              <span className={styles.recommendationLabel}>Kairo recommends</span>
              <strong>{formatLabels[recommendation.format]}</strong>
              <p>{recommendation.reason}</p>
            </div>
            <div className={styles.recommendationActions}>
              <label className={styles.formatControl}>
                <span>Format</span>
                <select value={format} onChange={(event) => setFormat(event.target.value as HomeCreationFormat)}>
                  {recommendation.choices.map((choice) => (
                    <option key={choice} value={choice}>{formatLabels[choice]}</option>
                  ))}
                </select>
              </label>
              <button className="primary-button" type="button" onClick={create} disabled={!format || state !== "idle"}>
                {state === "creating" ? "Creating…" : `Create ${format ? formatLabels[format] : "content"}`}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className={styles.inlineError} role="alert">{error}</p> : null}
    </div>
  );
}

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
