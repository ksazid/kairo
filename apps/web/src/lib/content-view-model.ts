import type {
  CampaignDetailView,
  ContentReviewStatusView,
  PublishCommandView,
} from "./kairo-api";

export const CONTENT_FILTERS = ["all", "needs-you", "ready", "scheduled", "published", "drafts"] as const;
export type ContentFilter = (typeof CONTENT_FILTERS)[number];
export type ContentBucket = Exclude<ContentFilter, "all">;

export interface ContentListItem {
  assetId: string;
  campaignId: string;
  title: string;
  summary: string;
  channel: string;
  format: string;
  version: number;
  bucket: ContentBucket;
  statusLabel: string;
  detailLabel: string;
  actionLabel: "Continue" | "Review" | "Publish" | "View" | "See results";
  attention: boolean;
  updatedAt: string;
  updatedBy: "You" | "Kairo";
  scheduledFor?: string;
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
): Pick<ContentListItem, "bucket" | "statusLabel" | "detailLabel" | "actionLabel" | "attention" | "scheduledFor"> {
  if (command?.status === "published") {
    return { bucket: "published", statusLabel: "Published", detailLabel: "Live", actionLabel: "See results", attention: false };
  }
  if (command?.status === "failed" || command?.status === "manual-required") {
    return {
      bucket: "needs-you",
      statusLabel: "Needs you",
      detailLabel: "Fix details",
      actionLabel: "Review",
      attention: true,
    };
  }
  if (command?.status === "dispatching") {
    return { bucket: "scheduled", statusLabel: "Scheduled", detailLabel: "Publishing", actionLabel: "View", attention: false, scheduledFor: command.scheduledFor };
  }
  if (command?.status === "unknown") {
    return { bucket: "scheduled", statusLabel: "Scheduled", detailLabel: "Processing", actionLabel: "View", attention: false, scheduledFor: command.scheduledFor };
  }
  if (command?.status === "scheduled") {
    return { bucket: "scheduled", statusLabel: "Scheduled", detailLabel: "Scheduled", actionLabel: "View", attention: false, scheduledFor: command.scheduledFor };
  }
  if (reviewStatus?.approval) {
    return { bucket: "ready", statusLabel: "Ready", detailLabel: "Ready to publish", actionLabel: "Publish", attention: false };
  }
  if (reviewStatus?.review?.status === "passed") {
    return { bucket: "needs-you", statusLabel: "Needs you", detailLabel: "Review", actionLabel: "Review", attention: true };
  }
  if (reviewStatus?.review?.status === "revision-required") {
    return { bucket: "needs-you", statusLabel: "Needs you", detailLabel: "Fix details", actionLabel: "Review", attention: true };
  }
  return { bucket: "drafts", statusLabel: "Draft", detailLabel: "Continue", actionLabel: "Continue", attention: false };
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
        summary: summarizeContent(current?.content ?? detail.campaign.objective),
        channel: asset.channel,
        format: asset.format,
        version: current?.version ?? asset.currentVersion,
        updatedAt: command?.createdAt ?? current?.createdAt ?? asset.createdAt,
        updatedBy: current?.actor === "user" ? "You" : "Kairo",
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
    drafts: 0,
  };
  for (const item of items) counts[item.bucket] += 1;
  return { items, counts };
}

export function contentFilterLabel(filter: ContentFilter) {
  if (filter === "needs-you") return "Needs you";
  if (filter === "drafts") return "Drafts";
  return filter.charAt(0).toUpperCase() + filter.slice(1);
}

export function isContentFilter(value: string | undefined): value is ContentFilter {
  return CONTENT_FILTERS.includes(value as ContentFilter);
}

function summarizeContent(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return "Content details are not available yet.";
  const sentence = compact.match(/^(.{1,110}?[.!?])(?:\s|$)/)?.[1] ?? compact.slice(0, 110);
  return sentence.length < compact.length && !/[.!?]$/.test(sentence) ? `${sentence}…` : sentence;
}
