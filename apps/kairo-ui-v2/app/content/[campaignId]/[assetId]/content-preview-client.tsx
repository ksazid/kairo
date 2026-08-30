"use client";

import {
  Bookmark,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Heart,
  Instagram,
  Linkedin,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Play,
  Send,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useState } from "react";
import type { ContentItem } from "../../../../lib/content";

export function ContentPreviewClient({ item, authenticated, legacyHref }: { item: ContentItem; authenticated: boolean; legacyHref: string }) {
  const [slide, setSlide] = useState(0);
  const [caption, setCaption] = useState(item.caption);
  const [notice, setNotice] = useState("");
  const [approved, setApproved] = useState(item.status === "published" || item.status === "scheduled");
  const [scheduled, setScheduled] = useState(item.status === "scheduled");
  const media = item.media.length ? item.media : [item.image];
  const currentMedia = media[Math.min(slide, media.length - 1)] ?? item.image;
  const ChannelIcon = item.channel === "Facebook" ? Facebook : item.channel === "LinkedIn" ? Linkedin : Instagram;

  function refine(action: "improve" | "shorten" | "tone" | "ideas") {
    if (action === "shorten") setCaption(item.caption.split(/[.!?]/)[0]?.trim().concat(".") || item.caption);
    if (action === "improve") setCaption(`${item.caption} ${item.cta}`.trim());
    if (action === "tone") setCaption(`Local tip: ${item.caption.charAt(0).toLowerCase()}${item.caption.slice(1)}`);
    setNotice(action === "ideas" ? "Three alternative directions are ready in the full editor." : "Preview copy updated. Open the full editor to save this version.");
  }

  function approve() {
    if (authenticated) {
      window.location.assign(`${legacyHref}#preview`);
      return;
    }
    setApproved(true);
    setNotice("Preview approved and locked.");
  }

  function schedule() {
    if (!approved) return;
    if (authenticated) {
      window.location.assign(`${legacyHref}#preview`);
      return;
    }
    setScheduled(true);
    setNotice("Preview scheduled for the next available slot.");
  }

  return <>
    <div className="content-preview-grid">
      <section className="content-preview-panel" aria-labelledby="preview-heading">
        <header><div><h2 id="preview-heading">Preview</h2><p>Review how your content will look across platforms.</p></div><span>Mobile preview</span></header>
        <nav className="content-destination-tabs" aria-label="Content destinations"><button type="button" aria-pressed="true"><ChannelIcon aria-hidden="true"/>{item.channel}</button></nav>

        <div className="social-preview-wrap">
          <article className="social-preview-card" aria-label={`${item.channel} ${item.formatLabel} preview`}>
            <header><span className="social-brand-avatar">S</span><strong>sazzid</strong><MoreHorizontal aria-hidden="true"/></header>
            <div className={`social-media-stage format-${item.format}`}>
              <img src={currentMedia} alt={`${item.title}${media.length > 1 ? ` card ${slide + 1}` : ""}`}/>
              {item.format === "reel" ? <button type="button" aria-label="Play Reel"><Play aria-hidden="true"/></button> : null}
              {media.length > 1 ? <><button className="media-previous" type="button" disabled={slide === 0} onClick={() => setSlide((value) => Math.max(0, value - 1))} aria-label="Previous card"><ChevronLeft aria-hidden="true"/></button><button className="media-next" type="button" disabled={slide === media.length - 1} onClick={() => setSlide((value) => Math.min(media.length - 1, value + 1))} aria-label="Next card"><ChevronRight aria-hidden="true"/></button><span className="media-count">{slide + 1}/{item.cardCount ?? media.length}</span></> : null}
            </div>
            <div className="social-actions" aria-hidden="true"><Heart/><MessageCircle/><Send/><Bookmark className="push-right"/></div>
            <div className="social-caption"><strong>Likes unavailable</strong><p><b>sazzid</b> {caption}</p></div>
          </article>
          {media.length > 1 ? <div className="social-dots" aria-label="Carousel position">{media.map((_, index) => <button type="button" key={index} aria-label={`Show card ${index + 1}`} aria-pressed={slide === index} onClick={() => setSlide(index)}/>)}</div> : null}
        </div>

        <section className="content-ai-assistance"><div><h3>AI assistance</h3><p>Improve your content with Kairo.</p></div><div><button type="button" onClick={() => refine("improve")}><Sparkles/>Improve copy</button><button type="button" onClick={() => refine("shorten")}><WandSparkles/>Shorten</button><button type="button" onClick={() => refine("tone")}><WandSparkles/>Change tone</button><button type="button" onClick={() => refine("ideas")}><Sparkles/>More ideas</button></div>{notice ? <p role="status">{notice}</p> : null}</section>
      </section>

      <aside className="content-preview-rail" aria-label="Content context">
        <section><h2>Content details</h2><dl><div><dt>Type</dt><dd>{item.formatLabel}</dd></div><div><dt>Campaign</dt><dd>{item.campaignName}</dd></div><div><dt>Goal</dt><dd>{item.objective}</dd></div><div><dt>Audience</dt><dd>{item.audience}</dd></div><div><dt>Channel</dt><dd><ChannelIcon aria-hidden="true"/>{item.channel}</dd></div><div><dt>CTA</dt><dd>{item.cta}</dd></div></dl></section>
        <section><h2>Performance potential</h2><div className="potential-row"><span>Brand fit</span><strong>Not available</strong></div><div className="potential-row"><span>Engagement</span><strong>Not available</strong></div><p>Scores appear only when supported by real Brand and performance evidence.</p></section>
        {media.length > 1 ? <section className="preview-cards-list"><h2>Cards ({item.cardCount ?? media.length})</h2><ol>{media.map((image, index) => <li key={`${image}-${index}`}><button type="button" aria-pressed={slide === index} onClick={() => setSlide(index)}><img src={image} alt=""/><span><b>Card {index + 1}</b>{index === 0 ? item.title : `Supporting point ${index + 1}`}</span></button></li>)}</ol></section> : null}
      </aside>
    </div>

    <section className="content-approval-bar" aria-label="Approval actions"><div><span><Lock aria-hidden="true"/></span><p><strong>{scheduled ? "Scheduled" : approved ? "Approved & locked" : "Needs review"}</strong><small>{scheduled ? "This content is ready for its publishing slot." : approved ? "This preview is locked for publishing." : "Review the visual and copy before approval."}</small></p></div><div><button className="approve" type="button" disabled={approved} onClick={approve}>{approved ? <Check/> : <Lock/>}{approved ? "Approved & Locked" : "Approve & Lock"}</button><button type="button" disabled={!approved || scheduled} onClick={schedule}><CalendarDays/>{scheduled ? "Scheduled" : "Schedule"}</button></div></section>
  </>;
}
