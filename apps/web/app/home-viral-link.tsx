"use client";

import { useState } from "react";
import { KairoIcon } from "./kairo-icons";
import { homeFormatLabel, type HomeFormatRecommendation } from "../src/lib/home-creation-format";
import styles from "./home-vs85.module.css";

export function HomeViralLink({ brandId }: { brandId: string }) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<HomeFormatRecommendation | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function analyse() {
    setError(""); setResult(null);
    try {
      const response = await fetch("/api/home/my-idea", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ brandId, source: url.trim() }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.recommendation) throw new Error(body.error ?? "Kairo could not analyse that link.");
      setResult(body.recommendation);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Kairo could not analyse that link."); }
    finally { setLoading(false); }
  }
  return <section className={styles.viralSection} aria-labelledby="viral-link-title">
    <div className={styles.viralLead}><KairoIcon name="link" /><div><h2 id="viral-link-title">Have a viral idea?</h2><p>Paste a link and Kairo will adapt it for your Brand.</p></div></div>
    <div className={styles.viralForm}><label className={styles.srOnly} htmlFor="viral-link">Viral content link</label><input id="viral-link" type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="Paste Instagram, YouTube or TikTok link..." inputMode="url" /><button type="button" className={styles.primaryAction} disabled={!url.trim() || loading} onClick={() => { setLoading(true); void analyse(); }}>{loading ? "Analysing…" : "Analyse link"}</button></div>
    {error ? <p className={styles.inlineError} role="alert">{error}</p> : null}
    {result ? <div className={styles.viralResult} role="status"><span className={styles.conceptLabel}><KairoIcon name="sparkles" /> Concept preview · not generated content</span><strong>{homeFormatLabel(result.format)} is the best fit</strong><span>{result.reason}</span></div> : null}
  </section>;
}
