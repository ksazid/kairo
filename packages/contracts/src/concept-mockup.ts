import type { BrandOpportunityDto } from "./index.js";

export type ConceptMockupFormatDto = "text" | "image" | "carousel" | "reel";

export interface TextConceptMockupDto {
  hook: string;
  opening?: string;
  keyPoints: string[];
  captionDirection?: string;
  cta?: string;
  tone?: string;
}

export interface ImageConceptMockupDto {
  headline: string;
  subheadline?: string;
  visualSubject: string;
  composition?: string;
  overlayText?: string;
  visualStyle?: string;
  cta?: string;
}

export interface CarouselConceptSlideDto {
  headline: string;
  body?: string;
  visualDirection?: string;
}

export interface CarouselConceptMockupDto {
  cover: CarouselConceptSlideDto;
  slides: CarouselConceptSlideDto[];
  closingSlide?: CarouselConceptSlideDto;
  cardCount: number;
  visualStyle?: string;
}

export interface ReelConceptSceneDto {
  startSeconds: number;
  endSeconds: number;
  beat: string;
  visualDirection?: string;
  onScreenText?: string;
}

export interface ReelConceptMockupDto {
  hook: string;
  durationSeconds: number;
  openingFrame: string;
  scenes: ReelConceptSceneDto[];
  voiceoverDirection?: string;
  endingCta?: string;
}

export interface ConceptMockupDto {
  version: 1;
  format: ConceptMockupFormatDto;
  hook: string;
  copyPreview?: string;
  visualDirection?: string;
  cta?: string;
  text?: TextConceptMockupDto;
  image?: ImageConceptMockupDto;
  carousel?: CarouselConceptMockupDto;
  reel?: ReelConceptMockupDto;
}

export type BrandOpportunityWithConceptDto = BrandOpportunityDto & {
  conceptMockup?: ConceptMockupDto;
  conceptMockupGeneratedAt?: string;
};
