import { randomUUID } from "node:crypto";
import type { KairoRepository } from "./index";
import { ConcurrencyConflictError, DomainValidationError, ResourceNotFoundError } from "./index";
import type { CampaignRepository } from "./campaign-service";
import { ReviewService, type ReviewRepository } from "./review-service";
import {
  applyPublishAttempt,
  beginPublishAttempt,
  cancelPublishCommand,
  connectChannelAccount,
  createPublishCommand,
  createPublishedPost,
  reconcilePublishAttempt,
  retryPublishCommand,
  type ChannelAccount,
  type PublishAttempt,
  type PublishCapability,
  type PublishChannel,
  type PublishCommand,
  type PublishContentType,
  type PublishMediaItem,
  type PublishOptions,
  type PublishedPost,
} from "./publishing";

export interface PublishingRepository {
  saveChannelAccount(accountId: string, channel: ChannelAccount): Promise<ChannelAccount>;
  getChannelAccount(accountId: string, brandId: string, id: string): Promise<ChannelAccount | null>;
  listChannelAccounts(accountId: string, brandId: string): Promise<ChannelAccount[]>;
  saveCommand(accountId: string, command: PublishCommand): Promise<PublishCommand>;
  getCommand(accountId: string, brandId: string, id: string): Promise<PublishCommand | null>;
  getCommandByApproval(accountId: string, brandId: string, approvalId: string): Promise<PublishCommand | null>;
  listCommands(accountId: string, brandId: string, from?: string, to?: string): Promise<PublishCommand[]>;
  cancelCommand(accountId: string, brandId: string, id: string): Promise<PublishCommand>;
  recordDispatch(accountId: string, command: PublishCommand, attempt: PublishAttempt): Promise<PublishAttempt>;
  getLatestAttempt(accountId: string, brandId: string, commandId: string): Promise<PublishAttempt | null>;
  recordOutcome(accountId: string, command: PublishCommand, attempt: PublishAttempt, post?: PublishedPost): Promise<PublishCommand>;
}

export class PublishingService {
  constructor(
    private core: KairoRepository,
    private campaigns: CampaignRepository,
    private reviews: ReviewRepository,
    private publishing: PublishingRepository,
    private now: () => Date = () => new Date(),
  ) {}

  async connect(
    accountId: string,
    brandId: string,
    input: { channel: PublishChannel; accountRef: string; displayName: string; credentialRef: string; capabilities: PublishCapability[] },
  ) {
    const brand = await this.core.getBrandForAccount(accountId, brandId);
    if (!brand) throw new ResourceNotFoundError("Brand not found");
    return this.publishing.saveChannelAccount(
      accountId,
      connectChannelAccount({ id: randomUUID(), workspaceId: brand.workspaceId, brandId, connectedAt: this.now().toISOString(), ...input }),
    );
  }

  accounts(accountId: string, brandId: string) {
    return this.publishing.listChannelAccounts(accountId, brandId);
  }

  async account(accountId: string, brandId: string, channelAccountId: string) {
    const channel = await this.publishing.getChannelAccount(accountId, brandId, channelAccountId);
    if (!channel) throw new ResourceNotFoundError("Channel Account not found");
    return channel;
  }

  async schedule(
    accountId: string,
    brandId: string,
    campaignId: string,
    assetId: string,
    input: { channelAccountId: string; contentType: PublishContentType; mediaItems?: PublishMediaItem[]; options?: PublishOptions; scheduledFor: string },
  ) {
    const detail = await this.campaigns.getCampaign(accountId, brandId, campaignId);
    if (!detail) throw new ResourceNotFoundError("Campaign not found");
    const entry = detail.assets.find((x) => x.asset.id === assetId);
    if (!entry) throw new ResourceNotFoundError("Content Asset not found");
    const version = entry.versions.at(-1);
    if (!version) throw new ResourceNotFoundError("Content Version not found");
    const channel = await this.account(accountId, brandId, input.channelAccountId);
    const approval = await this.reviews.getApprovalForDestination(accountId, brandId, assetId, {
      channel: channel.channel,
      accountRef: channel.accountRef,
    });
    if (!approval) throw new ResourceNotFoundError("Content Approval not found for destination");
    const existing = await this.publishing.getCommandByApproval(accountId, brandId, approval.id);
    if (existing) return existing;
    return this.publishing.saveCommand(
      accountId,
      createPublishCommand({
        id: randomUUID(),
        approval,
        currentVersionId: version.id,
        channelAccount: channel,
        contentType: input.contentType,
        mediaItems: input.mediaItems,
        options: input.options,
        scheduledFor: input.scheduledFor,
        createdAt: this.now().toISOString(),
      }),
    );
  }

  calendar(accountId: string, brandId: string, from?: string, to?: string) {
    return this.publishing.listCommands(accountId, brandId, from, to);
  }

  async begin(accountId: string, brandId: string, commandId: string) {
    const command = await this.requireCommand(accountId, brandId, commandId);
    const attempt = beginPublishAttempt({ id: randomUUID(), command, startedAt: this.now().toISOString() });
    return this.publishing.recordDispatch(accountId, applyPublishAttempt(command, attempt), attempt);
  }

