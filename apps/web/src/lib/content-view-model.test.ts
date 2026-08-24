import { describe, expect, it } from "vitest";
import type {
  CampaignDetailView,
  ContentReviewStatusView,
  PublishCommandView,
} from "./kairo-api";
import { buildContentList, contentFilterLabel, isContentFilter } from "./content-view-model";

function detail(assetId: string, topic: string): CampaignDetailView {
  return {
    campaign: {
      id: `campaign-${assetId}`,
      workspaceId: "workspace-1",
      brandId: "brand-1",
      ideaId: "idea-1",
      researchId: "research-1",
      angleId: "angle-1",
      name: "Internal campaign",
      objective: "Explain something useful",
      supportingClaimIds: [],
      status: "draft",
      createdAt: "2026-08-24T10:00:00.000Z",
    },
    assets: [{
      asset: {
        id: assetId,
        campaignId: `campaign-${assetId}`,
        channel: "instagram",
        format: "carousel",
        audience: "builders",
        topic,
        hookType: "question",
        cta: "Save this",
        currentVersion: 1,
        status: "draft",
        createdAt: "2026-08-24T10:00:00.000Z",
      },
      versions: [{
        id: `version-${assetId}`,
        assetId,
        version: 1,
        parentVersionId: null,
        content: "Exact approved copy",
        supportingClaimIds: [],
        actor: "ai",
        action: "draft",
        createdAt: "2026-08-24T10:01:00.000Z",
      }],
    }],
  };
}

function status(value: Partial<ContentReviewStatusView>): ContentReviewStatusView {
  return { review: null, approval: null, ...value };
}

function command(assetId: string, state: PublishCommandView["status"]): PublishCommandView {
  return {
    id: `command-${assetId}`,
    workspaceId: "workspace-1",
    brandId: "brand-1",
    campaignId: `campaign-${assetId}`,
    assetId,
    versionId: `version-${assetId}`,
    version: 1,
    approvalId: `approval-${assetId}`,
    channelAccountId: "account-1",
    channel: "instagram",
    accountRef: "ig-1",
    contentType: "carousel",
    scheduledFor: "2026-08-25T10:00:00.000Z",
    status: state,
    attemptCount: 0,
    createdAt: "2026-08-24T12:00:00.000Z",
  };
}

describe("Content list state model", () => {
  it("maps exact review, approval and publish states into approved user-facing buckets", () => {
    const details = [
      detail("draft", "Draft topic"),
      detail("approve", "Approval topic"),
      detail("ready", "Ready topic"),
      detail("scheduled", "Scheduled topic"),
      detail("published", "Published topic"),
      detail("failed", "Failed topic"),
    ];
    const reviews = new Map<string, ContentReviewStatusView | null>([
      ["draft", status({})],
      ["approve", status({ review: { id:"r1", versionId:"version-approve", version:1, status:"passed", revisionCycle:0, requestedAt:"2026-08-24T10:00:00.000Z", truth:{passed:true,findings:[]}, critic:{passed:true,score:90,findings:[]} } })],
      ["ready", status({ approval: { id:"a1", versionId:"version-ready", version:1, reviewId:"r1", approverAccountId:"user-1", destination:{channel:"instagram",accountRef:"ig-1"}, approvedAt:"2026-08-24T11:00:00.000Z" } })],
      ["scheduled", status({ approval: { id:"a2", versionId:"version-scheduled", version:1, reviewId:"r2", approverAccountId:"user-1", destination:{channel:"instagram",accountRef:"ig-1"}, approvedAt:"2026-08-24T11:00:00.000Z" } })],
      ["published", status({ approval: { id:"a3", versionId:"version-published", version:1, reviewId:"r3", approverAccountId:"user-1", destination:{channel:"instagram",accountRef:"ig-1"}, approvedAt:"2026-08-24T11:00:00.000Z" } })],
      ["failed", status({ approval: { id:"a4", versionId:"version-failed", version:1, reviewId:"r4", approverAccountId:"user-1", destination:{channel:"instagram",accountRef:"ig-1"}, approvedAt:"2026-08-24T11:00:00.000Z" } })],
    ]);
    const result = buildContentList(details, reviews, [
      command("scheduled", "scheduled"),
      command("published", "published"),
      command("failed", "failed"),
    ]);

    const byId = new Map(result.items.map((item) => [item.assetId, item]));
    expect(byId.get("draft")?.bucket).toBe("needs-you");
    expect(byId.get("draft")?.actionLabel).toBe("Continue");
    expect(byId.get("approve")?.statusLabel).toBe("Ready for approval");
    expect(byId.get("ready")?.bucket).toBe("ready");
    expect(byId.get("ready")?.actionLabel).toBe("Publish");
    expect(byId.get("scheduled")?.bucket).toBe("scheduled");
    expect(byId.get("published")?.actionLabel).toBe("See results");
    expect(byId.get("failed")?.attention).toBe(true);
    expect(result.counts).toEqual({ all: 6, "needs-you": 3, ready: 1, scheduled: 1, published: 1 });
  });

  it("does not reuse approval or publishing state from an older immutable version", () => {
    const edited = detail("edited", "Edited topic");
    edited.assets[0]!.asset.currentVersion = 2;
    edited.assets[0]!.versions.push({
      id: "version-edited-v2",
      assetId: "edited",
      version: 2,
      parentVersionId: "version-edited",
      content: "New unapproved copy",
      supportingClaimIds: [],
      actor: "user",
      action: "edit",
      createdAt: "2026-08-24T12:30:00.000Z",
    });
    const staleApproval = status({
      approval: {
        id: "old-approval",
        versionId: "version-edited",
        version: 1,
        reviewId: "old-review",
        approverAccountId: "user-1",
        destination: { channel: "instagram", accountRef: "ig-1" },
        approvedAt: "2026-08-24T11:00:00.000Z",
      },
    });

    const result = buildContentList(
      [edited],
      new Map([["edited", staleApproval]]),
      [command("edited", "published")],
    );

    expect(result.items[0]?.version).toBe(2);
    expect(result.items[0]?.bucket).toBe("needs-you");
    expect(result.items[0]?.statusLabel).toBe("Draft");
    expect(result.items[0]?.actionLabel).toBe("Continue");
  });

  it("keeps filter labels and validation deterministic", () => {
    expect(contentFilterLabel("needs-you")).toBe("Needs you");
    expect(contentFilterLabel("published")).toBe("Published");
    expect(isContentFilter("ready")).toBe(true);
    expect(isContentFilter("campaigns")).toBe(false);
  });
});
