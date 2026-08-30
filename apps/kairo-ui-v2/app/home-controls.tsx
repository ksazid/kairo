"use client";

import { BarChart3, ExternalLink, FileImage, LayoutGrid, Link2, Megaphone, PlaySquare, Sparkles } from "lucide-react";
import { useState } from "react";

const formats = [
  { label: "Post", value: "Post", Icon: FileImage },
  { label: "Reel", value: "Reel", Icon: PlaySquare },
  { label: "Carousel", value: "Carousel", Icon: LayoutGrid },
  { label: "Campaign", value: "Campaign", Icon: Megaphone },
] as const;

export function HeroControls({ brandId }: { brandId?: string }) {
  const [format, setFormat] = useState("Reel");
  const [url, setUrl] = useState("");
  const oldUi = process.env.NEXT_PUBLIC_KAIRO_WEB_URL ?? "https://kairo-two-plum.vercel.app";
  return <>
    <div className="format-tabs" aria-label="Content format">
      {formats.map(({ label, value, Icon }) => <button key={value} data-active={format === value} onClick={() => setFormat(value)}><Icon aria-hidden="true"/>{label}</button>)}
    </div>
    <section className="viral-strip">
      <div className="viral-copy"><Link2 aria-hidden="true"/><span><strong>Have a viral idea?</strong><small>Paste a link and Kairo will adapt it for your Brand.</small></span></div>
      <div className="viral-input"><input aria-label="Viral content URL" type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="Paste Instagram, YouTube or TikTok link..."/><a aria-disabled={!url.trim()} href={url.trim() ? `${oldUi}/?brand=${encodeURIComponent(brandId ?? "")}&idea=${encodeURIComponent(url.trim())}` : "#"}>Analyse link<ExternalLink aria-hidden="true"/></a></div>
    </section>
  </>;
}

export function CreateButton({ brandId, format = "reel" }: { brandId?: string; format?: string }) {
  const oldUi = process.env.NEXT_PUBLIC_KAIRO_WEB_URL ?? "https://kairo-two-plum.vercel.app";
  const href = brandId ? `${oldUi}/?brand=${encodeURIComponent(brandId)}&format=${encodeURIComponent(format)}` : oldUi;
  return <a className="create-button" href={href}><Sparkles aria-hidden="true"/>Create with Kairo</a>;
}

export function RecommendationFormatIcon() {
  return <PlaySquare aria-hidden="true"/>;
}

export function TrendIcon() {
  return <BarChart3 aria-hidden="true"/>;
}
