import type {
  CampaignDetailView,
  ContentReviewStatusView,
  PublishCommandView,
} from "./kairo-api";

export const CONTENT_FILTERS = ["all", "needs-you", "ready", "scheduled", "published"] as const;
export type ContentFilter = (typeof CONTENT_FILTERS)[number];
export type ContentBucket = Exclude<ContentFilter, "all">;

export interface ContentListItem {
  assetId: string;
  campaignId: string;
  title: string;
  channel: string;
  format: string;
  version: number;
  bucket: ContentBucket;
  statusLabel: string;
  actionLabel: "Continue" | "Review" | "Publish" | "View" | "See results";
  attention: boolean;
  updatedAt: string;
}

export interface ContentListSummary {
  items: ContentListItem[];
  counts: Record<ContentFilter, number>;
}

function latestCommandFor(assetId: string, currentVersionId: string | undefined, commands: PublishCommandView[]) {
  return commands
    .filter((command) => command.assetId === assetId && (!currentVersionId || command.versionId === currentVersionId))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ?? null;
}

function currentReviewStatus(
  currentVersionId: string | undefined,
  status: ContentReviewStatusView | null,
): ContentReviewStatusView | null {
  if (!status || !currentVersionId) return status;
  return {
    review: status.review?.versionId === currentVersionId ? status.review : null,
    approval: status.approval?.versionId === currentVersionId ? status.approval : null,
  };
}

function stateFor(
  reviewStatus: ContentReviewStatusView | null,
  command: PublishCommandView | null,
): Pick<ContentListItem, "bucket" | "statusLabel" | "actionLabel" | "attention"> {
  if (command?.status === "published") {
    return { bucket: "published", statusLabel: "Published", actionLabel: "See results", attention: false };
  }
  if (command?.status === "failed" || command?.status === "manual-required") {
    return {
      bucket: "needs-you",
      statusLabel: command.status === "failed" ? "Publish failed" : "Needs manual publish",
      actionLabel: "Review",
      attention: true,
    };
  }
  if (command?.status === "dispatching") {
    return { bucket: "scheduled", statusLabel: "Publishing", actionLabel: "View", attention: false };
  }
  if (command?.status === "unknown") {
    return { bucket: "scheduled", statusLabel: "Processing", actionLabel: "View", attention: false };
  }
  if (command?.status === "scheduled") {
    return { bucket: "scheduled", statusLabel: "Scheduled", actionLabel: "View", attention: false };
  }
  if (reviewStatus?.approval) {
    return { bucket: "ready", statusLabel: "Ready to publish", actionLabel: "Publish", attention: false };
  }
  if (reviewStatus?.review?.status === "passed") {
    return { bucket: "needs-you", statusLabel: "Ready for approval", actionLabel: "Review", attention: true };
  }
  if (reviewStatus?.review?.status === "revision-required") {
    return { bucket: "needs-you", statusLabel: "Revision required", actionLabel: "Review", attention: true };
  }
  return { bucket: "needs-you", statusLabel: "Draft", actionLabel: "Continue", attention: false };
}

export function buildContentList(
  details: CampaignDetailView[],
  reviewStatuses: Map<string, ContentReviewStatusView | null>,
  commands: PublishCommandView[],
): ContentListSummary {
  const items = details.flatMap((detail) =>
    detail.assets.map(({ asset, versions }) => {
      const current = versions.at(-1);
      const status = currentReviewStatus(current?.id, reviewStatuses.get(asset.id) ?? null);
      const command = latestCommandFor(asset.id, current?.id, commands);
      const state = stateFor(status, command);
      return {
        assetId: asset.id,
        campaignId: detail.campaign.id,
        title: asset.topic,
        channel: asset.channel,
        format: asset.format,
        version: current?.version ?? asset.currentVersion,
        updatedAt: command?.createdAt ?? current?.createdAt ?? asset.createdAt,
        ...state,
      } satisfies ContentListItem;
    }),
  ).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  const counts: Record<ContentFilter, number> = {
    all: items.length,
    "needs-you": 0,
    ready: 0,
    scheduled: 0,
    published: 0,
  };
  for (const item of items) counts[item.bucket] += 1;
  return { items, counts };
}

export function contentFilterLabel(filter: ContentFilter) {
  if (filter === "needs-you") return "Needs you";
  return filter.charAt(0).toUpperCase() + filter.slice(1);
}

export function isContentFilter(value: string | undefined): value is ContentFilter {
  return CONTENT_FILTERS.includes(value as ContentFilter);
}
