import type { BrandIntelligenceSnapshot } from "./brand-intelligence-snapshot";

export const BRAND_DISCOVERY_PLAN_SCHEMA_VERSION = "1" as const;

export interface BrandDiscoveryTopic {
  id: string;
  name: string;
  priority: "High" | "Medium";
  audience: string;
  entities: string[];
  sourceClasses: string[];
}

export interface BrandDiscoveryPlan {
  schemaVersion: typeof BRAND_DISCOVERY_PLAN_SCHEMA_VERSION;
  planVersion: string;
  snapshotVersion: string;
  state: "initial";
  topics: BrandDiscoveryTopic[];
  excludedTopics: string[];
  updatedAt: string | null;
}

/**
 * Creates the first persistent-shape Discovery Plan from canonical Brand intelligence.
 * Hunter can later persist/refine a newer plan version, but onboarding never needs to
 * invent run results to make Discovery Intelligence useful.
 */
export function projectInitialBrandDiscoveryPlan(snapshot: BrandIntelligenceSnapshot): BrandDiscoveryPlan {
  const field = (key: string) => snapshot.fields.find((item) => item.fieldKey === key && item.state !== "stale")?.value.trim() ?? "";
  const audience = field("audience.primary") || "Brand audience";
  const geography = field("identity.geography");
  const sector = field("identity.sector") || field("identity.category");
  const topics = unique([
    ...splitList(field("content.preferred-topics")),
    ...splitList(field("content.core-topics")),
    ...splitList(field("content.pillars")),
    ...splitList(field("content.authority-areas")),
    ...splitList(field("content.related-topics")),
  ]).slice(0, 6);

  const fallbackTopics = unique([sector, field("identity.products-services"), field("positioning.value-proposition")]).filter(Boolean).slice(0, 3);
  const chosen = topics.length ? topics : fallbackTopics;
  const channelClasses = sourceClasses(splitList(field("content.channels")));

  return {
    schemaVersion: BRAND_DISCOVERY_PLAN_SCHEMA_VERSION,
    planVersion: `${snapshot.snapshotVersion}:discovery-initial`,
    snapshotVersion: snapshot.snapshotVersion,
    state: "initial",
    topics: chosen.map((name, index) => ({
      id: slug(name, index),
      name,
      priority: index < 3 ? "High" : "Medium",
      audience,
      entities: unique([name, geography ? `${name} ${geography}` : "", sector ? `${name} ${sector}` : ""]).filter(Boolean).slice(0, 5),
      sourceClasses: channelClasses,
    })),
    excludedTopics: unique([
      ...splitList(field("boundaries.excluded-topics")),
      ...splitList(field("boundaries.prohibited-subjects")),
      ...splitList(field("boundaries.claims-to-avoid")),
      ...splitList(field("boundaries.owner-directive")),
    ]).slice(0, 20),
    updatedAt: snapshot.updatedAt,
  };
}

function sourceClasses(channels: string[]): string[] {
  const values = new Set<string>(["Official sources", "Industry news"]);
  for (const channel of channels.map((value) => value.toLowerCase())) {
    if (channel.includes("linkedin")) values.add("LinkedIn");
    if (channel.includes("youtube")) values.add("YouTube");
    if (channel.includes("instagram")) values.add("Instagram");
    if (channel.includes("reddit")) values.add("Community discussions");
  }
  return [...values];
}

function splitList(value: string): string[] {
  return value
    .split(/[\n,;|·•]+/)
    .map((item) => item.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((item) => item.length >= 2 && item.length <= 180);
}

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values.map((item) => item.trim()).filter(Boolean)) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function slug(value: string, index: number): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
  return normalized || `topic-${index + 1}`;
}
