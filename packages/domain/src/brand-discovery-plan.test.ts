import { describe, expect, it } from "vitest";
import { projectInitialBrandDiscoveryPlan } from "./brand-discovery-plan";
import type { BrandIntelligenceSnapshot } from "./brand-intelligence-snapshot";

describe("projectInitialBrandDiscoveryPlan", () => {
  it("derives truthful initial topics from canonical Brand intelligence without inventing a Hunter run", () => {
    const snapshot = {
      schemaVersion: "1",
      snapshotVersion: "brand-1@2026-09-01T10:00:00.000Z",
      workspaceId: "workspace-1",
      brandId: "brand-1",
      brandName: "Kairo",
      status: "ready-for-hunter",
      hunterReady: true,
      completeness: { score: 92, knownGroups: 6, totalGroups: 6 },
      readiness: { status: "ready", score: 92, brandIntelligenceScore: 90, evidenceCoverage: 84, confidence: 88, gaps: [] },
      context: { brandName: "Kairo" },
      fields: [
        { fieldKey: "audience.primary", section: "audience", value: "Malta founders", state: "confirmed", origin: "user-confirmed", confidence: { score: 1, level: "high" }, sourceIds: [], version: 1, updatedAt: "2026-09-01T10:00:00.000Z" },
        { fieldKey: "identity.geography", section: "identity", value: "Malta", state: "inferred", origin: "source-backed", confidence: { score: .85, level: "high" }, sourceIds: ["source-1"], version: 1, updatedAt: "2026-09-01T10:00:00.000Z" },
        { fieldKey: "content.preferred-topics", section: "content-strategy", value: "AI automation, software architecture", state: "inferred", origin: "source-backed", confidence: { score: .85, level: "high" }, sourceIds: ["source-1"], version: 1, updatedAt: "2026-09-01T10:00:00.000Z" },
        { fieldKey: "content.channels", section: "content-strategy", value: "LinkedIn, YouTube", state: "inferred", origin: "source-backed", confidence: { score: .85, level: "high" }, sourceIds: ["source-1"], version: 1, updatedAt: "2026-09-01T10:00:00.000Z" },
        { fieldKey: "boundaries.excluded-topics", section: "boundaries", value: "Political persuasion; unsupported financial claims", state: "confirmed", origin: "user-confirmed", confidence: { score: 1, level: "high" }, sourceIds: [], version: 1, updatedAt: "2026-09-01T10:00:00.000Z" },
      ],
      weakFields: [], readinessGaps: [], evidenceSourceIds: ["source-1"], activeSourceIds: ["source-1"], performanceMemory: [], updatedAt: "2026-09-01T10:00:00.000Z",
    } satisfies BrandIntelligenceSnapshot;

    const plan = projectInitialBrandDiscoveryPlan(snapshot);
    expect(plan.snapshotVersion).toBe(snapshot.snapshotVersion);
    expect(plan.planVersion).toContain(snapshot.snapshotVersion);
    expect(plan.state).toBe("initial");
    expect(plan.topics.map((topic) => topic.name)).toEqual(["AI automation", "software architecture"]);
    expect(plan.topics[0]?.audience).toBe("Malta founders");
    expect(plan.topics[0]?.entities).toContain("AI automation Malta");
    expect(plan.topics[0]?.sourceClasses).toEqual(expect.arrayContaining(["Official sources", "Industry news", "LinkedIn", "YouTube"]));
    expect(plan.excludedTopics).toEqual(["Political persuasion", "unsupported financial claims"]);
  });
});
