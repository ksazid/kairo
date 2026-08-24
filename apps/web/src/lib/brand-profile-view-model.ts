import type { BrandBrainFieldDto, BrandBrainSection } from "@kairo/contracts";
import { BRAND_BRAIN_SECTIONS, type BrandBrainFieldDefinition } from "./brand-brain-view-model";

export type BrandProfileField = {
  section: BrandBrainSection;
  definition: BrandBrainFieldDefinition;
  field?: BrandBrainFieldDto;
};

export type BrandProfileSection = {
  id: "identity" | "audience" | "voice-style" | "content-pillars";
  title: string;
  description: string;
  fields: BrandProfileField[];
};

const SECTION_GROUPS: Array<{
  id: BrandProfileSection["id"];
  title: string;
  description: string;
  sourceSections: BrandBrainSection[];
}> = [
  {
    id: "identity",
    title: "Identity",
    description: "What the Brand is, where it operates and how it should be positioned.",
    sourceSections: ["identity", "positioning"],
  },
  {
    id: "audience",
    title: "Audience",
    description: "Who the Brand serves, what matters to them and how sophisticated they are.",
    sourceSections: ["audience"],
  },
  {
    id: "voice-style",
    title: "Voice & Style",
    description: "How the Brand should sound, plus the wording and subjects Kairo must handle carefully.",
    sourceSections: ["voice", "boundaries"],
  },
  {
    id: "content-pillars",
    title: "Content Pillars",
    description: "The themes, topics and objectives Kairo should plan content around.",
    sourceSections: ["content-strategy", "goals"],
  },
];

export function buildBrandProfileSections(fields: BrandBrainFieldDto[]): BrandProfileSection[] {
  const fieldMap = new Map(fields.map((field) => [field.fieldKey, field]));

  return SECTION_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    description: group.description,
    fields: group.sourceSections.flatMap((sourceSection) => {
      const source = BRAND_BRAIN_SECTIONS.find((section) => section.section === sourceSection);
      return (source?.fields ?? []).map((definition) => ({
        section: sourceSection,
        definition,
        field: fieldMap.get(definition.key),
      }));
    }),
  }));
}

export function brandSummary(fields: BrandBrainFieldDto[]) {
  const map = new Map(fields.map((field) => [field.fieldKey, field]));
  return {
    category: map.get("identity.category")?.value,
    positioning: map.get("positioning.market-position")?.value ?? map.get("positioning.value-proposition")?.value,
    audience: map.get("audience.primary")?.value,
    tone: map.get("voice.tone")?.value,
    confirmed: fields.filter((field) => field.state === "confirmed").length,
    suggested: fields.filter((field) => field.state === "inferred").length,
    stale: fields.filter((field) => field.state === "stale").length,
  };
}
