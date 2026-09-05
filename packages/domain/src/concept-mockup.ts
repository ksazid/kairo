export type ConceptMockupFormat = "text" | "image" | "carousel" | "reel";

export type TextConceptMockup = {
  hook: string;
  opening?: string;
  keyPoints: string[];
  captionDirection?: string;
  cta?: string;
  tone?: string;
};

export type ImageConceptMockup = {
  headline: string;
  subheadline?: string;
  visualSubject: string;
  composition?: string;
  overlayText?: string;
  visualStyle?: string;
  cta?: string;
};

export type CarouselConceptSlide = {
  headline: string;
  body?: string;
  visualDirection?: string;
};

export type CarouselConceptMockup = {
  cover: CarouselConceptSlide;
  slides: CarouselConceptSlide[];
  closingSlide?: CarouselConceptSlide;
  cardCount: number;
  visualStyle?: string;
};

export type ReelConceptScene = {
  startSeconds: number;
  endSeconds: number;
  beat: string;
  visualDirection?: string;
  onScreenText?: string;
};

export type ReelConceptMockup = {
  hook: string;
  durationSeconds: number;
  openingFrame: string;
  scenes: ReelConceptScene[];
  voiceoverDirection?: string;
  endingCta?: string;
};

export type ConceptMockup = {
  version: 1;
  format: ConceptMockupFormat;
  hook: string;
  copyPreview?: string;
  visualDirection?: string;
  cta?: string;
  text?: TextConceptMockup;
  image?: ImageConceptMockup;
  carousel?: CarouselConceptMockup;
  reel?: ReelConceptMockup;
};

export function isConceptMockup(value: unknown): value is ConceptMockup {
  if (!value || typeof value !== "object") return false;
  const mockup = value as Partial<ConceptMockup>;
  if (mockup.version !== 1 || !mockup.format || typeof mockup.hook !== "string" || mockup.hook.trim().length === 0) return false;
  if (!["text", "image", "carousel", "reel"].includes(mockup.format)) return false;

  switch (mockup.format) {
    case "text":
      return !!mockup.text && Array.isArray(mockup.text.keyPoints) && typeof mockup.text.hook === "string";
    case "image":
      return !!mockup.image && typeof mockup.image.headline === "string" && typeof mockup.image.visualSubject === "string";
    case "carousel":
      return !!mockup.carousel && typeof mockup.carousel.cover?.headline === "string" && Array.isArray(mockup.carousel.slides) && Number.isFinite(mockup.carousel.cardCount);
    case "reel":
      return !!mockup.reel && typeof mockup.reel.hook === "string" && typeof mockup.reel.openingFrame === "string" && Array.isArray(mockup.reel.scenes) && Number.isFinite(mockup.reel.durationSeconds);
  }
}