  async reconcile(
    accountId: string,
    brandId: string,
    commandId: string,
    input: { outcome: "published" | "failed" | "unknown"; externalPostId?: string; providerCorrelationId?: string; failureCode?: string },
  ) {
    const command = await this.requireCommand(accountId, brandId, commandId);
    const current = await this.publishing.getLatestAttempt(accountId, brandId, commandId);
    if (!current) throw new ResourceNotFoundError("Publish Attempt not found");
    const attempt = reconcilePublishAttempt({ attempt: current, checkedAt: this.now().toISOString(), ...input });
    const completed = applyPublishAttempt(command, attempt);
    const post = completed.status === "published" ? createPublishedPost({ id: randomUUID(), command: completed, attempt }) : undefined;
    return this.publishing.recordOutcome(accountId, completed, attempt, post);
  }

  async retry(accountId: string, brandId: string, commandId: string) {
    const command = await this.requireCommand(accountId, brandId, commandId);
    return this.publishing.saveCommand(accountId, retryPublishCommand(command, this.now().toISOString()));
  }

  async cancel(accountId: string, brandId: string, commandId: string) {
    const command = await this.requireCommand(accountId, brandId, commandId);
    cancelPublishCommand(command);
    return this.publishing.cancelCommand(accountId, brandId, commandId);
  }

  private async requireCommand(accountId: string, brandId: string, id: string) {
    const command = await this.publishing.getCommand(accountId, brandId, id);
    if (!command) throw new ResourceNotFoundError("Publish Command not found");
    return command;
  }
}

export type DistributionDestinationInput = {
  assetId: string;
  expectedVersion: number;
  channelAccountId: string;
  contentType: PublishContentType;
  mediaItems?: PublishMediaItem[];
  options?: PublishOptions;
};

export type DistributionDestinationStatus = "scheduled" | "manual-required" | "unsupported" | "reconnect-required" | "rejected";

export type DistributionDestinationResult = {
  assetId: string;
  channelAccountId: string;
  status: DistributionDestinationStatus;
  channel?: PublishChannel;
  accountRef?: string;
  commandId?: string;
  reason?: string;
};

export type DistributionResult = {
  campaignId: string;
  scheduledFor: string;
  destinations: DistributionDestinationResult[];
};

export class PublishingGateway {
  constructor(private reviews: ReviewService, private publishing: PublishingService) {}

  async distribute(
    accountId: string,
    brandId: string,
    campaignId: string,
    input: { scheduledFor: string; destinations: DistributionDestinationInput[] },
  ): Promise<DistributionResult> {
    if (!input || typeof input !== "object") throw new DomainValidationError("distribution request is required");
    if (typeof input.scheduledFor !== "string" || Number.isNaN(Date.parse(input.scheduledFor))) {
      throw new DomainValidationError("scheduledFor must be a valid timestamp");
    }
    if (!Array.isArray(input.destinations) || input.destinations.length < 1 || input.destinations.length > 20) {
      throw new DomainValidationError("destinations must contain between 1 and 20 items");
    }

    const seen = new Set<string>();
    const destinations: DistributionDestinationResult[] = [];
    for (const destination of input.destinations) {
      const key = `${destination.assetId}:${destination.channelAccountId}`;
      if (seen.has(key)) {
        destinations.push({ assetId: destination.assetId, channelAccountId: destination.channelAccountId, status: "rejected", reason: "Duplicate destination" });
        continue;
      }
      seen.add(key);

      let channel: ChannelAccount;
      try {
        channel = await this.publishing.account(accountId, brandId, destination.channelAccountId);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          destinations.push({ assetId: destination.assetId, channelAccountId: destination.channelAccountId, status: "rejected", reason: "Destination unavailable" });
          continue;
        }
        throw error;
      }

      const safe = { assetId: destination.assetId, channelAccountId: destination.channelAccountId, channel: channel.channel, accountRef: channel.accountRef };
      if (channel.status === "reconnect-required") {
        destinations.push({ ...safe, status: "reconnect-required", reason: "Channel account must be reconnected" });
        continue;
      }
      if (channel.status === "disabled") {
        destinations.push({ ...safe, status: "rejected", reason: "Channel account is disabled" });
        continue;
      }
      if (channel.channel !== "manual" && !channel.capabilities.includes(capabilityFor(destination.contentType))) {
        destinations.push({ ...safe, status: "unsupported", reason: `${destination.contentType} is not supported by this destination` });
        continue;
      }

      try {
        await this.reviews.approve(accountId, brandId, campaignId, destination.assetId, {
          expectedVersion: destination.expectedVersion,
          destination: { channel: channel.channel, accountRef: channel.accountRef },
        });
        const command = await this.publishing.schedule(accountId, brandId, campaignId, destination.assetId, {
          channelAccountId: destination.channelAccountId,
          contentType: destination.contentType,
          mediaItems: destination.mediaItems,
          options: destination.options,
          scheduledFor: input.scheduledFor,
        });
        destinations.push({
          ...safe,
          status: command.status === "manual-required" ? "manual-required" : "scheduled",
          commandId: command.id,
        });
      } catch (error) {
        destinations.push({ ...safe, status: "rejected", reason: safeReason(error) });
      }
    }

    return { campaignId, scheduledFor: input.scheduledFor, destinations };
  }
}

function capabilityFor(contentType: PublishContentType): PublishCapability {
  return contentType === "reel" ? "publish-reel" : (`publish-${contentType}` as PublishCapability);
}

function safeReason(error: unknown): string {
  if (error instanceof ConcurrencyConflictError) return "Content version changed; review and approve again";
  if (error instanceof ResourceNotFoundError) return "Content, approval or destination is unavailable";
  if (error instanceof DomainValidationError) return error.message;
  throw error;
}
