import type { BrandBrainFieldDto, BrandBrainSection } from "@kairo/contracts";

export type BrandBrainFieldDefinition = {
  key: string;
  label: string;
  hint: string;
};

export type BrandBrainSectionDefinition = {
  section: BrandBrainSection;
  title: string;
  description: string;
  fields: BrandBrainFieldDefinition[];
};

export const BRAND_BRAIN_SECTIONS: BrandBrainSectionDefinition[] = [
  {
    section: "identity",
    title: "Identity",
    description: "Stable facts about what the Brand is and where it operates.",
    fields: [
      { key: "identity.description", label: "Description", hint: "What the Brand does in plain language." },
      { key: "identity.category", label: "Category", hint: "The Brand's primary category or sector." },
      { key: "identity.geography", label: "Geography", hint: "Primary market, region or geographic context." },
      { key: "identity.language", label: "Language", hint: "Primary language or language mix for content." },
    ],
  },
  {
    section: "positioning",
    title: "Positioning",
    description: "How the Brand should be understood relative to alternatives.",
    fields: [
      { key: "positioning.value-proposition", label: "Value proposition", hint: "The useful promise the Brand makes to its audience." },
      { key: "positioning.differentiation", label: "Differentiation", hint: "What makes this Brand meaningfully different." },
      { key: "positioning.market-position", label: "Market position", hint: "How the Brand wants to be positioned in its market." },
    ],
  },
  {
    section: "audience",
    title: "Audience",
    description: "Who the Brand serves and what matters to them.",
    fields: [
      { key: "audience.primary", label: "Primary audience", hint: "The people this Brand most needs to reach." },
      { key: "audience.pains", label: "Audience pains", hint: "Problems, frustrations or unmet needs." },
      { key: "audience.motivations", label: "Motivations", hint: "What the audience wants to achieve or become." },
      { key: "audience.sophistication", label: "Sophistication", hint: "How experienced the audience is with the subject." },
    ],
  },
  {
    section: "voice",
    title: "Voice",
    description: "How content should sound and what language should be avoided.",
    fields: [
      { key: "voice.tone", label: "Tone", hint: "For example: clear, technical, warm, direct." },
      { key: "voice.vocabulary", label: "Vocabulary", hint: "Preferred terminology, phrasing and language patterns." },
      { key: "voice.prohibited-wording", label: "Prohibited wording", hint: "Words or phrases that should not appear." },
      { key: "voice.examples", label: "Examples", hint: "Short examples that represent the desired voice." },
    ],
  },
  {
    section: "content-strategy",
    title: "Content strategy",
    description: "The themes and channels Kairo should plan around.",
    fields: [
      { key: "content.pillars", label: "Content pillars", hint: "Recurring areas the Brand has authority to discuss." },
      { key: "content.preferred-topics", label: "Preferred topics", hint: "Topics the Brand wants to cover more often." },
      { key: "content.channels", label: "Preferred channels", hint: "Channels Kairo should plan content for. Connected publishing destinations are managed separately in Channels." },
    ],
  },
  {
    section: "goals",
    title: "Goals",
    description: "What content should help this Brand accomplish.",
    fields: [
      { key: "goals.objectives", label: "Primary objectives", hint: "Owner-confirmed business objective used to steer Kairo." },
    ],
  },
  {
    section: "boundaries",
    title: "Boundaries",
    description: "Hard limits and safeguards Kairo must respect.",
    fields: [
      { key: "boundaries.owner-directive", label: "Owner directive", hint: "Anything the owner explicitly says Kairo must never say or do." },
      { key: "boundaries.claims-to-avoid", label: "Claims to avoid", hint: "Claims that are unsupported, sensitive or not authorised." },
      { key: "boundaries.prohibited-subjects", label: "Prohibited subjects", hint: "Subjects this Brand should not discuss." },
      { key: "boundaries.sensitive-subjects", label: "Sensitive subjects", hint: "Subjects that need extra care or human review." },
    ],
  },
];

const SUMMARY_DEFINITIONS = [
  { title: "Positioning", keys: ["positioning.market-position", "positioning.value-proposition"] },
  { title: "Audience", keys: ["audience.primary"] },
  { title: "Voice", keys: ["voice.tone"] },
  { title: "Content strategy", keys: ["content.pillars", "content.preferred-topics"] },
] as const;

export function buildBrandBrainOverview(fields: BrandBrainFieldDto[]) {
  const fieldMap = new Map(fields.map((field) => [field.fieldKey, field]));
  const reviewItems = fields
    .filter((field) => field.state === "inferred" || field.state === "stale")
    .sort((left, right) => reviewPriority(left) - reviewPriority(right) || left.fieldKey.localeCompare(right.fieldKey));

  return {
    fieldMap,
    confirmedCount: fields.filter((field) => field.state === "confirmed").length,
    suggestedCount: fields.filter((field) => field.state === "inferred").length,
    staleCount: fields.filter((field) => field.state === "stale").length,
    reviewItems,
    summaries: SUMMARY_DEFINITIONS.map((definition) => ({
      title: definition.title,
      field: firstField(fieldMap, definition.keys),
    })),
  };
}

export function fieldStateLabel(field?: Pick<BrandBrainFieldDto, "state">) {
  if (!field) return "Not set";
  if (field.state === "confirmed") return "Confirmed";
  if (field.state === "inferred") return "AI inferred";
  return "Needs refresh";
}

export function fieldEvidenceLabel(field?: Pick<BrandBrainFieldDto, "state" | "sourceIds">) {
  if (!field) return "Kairo has not learned this yet.";
  const sourceCount = field.sourceIds.length;
  if (field.state === "confirmed") {
    return sourceCount
      ? `Owner confirmed · ${sourceCount} supporting ${sourceCount === 1 ? "source" : "sources"}`
      : "Owner confirmed";
  }
  if (field.state === "stale") return "Previous context needs review before Kairo relies on it.";
  return sourceCount
    ? `AI inferred from ${sourceCount} readable ${sourceCount === 1 ? "source" : "sources"}`
    : "AI inferred from Brand setup and owner context";
}

export function fieldAnchor(fieldKey: string) {
  return `field-${fieldKey.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export function findFieldDefinition(fieldKey: string) {
  for (const section of BRAND_BRAIN_SECTIONS) {
    const definition = section.fields.find((field) => field.key === fieldKey);
    if (definition) return definition;
  }
  return undefined;
}

function firstField(map: Map<string, BrandBrainFieldDto>, keys: readonly string[]) {
  for (const key of keys) {
    const field = map.get(key);
    if (field) return field;
  }
  return undefined;
}

function reviewPriority(field: BrandBrainFieldDto) {
  return field.state === "stale" ? 0 : 1;
}
