"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bookmark,
  Check,
  Eye,
  Facebook,
  FileImage,
  Instagram,
  LayoutGrid,
  Linkedin,
  PlaySquare,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Youtube,
} from "lucide-react";
import {
  discoverPreviewHref,
  filterDiscoverCards,
  type DiscoverCard,
  type DiscoverFilter,
} from "../../lib/discover";

const filters: Array<{ value: DiscoverFilter; label: string }> = [
  { value: "all", label: "All ideas" },
  { value: "trending", label: "Trending" },
  { value: "great-fit", label: "Great fit" },
  { value: "saved", label: "Saved" },
];

export function DiscoverClient({ initialCards, brandId }: { initialCards: DiscoverCard[]; brandId?: string }) {
  const [cards, setCards] = useState(initialCards);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DiscoverFilter>("all");
  const [format, setFormat] = useState("all");
  const [channel, setChannel] = useState("all");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const visible = useMemo(() => filterDiscoverCards(cards, { query, filter, format, channel }), [cards, channel, filter, format, query]);
  const savedCount = cards.filter((card) => card.status === "saved").length;

  async function act(card: DiscoverCard, action: "save" | "ignore") {
    const key = `${card.id}:${action}`;
    if (pending) return;
    setPending(key);
    setError("");
    try {
      if (brandId) {
        const response = await fetch("/api/discover/action", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ brandId, opportunityId: card.id, action }),
        });
        const body = await response.json().catch(() => ({})) as { error?: string };
        if (!response.ok) throw new Error(body.error ?? "Kairo could not update this idea.");
      }
      setCards((current) => action === "ignore" ? current.filter((item) => item.id !== card.id) : current.map((item) => item.id === card.id ? { ...item, status: "saved" } : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Kairo could not update this idea.");
    } finally {
      setPending("");
    }
  }

  return <>
    <section className="discover-toolbar" aria-label="Discover filters">
      <label className="discover-search"><Search aria-hidden="true"/><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ideas, formats or channels…" aria-label="Search Discover"/></label>
      <div className="discover-filter-row">
        <div className="discover-pills">{filters.map((item) => <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}{item.value === "saved" && savedCount ? <span>{savedCount}</span> : null}</button>)}</div>
        <label>Format<select value={format} onChange={(event) => setFormat(event.target.value)}><option value="all">All formats</option><option value="image">Post</option><option value="reel">Reel</option><option value="carousel">Carousel</option><option value="campaign">Campaign</option></select></label>
        <label>Channel<select value={channel} onChange={(event) => setChannel(event.target.value)}><option value="all">All channels</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="linkedin">LinkedIn</option><option value="youtube">YouTube</option></select></label>
      </div>
    </section>

    <div className="discover-result-line"><p><strong>{visible.length}</strong> ideas worth exploring</p><span>Updated from public trends and your Brand fit</span></div>
    {error ? <p className="discover-inline-error" role="alert">{error}</p> : null}

    {visible.length ? <section className="discover-card-grid" aria-label="Discovery ideas">{visible.map((card) => {
      const FormatIcon = card.format === "image" ? FileImage : card.format === "carousel" ? LayoutGrid : PlaySquare;
      const ChannelIcon = channelIcon(card.channel);
      const saved = card.status === "saved";
      return <article className="discover-card" key={card.id}>
        <Link className="discover-card-media" href={discoverPreviewHref(card.id, brandId)} aria-label={`Preview ${card.title}`}>
          <Image src={card.image} alt="" fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"/>
          <span className="discover-media-shade"/>
          <span className="discover-badges"><i><TrendingUp aria-hidden="true"/>{card.trend}</i><i><ShieldCheck aria-hidden="true"/>{card.fit}</i></span>
          <span className="discover-channel"><ChannelIcon aria-hidden="true"/>{card.channel}</span>
        </Link>
        <div className="discover-card-body">
          <div className="discover-card-meta"><span><FormatIcon aria-hidden="true"/>{card.formatLabel}</span><span>{card.opportunity}</span></div>
          <h2><Link href={discoverPreviewHref(card.id, brandId)}>{card.title}</Link></h2>
          <p>{card.rationale ?? "A timely, Brand-fit direction ready for your review."}</p>
          <div className="discover-card-actions">
            <Link className="discover-preview-button" href={discoverPreviewHref(card.id, brandId)}><Eye aria-hidden="true"/>Preview</Link>
            <button className={saved ? "saved" : ""} type="button" disabled={saved || Boolean(pending)} onClick={() => void act(card, "save")} aria-label={saved ? `${card.title} saved` : `Save ${card.title}`} title={saved ? "Saved" : "Save idea"}>{saved ? <Check aria-hidden="true"/> : <Bookmark aria-hidden="true"/>}</button>
            <button type="button" disabled={Boolean(pending)} onClick={() => void act(card, "ignore")} aria-label={`Dismiss ${card.title}`} title="Dismiss idea"><Trash2 aria-hidden="true"/></button>
          </div>
        </div>
      </article>;
    })}</section> : <section className="discover-empty" aria-live="polite"><Search aria-hidden="true"/><h2>No ideas match these filters</h2><p>Clear a filter or try a broader search. Kairo will not fill Discover with weak matches.</p><button type="button" onClick={() => { setQuery(""); setFilter("all"); setFormat("all"); setChannel("all"); }}>Clear filters</button></section>}
  </>;
}

function channelIcon(channel: string) {
  if (channel === "LinkedIn") return Linkedin;
  if (channel === "Facebook") return Facebook;
  if (channel === "YouTube") return Youtube;
  return Instagram;
}
