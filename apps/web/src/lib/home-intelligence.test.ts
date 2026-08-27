import { describe, expect, it } from "vitest";
import type { BrandOpportunityDto } from "@kairo/contracts";
import type { LearningView, PerformanceMetricView, PublishCommandView } from "./kairo-api";
import {
  buildForYou,
  buildUpNext,
  buildWhatsWorking,
  buildContinue,
  recommendMyIdea,
} from "./home-intelligence";
import type { CampaignView, IdeaSummary } from "./kairo-api";

function learning(overrides: Partial<LearningView> = {}): LearningView {
  return {
    id: "learning-1",
    workspaceId: "workspace-1",
    brandId: "brand-1",
    statement: "Carousels get more saves for technical explainers.",
    interpretation: "Use structured carousels when the topic has multiple technical points.",
    confidence: 0.85,
    period: { from: "2026-07-01T00:00:00.000Z", to: "2026-08-01T00:00:00.000Z" },
    applicability: { format: "carousel" },
    patterns: [],
    evidence: [],
    contradictions: [],
    status: "accepted",
    version: 1,
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function opportunity(id: string, score: number, status: BrandOpportunityDto["status"] = "new"): BrandOpportunityDto {
  return {
    id,
    workspaceId: "workspace-1",
    brandId: "brand-1",
    title: `Opportunity ${id}`,
    rationale: `Reason ${id}`,
    whyNow: "Useful now",
    developmentDirection: "Create a carousel breakdown",
    status,
    signalIds: [],
    scores: {
      relevance: score,
      evidence: score,
      novelty: score,
      timeliness: score,
      brandAuthority: score,
      audienceFit: score,
      overall: score,
      scoringVersion: "test",
    },
    brandContextVersion: "brand-1@current",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  };
}

function command(overrides: Partial<PublishCommandView> = {}): PublishCommandView {
  return {
    id: "command-1",
    workspaceId: "workspace-1",
    brandId: "brand-1",
    campaignId: "campaign-1",
    assetId: "asset-1",
    versionId: "version-1",
    version: 1,
    approvalId: "approval-1",
    channelAccountId: "channel-1",
    channel: "instagram",
    accountRef: "account",
    contentType: "carousel",
    scheduledFor: "2026-08-24T09:00:00.000Z",
    status: "scheduled",
    attemptCount: 0,
    createdAt: "2026-08-23T09:00:00.000Z",
    ...overrides,
  };
}

describe("VS-85 Home intelligence", () => {
  it("keeps Home Continue inside the approved Content surface", () => {
    const campaign: CampaignView = {
      id: "campaign-1", workspaceId: "workspace-1", brandId: "brand-1", ideaId: "idea-1",
      researchId: "research-1", angleId: "angle-1", name: "Draft campaign", objective: "Educate",
      supportingClaimIds: [], status: "draft", createdAt: "2026-08-23T09:00:00.000Z",
    };
    const idea: IdeaSummary = {
      id: "idea-1", workspaceId: "workspace-1", brandId: "brand-1", title: "Draft idea", premise: "Premise",
      source: { type: "user" }, status: "new", createdAt: "2026-08-23T08:00:00.000Z",
    };
    const items = buildContinue("brand-1", [campaign], [idea]);
    expect(items[0]?.href).toBe("/brands/brand-1/content");
    expect(items[0]?.href).not.toContain("/campaigns/");
  });

  it("recommends a format before creation using the actual idea", () => {
    const result = recommendMyIdea({
      text: "Compare three lightweight wheel options and explain the handling tradeoffs, price differences and who each one is for.",
    });
    expect(result.format).toBe("carousel");
    expect(result.goal).toBe("Build authority");
    expect(result.reason.length).toBeGreaterThan(10);
  });

  it("does not mistake price comparison for sales intent", () => {
    const result = recommendMyIdea({
      text: "Explain why these two suspension kits cost different amounts and compare the tradeoffs for daily riders.",
    });
    expect(result.goal).toBe("Build authority");
  });

  it("still recognises explicit commercial and lead intent", () => {
    expect(recommendMyIdea({ text: "Limited time launch offer: buy the new service package today." }).goal).toBe("Promote an offer");
    expect(recommendMyIdea({ text: "Explain the migration approach and invite teams to book a call for a consultation." }).goal).toBe("Generate leads");
  });

  it("lets accepted Brand learning influence format ranking without becoming the only signal", () => {
    const result = recommendMyIdea({
      text: "A short technical note about suspension setup",
      learnings: [learning()],
    });
    expect(result.format).toBe("carousel");
  });

  it("prefers Reel for demonstrative motion cues", () => {
    const result = recommendMyIdea({
      text: "Show how the bike reacts before and after the suspension change in a riding demo video.",
    });
    expect(result.format).toBe("reel");
  });

  it("ranks For You and suppresses ignored filler", () => {
    const items = buildForYou([
      opportunity("weak", 30),
      opportunity("ignored", 99, "ignored"),
      opportunity("best", 92),
      opportunity("second", 80),
      opportunity("third", 70),
      opportunity("fourth", 60),
      opportunity("fifth", 50),
    ]);
    expect(items.map((item) => item.id)).toEqual(["best", "second", "third", "fourth", "fifth", "weak"]);
    expect(items[0]?.format).toBe("carousel");
  });

  it("prioritises failed publishing ahead of scheduled items in Up Next", () => {
    const items = buildUpNext(
      [
        command({ id: "scheduled", campaignId: "campaign-1" }),
        command({ id: "failed", campaignId: "campaign-2", status: "failed", scheduledFor: "2026-08-23T08:00:00.000Z" }),
      ],
      new Map([
        ["campaign-1", "Tomorrow post"],
        ["campaign-2", "Failed post"],
      ]),
      Date.parse("2026-08-23T12:00:00.000Z"),
    );
    expect(items[0]?.id).toBe("failed");
    expect(items[0]?.state).toBe("Needs attention");
    expect(items[0]?.actionLabel).toBe("Fix");
  });

  it("shows only real available performance metrics and an accepted learning", () => {
    const metrics: PerformanceMetricView[] = [
      {
        id: "metric-1", workspaceId: "workspace-1", brandId: "brand-1", publishedPostId: "post-1", name: "reach",
        capturedAt: "2026-08-23T10:00:00.000Z", status: "available", value: 1200,
        sourceSnapshotId: "snapshot-1", sourceField: "reach", transformationVersion: "1",
      },
      {
        id: "metric-2", workspaceId: "workspace-1", brandId: "brand-1", publishedPostId: "post-1", name: "saves",
        capturedAt: "2026-08-23T10:00:00.000Z", status: "unavailable", reason: "not supported",
        sourceSnapshotId: "snapshot-1", sourceField: "saves", transformationVersion: "1",
      },
    ];
    const view = buildWhatsWorking(metrics, [learning()]);
    expect(view.kpis).toEqual([{ name: "Reach", value: 1200, capturedAt: "2026-08-23T10:00:00.000Z" }]);
    expect(view.learning?.statement).toContain("Carousels");
  });
});
