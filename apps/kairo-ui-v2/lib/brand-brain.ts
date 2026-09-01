export type BrandBrainState = "confirmed" | "suggested" | "review";

export type BrandBrainField = {
  key: string;
  label: string;
  description: string;
  value: string;
  state: BrandBrainState;
  evidence: string[];
};

export type DiscoveryTopic = {
  id: string;
  name: string;
  priority: "High" | "Medium";
  audience: string;
  entities: string[];
  sources: string[];
};

export function updateBrandField(
  fields: readonly BrandBrainField[],
  key: string,
  value: string,
): BrandBrainField[] {
  const normalized = value.trim();
  if (!normalized) return [...fields];
  return fields.map((field) => field.key === key ? { ...field, value: normalized, state: "confirmed" } : field);
}

export function updateDiscoveryTopic(
  topics: readonly DiscoveryTopic[],
  id: string,
  input: { name: string; entities: string },
): DiscoveryTopic[] {
  const name = input.name.trim();
  const entities = normalizeEntities(input.entities);
  if (!name || entities.length === 0) return [...topics];
  return topics.map((topic) => topic.id === id ? { ...topic, name, entities } : topic);
}

export function normalizeEntities(value: string): string[] {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

export function reviewCount(fields: readonly BrandBrainField[]): number {
  return fields.filter((field) => field.state !== "confirmed").length;
}
