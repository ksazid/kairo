import { describe, expect, it } from "vitest";
import type { KairoRepository } from "./index";
import type { CampaignRepository } from "./campaign-service";
import type { ReviewRepository } from "./review-service";
import type { ChannelAccount, PublishAttempt, PublishCommand, PublishedPost } from "./publishing";
import { PublishingService, type PublishingRepository } from "./publishing-service";
import type { ContentApproval } from "./review";

const approval: ContentApproval = {
  id: "approval-1",
  reviewId: "review-1",
  approverAccountId: "human-1",
  workspaceId: "ws-1",
  brandId: "brand-1",
  campaignId: "campaign-1",
  assetId: "asset-1",
  versionId: "version-2",
  version: 2,
  destination: { channel: "linkedin", accountRef: "page-1" },
  approvedAt: "2026-08-13T10:00:00Z",
};

class Repo implements PublishingRepository {
  channels = new Map<string, ChannelAccount>();
  commands = new Map<string, PublishCommand>();
  attempts = new Map<string, PublishAttempt>();
  posts = new Map<string, PublishedPost>();

  async saveChannelAccount(_: string, value: ChannelAccount) {
    this.channels.set(value.id, value);
    return value;
  }
  async getChannelAccount(_: string, __: string, id: string) {
    return this.channels.get(id) ?? null;
  }
  async listChannelAccounts() {
    return [...this.channels.values()];
  }
  async saveCommand(_: string, value: PublishCommand) {
    this.commands.set(value.id, value);
    return value;
  }
  async getCommand(_: string, __: string, id: string) {
    return this.commands.get(id) ?? null;
  }
  async getCommandByApproval(_: string, __: string, approvalId: string) {
    return [...this.commands.values()].find((command) => command.approvalId === approvalId) ?? null;
  }
  async listCommands() {
    return [...this.commands.values()];
  }
  async cancelCommand(_: string, __: string, id: string) {
    const command = this.commands.get(id)!;
    const next = { ...command, status: "cancelled" as const };
    this.commands.set(id, next);
    return next;
  }
  async recordDispatch(_: string, command: PublishCommand, attempt: PublishAttempt) {
    this.commands.set(command.id, command);
    this.attempts.set(attempt.id, attempt);
    return attempt;
  }
  async getLatestAttempt(_: string, __: string, id: string) {
    return [...this.attempts.values()].find((attempt) => attempt.commandId === id) ?? null;
  }
  async recordOutcome(_: string, command: PublishCommand, attempt: PublishAttempt, post?: PublishedPost) {
    this.commands.set(command.id, command);
    this.attempts.set(attempt.id, attempt);
    if (post) this.posts.set(post.id, post);
    return command;
  }
}

describe("PublishingService", () => {
  it("schedules only approved current content and records successful dispatch", async () => {
    const repo = new Repo();
    const core = {
      getBrandForAccount: async () => ({ id: "brand-1", workspaceId: "ws-1", name: "Kairo", createdAt: "2026-08-13T00:00:00Z" }),
    } as unknown as KairoRepository;
    const campaigns = {
      getCampaign: async () => ({
        campaign: {
          id: "campaign-1",
          workspaceId: "ws-1",
          brandId: "brand-1",
          ideaId: "idea-1",
          researchId: "research-1",
          angleId: "angle-1",
          name: "Launch",
          objective: "Reach",
          supportingClaimIds: [],
          createdAt: "2026-08-13T00:00:00Z",
        },
        assets: [
          {
            asset: {
              id: "asset-1",
              workspaceId: "ws-1",
              brandId: "brand-1",
              campaignId: "campaign-1",
              channel: "linkedin",
              format: "post",
              audience: "buyers",
              topic: "launch",
              hookType: "fact",
              cta: "read",
              currentVersion: 2,
              createdAt: "2026-08-13T00:00:00Z",
            },
            versions: [
              {
                id: "version-2",
                workspaceId: "ws-1",
                brandId: "brand-1",
                campaignId: "campaign-1",
                assetId: "asset-1",
                version: 2,
                content: "Hello",
                supportingClaimIds: [],
                actor: "user",
                action: "manual-edit",
                createdAt: "2026-08-13T00:00:00Z",
              },
            ],
          },
        ],
      }),
    } as unknown as CampaignRepository;
    const reviews = {
      getApproval: async () => approval,
      getApprovalForDestination: async () => approval,
      listApprovals: async () => [approval],
    } as unknown as ReviewRepository;
    const service = new PublishingService(core, campaigns, reviews, repo, () => new Date("2026-08-14T10:00:00Z"));
    const account = await service.connect("human-1", "brand-1", {
      channel: "linkedin",
      accountRef: "page-1",
      displayName: "Kairo",
      credentialRef: "vault://1",
      capabilities: ["publish-text"],
    });
    const command = await service.schedule("human-1", "brand-1", "campaign-1", "asset-1", {
      channelAccountId: account.id,
      contentType: "text",
      scheduledFor: "2026-08-14T10:00:00Z",
    });
    const duplicate = await service.schedule("human-1", "brand-1", "campaign-1", "asset-1", {
      channelAccountId: account.id,
      contentType: "text",
      scheduledFor: "2026-08-14T10:00:00Z",
    });
    expect(duplicate.id).toBe(command.id);
    await service.begin("human-1", "brand-1", command.id);
    const completed = await service.reconcile("human-1", "brand-1", command.id, { outcome: "published", externalPostId: "urn:li:share:1" });
    expect(completed).toMatchObject({ status: "published", attemptCount: 1 });
    expect(repo.posts.size).toBe(1);
  });
});
