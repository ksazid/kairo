import type { BrandBrainFieldDto, BrandDto } from "@kairo/contracts";
import type { CandidateLearning } from "./learning";

export interface BrandIntelligenceContext {
  version: string;
  completeness: "empty" | "partial" | "learned";
  brandName: string;
  identity?: string;
  positioning?: string;
  audience?: string;
  voice?: string;
  contentStrategy?: string;
  goals?: string;
  boundaries?: string;
  performanceMemory: string[];
}

export function projectBrandIntelligenceContext(
  brand: Pick<BrandDto, "id" | "name">,
  fields: readonly BrandBrainFieldDto[],
  learnings: readonly CandidateLearning[] = [],
): BrandIntelligenceContext {
  const active = fields.filter((field) => field.state !== "stale");
  const latestField = [...active].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  const accepted = learnings
    .filter((learning) => learning.status === "accepted" && learning.brandId === brand.id)
    .sort((left, right) => (right.decidedAt ?? right.createdAt).localeCompare(left.decidedAt ?? left.createdAt))
    .slice(0, 6);
  const latestLearning = accepted[0]?.decidedAt ?? accepted[0]?.createdAt;
  const versionAt = [latestField?.updatedAt, latestLearning].filter(Boolean).sort().at(-1) ?? "empty";
  const section = (name: BrandBrainFieldDto["section"]) => compact(
    active.filter((field) => field.section === name).map((field) => `${field.fieldKey}: ${field.value}`),
  );
  const sectionCount = new Set(active.map((field) => field.section)).size;
  return {
    version: `${brand.id}@${versionAt}`,
    completeness: active.length === 0 ? "empty" : sectionCount >= 4 ? "learned" : "partial",
    brandName: brand.name,
    ...(section("identity") ? { identity: section("identity") } : {}),
    ...(section("positioning") ? { positioning: section("positioning") } : {}),
    ...(section("audience") ? { audience: section("audience") } : {}),
    ...(section("voice") ? { voice: section("voice") } : {}),
    ...(section("content-strategy") ? { contentStrategy: section("content-strategy") } : {}),
    ...(section("goals") ? { goals: section("goals") } : {}),
    ...(section("boundaries") ? { boundaries: section("boundaries") } : {}),
    performanceMemory: accepted.map((learning) => `${learning.statement} — ${learning.interpretation}`).slice(0, 6),
  };
}

export function compactBrandIntelligenceContext(context: BrandIntelligenceContext) {
  return {
    completeness: context.completeness,
    brandName: context.brandName,
    ...(context.identity ? { identity: context.identity } : {}),
    ...(context.positioning ? { positioning: context.positioning } : {}),
    ...(context.audience ? { audience: context.audience } : {}),
    ...(context.voice ? { voice: context.voice } : {}),
    ...(context.contentStrategy ? { contentStrategy: context.contentStrategy } : {}),
    ...(context.goals ? { goals: context.goals } : {}),
    ...(context.boundaries ? { boundaries: context.boundaries } : {}),
    ...(context.performanceMemory.length ? { performanceMemory: context.performanceMemory } : {}),
  };
}

function compact(values: string[]) {
  const value = values.map((item) => item.trim()).filter(Boolean).join(" · ").slice(0, 8_000);
  return value || undefined;
}
