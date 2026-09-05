import type { ReactNode } from "react";

export type ConceptMockupView = {
  version: 1;
  format: "text" | "image" | "carousel" | "reel";
  hook: string;
  copyPreview?: string;
  visualDirection?: string;
  cta?: string;
  text?: { hook: string; opening?: string; keyPoints: string[]; captionDirection?: string; cta?: string; tone?: string };
  image?: { headline: string; subheadline?: string; visualSubject: string; composition?: string; overlayText?: string; visualStyle?: string; cta?: string };
  carousel?: { cover: { headline: string; body?: string; visualDirection?: string }; slides: Array<{ headline: string; body?: string; visualDirection?: string }>; closingSlide?: { headline: string; body?: string; visualDirection?: string }; cardCount: number; visualStyle?: string };
  reel?: { hook: string; durationSeconds: number; openingFrame: string; scenes: Array<{ startSeconds: number; endSeconds: number; beat: string; visualDirection?: string; onScreenText?: string }>; voiceoverDirection?: string; endingCta?: string };
};

export function ConceptMockupPreview({ mockup, mode = "card" }: { mockup?: ConceptMockupView | null; mode?: "compact" | "card" | "full" }) {
  if (!mockup) return <MockupFrame mode={mode}><span className="concept-mockup-kicker">Concept preview</span><strong>Preview will appear when the idea is ready.</strong></MockupFrame>;
  if (mockup.format === "text") return <TextPreview mockup={mockup} mode={mode}/>;
  if (mockup.format === "image") return <ImagePreview mockup={mockup} mode={mode}/>;
  if (mockup.format === "carousel") return <CarouselPreview mockup={mockup} mode={mode}/>;
  return <ReelPreview mockup={mockup} mode={mode}/>;
}

function MockupFrame({ children, mode }: { children: ReactNode; mode: "compact" | "card" | "full" }) {
  return <section className={`concept-mockup concept-mockup-${mode}`}>{children}</section>;
}

function TextPreview({ mockup, mode }: { mockup: ConceptMockupView; mode: "compact" | "card" | "full" }) {
  const text = mockup.text;
  return <MockupFrame mode={mode}><span className="concept-mockup-kicker">Text concept</span><strong>{text?.hook ?? mockup.hook}</strong>{mode !== "compact" && text?.opening ? <p>{text.opening}</p> : null}{mode === "full" && text?.keyPoints?.length ? <ul>{text.keyPoints.slice(0, 4).map((point) => <li key={point}>{point}</li>)}</ul> : null}{mockup.cta || text?.cta ? <small>{mockup.cta ?? text?.cta}</small> : null}</MockupFrame>;
}

function ImagePreview({ mockup, mode }: { mockup: ConceptMockupView; mode: "compact" | "card" | "full" }) {
  const image = mockup.image;
  return <MockupFrame mode={mode}><span className="concept-mockup-kicker">Image concept</span><div className="concept-artboard"><strong>{image?.overlayText ?? image?.headline ?? mockup.hook}</strong>{mode !== "compact" && image?.subheadline ? <p>{image.subheadline}</p> : null}</div>{mode === "full" ? <p>{image?.visualSubject}{image?.composition ? ` · ${image.composition}` : ""}</p> : null}</MockupFrame>;
}

function CarouselPreview({ mockup, mode }: { mockup: ConceptMockupView; mode: "compact" | "card" | "full" }) {
  const carousel = mockup.carousel;
  const cards = carousel ? [carousel.cover, ...carousel.slides.slice(0, 2)] : [{ headline: mockup.hook }];
  return <MockupFrame mode={mode}><span className="concept-mockup-kicker">Carousel concept · {carousel?.cardCount ?? cards.length} cards</span><div className="concept-carousel">{cards.slice(0, mode === "compact" ? 1 : 3).map((card, index) => <div className="concept-artboard" key={`${card.headline}-${index}`}><small>{index + 1}</small><strong>{card.headline}</strong>{mode === "full" && card.body ? <p>{card.body}</p> : null}</div>)}</div></MockupFrame>;
}

function ReelPreview({ mockup, mode }: { mockup: ConceptMockupView; mode: "compact" | "card" | "full" }) {
  const reel = mockup.reel;
  return <MockupFrame mode={mode}><span className="concept-mockup-kicker">Reel concept · ~{reel?.durationSeconds ?? 20}s</span><div className="concept-artboard concept-reel-frame"><span aria-hidden="true">▶</span><strong>{reel?.openingFrame ?? mockup.hook}</strong></div>{mode === "full" && reel?.scenes?.length ? <ol className="concept-storyboard">{reel.scenes.slice(0, 4).map((scene) => <li key={`${scene.startSeconds}-${scene.endSeconds}-${scene.beat}`}><small>{scene.startSeconds}–{scene.endSeconds}s</small><strong>{scene.beat}</strong>{scene.onScreenText ? <span>{scene.onScreenText}</span> : null}</li>)}</ol> : null}</MockupFrame>;
}
