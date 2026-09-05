import type {
  CarouselConceptMockupDto,
  CarouselConceptSlideDto,
  ConceptMockupDto,
  ConceptMockupFormatDto,
  ImageConceptMockupDto,
  ReelConceptMockupDto,
  ReelConceptSceneDto,
  TextConceptMockupDto,
} from "@kairo/contracts/concept-mockup";

export type ConceptMockupFormat = ConceptMockupFormatDto;
export type TextConceptMockup = TextConceptMockupDto;
export type ImageConceptMockup = ImageConceptMockupDto;
export type CarouselConceptSlide = CarouselConceptSlideDto;
export type CarouselConceptMockup = CarouselConceptMockupDto;
export type ReelConceptScene = ReelConceptSceneDto;
export type ReelConceptMockup = ReelConceptMockupDto;
export type ConceptMockup = ConceptMockupDto;

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
