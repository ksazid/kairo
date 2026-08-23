"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { HomeCreationFormat, MyIdeaRecommendation } from "../src/lib/home-intelligence";
import styles from "./home-vs85.module.css";

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

  useEffect(() => {
    setRecommendation(null);
    setFormat("");
    setError("");
    if (!canAnalyse) {
      setState("idle");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState("analysing");
      try {
        const response = await fetch("/api/home/my-idea", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ brandId, text: idea.trim(), source: source.trim() || undefined }),
          signal: controller.signal,
        });
        const body = (await response.json().catch(() => ({}))) as RecommendResponse;
        if (!response.ok || !body.recommendation) throw new Error(body.error ?? "Kairo could not analyse this idea.");
        setRecommendation(body.recommendation);
        setFormat(body.recommendation.format);
        setState("idle");
      } catch (caught) {
        if (controller.signal.aborted) return;
        setRecommendation(null);
        setFormat("");
        setState("idle");
        setError(caught instanceof Error ? caught.message : "Kairo could not analyse this idea.");
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [brandId, idea, source, canAnalyse]);

  async function create() {
    if (!recommendation || !format || state === "creating") return;
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
      <div className={styles.ideaField}>
        <label className={styles.fieldLabel} htmlFor="home-my-idea">Your idea</label>
        <textarea
          id="home-my-idea"
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          placeholder="A topic, thought, offer or rough idea…"
          rows={4}
          maxLength={4000}
        />
      </div>

      {showLink ? (
        <label className={styles.linkField}>
          <span>Public link</span>
          <input
            type="url"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="https://…"
            maxLength={2000}
            inputMode="url"
          />
        </label>
      ) : null}

      <div className={styles.composerTools}>
        <button
          className={styles.toolButton}
          type="button"
          aria-pressed={showLink}
          onClick={() => {
            setShowLink((value) => !value);
            if (showLink) setSource("");
          }}
        >
          <span aria-hidden="true">↗</span>
          {showLink ? "Remove link" : "Add link"}
        </button>
      </div>

      <div className={styles.recommendationSlot} aria-live="polite" aria-atomic="true">
        {state === "analysing" ? (
          <div className={styles.analysing}>
            <span className={styles.analysisDot} aria-hidden="true" />
            Kairo is choosing the strongest format…
          </div>
        ) : recommendation ? (
          <div className={styles.recommendation}>
            <div>
              <span className={styles.recommendationLabel}>Kairo recommends</span>
              <strong>{formatLabels[recommendation.format]}</strong>
              <p>{recommendation.reason}</p>
            </div>
            <label className={styles.formatControl}>
              <span className={styles.srOnly}>Choose format</span>
              <select value={format} onChange={(event) => setFormat(event.target.value as HomeCreationFormat)}>
                {recommendation.choices.map((choice) => (
                  <option key={choice} value={choice}>{formatLabels[choice]}</option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </div>

      {error ? <p className={styles.inlineError} role="alert">{error}</p> : null}

      <button
        className={`${styles.createButton} primary-button`}
        type="button"
        onClick={create}
        disabled={!recommendation || !format || state !== "idle"}
      >
        {state === "creating" ? "Creating…" : recommendation && format ? `Create ${formatLabels[format].toLowerCase()}` : "Add your idea"}
        <span aria-hidden="true">→</span>
      </button>
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
