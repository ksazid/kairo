import type { BrandOpportunityDto, BrandNotificationDto } from "@kairo/contracts";
import type {
  CampaignView,
  IdeaSummary,
  LearningView,
  PerformanceMetricView,
  PublishCommandView,
} from "./kairo-api";

export type HomeCreationFormat = "carousel" | "reel" | "image";
export type HomeCreationGoal =
  | "Grow audience"
  | "Build authority"
  | "Generate leads"
  | "Build community"
  | "Promote an offer";

export interface MyIdeaRecommendation {
  goal: HomeCreationGoal;
  format: HomeCreationFormat;
  reason: string;
  choices: HomeCreationFormat[];
}

export interface HomeAttentionItem {
  id: string;
  title: string;
  detail: string;
  actionLabel: "Connect" | "Review" | "Fix" | "Retry";
  href: string;
  priority: number;
}

export interface HomeForYouItem {
  id: string;
  title: string;
  reason: string;
  direction: string;
  format?: HomeCreationFormat;
  strength: number;
}

export interface HomeUpNextItem {
  id: string;
  campaignId: string;
  title: string;
  channel: string;
  scheduledFor: string;
  state: "Scheduled" | "Published" | "Needs attention" | "In progress";
  actionLabel: "View" | "Fix";
}

export interface HomeKpi {
  name: string;
  value: number;
  capturedAt: string;
}

export interface HomeWorkingView {
  kpis: HomeKpi[];
  learning?: {
    statement: string;
    interpretation: string;
    confidence: number;
    format?: HomeCreationFormat;
  };
}

export interface HomeContinueItem {
  id: string;
  kind: "campaign" | "idea";
  title: string;
  context: string;
  href: string;
  actionLabel: "Continue" | "View";
  occurredAt: string;
}

export function recommendMyIdea(input: {
  text: string;
  source?: string;
  learnings?: LearningView[];
}): MyIdeaRecommendation {
  const text = `${input.text ?? ""} ${input.source ?? ""}`.trim().toLowerCase();
  const scores: Record<HomeCreationFormat, number> = {
    carousel: 1,
    reel: 0,
    image: 0,
  };
  const reasons: Record<HomeCreationFormat, string[]> = {
    carousel: [],
    reel: [],
    image: [],
  };

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 45) {
    scores.carousel += 3;
    reasons.carousel.push("your idea has enough detail to break into a clear sequence");
  } else if (wordCount >= 20) {
    scores.carousel += 2;
    reasons.carousel.push("the idea benefits from a few structured points");
  } else if (wordCount > 0 && wordCount <= 12) {
    scores.image += 1;
    reasons.image.push("the idea is concise enough for a focused post");
  }

  addCue(text, /\b(compare|comparison|versus|vs\.?|steps?|tips?|mistakes?|reasons?|list|guide|breakdown|explai?n|myths?|things to know|before you)\b/i, scores, reasons, "carousel", 3, "the idea is naturally structured as multiple points");
  addCue(text, /\b(watch|demo|demonstrate|ride|reaction|before and after|behind the scenes|motion|sound|voiceover|show how|walkthrough|reel|video)\b/i, scores, reasons, "reel", 4, "the idea is easier to understand through motion or demonstration");
  addCue(text, /\b(announcement|launch|quote|poster|single image|photo|visual|showcase|hero image)\b/i, scores, reasons, "image", 3, "one strong visual can carry the message");

  if (input.source?.trim()) {
    scores.carousel += 2;
    reasons.carousel.push("the source can be distilled into useful takeaways");
  }

  for (const learning of input.learnings ?? []) {
    if (learning.status !== "accepted" || learning.confidence < 0.55) continue;
    const learnedFormat = normaliseFormat(
      learning.applicability.format ??
        learning.patterns.find((pattern) => pattern.dimension === "format")?.value,
    );
    if (!learnedFormat) continue;
    const weight = learning.confidence >= 0.8 ? 3 : 2;
    scores[learnedFormat] += weight;
    reasons[learnedFormat].push("similar formats have worked for this Brand");
  }

  const format = (Object.entries(scores) as Array<[HomeCreationFormat, number]>)
    .sort((a, b) => b[1] - a[1] || formatOrder(a[0]) - formatOrder(b[0]))[0]![0];
  const reason = reasons[format][0] ?? defaultReason(format);

  return {
    goal: inferGoal(text),
    format,
    reason: capitalise(reason),
    choices: ["carousel", "reel", "image"],
  };
}

export function buildAttentionItems(input: {
  brandId: string;
  notifications?: BrandNotificationDto[];
  hasConnectedChannel: boolean;
}): HomeAttentionItem[] {
  const base = `/brands/${encodeURIComponent(input.brandId)}`;
  const items: HomeAttentionItem[] = [];

  for (const notification of input.notifications ?? []) {
    if (notification.kind === "publishing-failed") {
      items.push({
        id: notification.id,
        title: "Publishing needs attention",
        detail: notification.context.failureReason ?? "Kairo could not finish a publish.",
        actionLabel: "Retry",
        href: `${base}/calendar`,
        priority: 100,
      });
      continue;
    }
    if (notification.kind === "connection-reconnect-required") {
      items.push({
        id: notification.id,
        title: "Reconnect your channel",
        detail: "Kairo needs the channel connection before it can continue publishing and measuring.",
        actionLabel: "Fix",
        href: `${base}/brain#source-heading`,
        priority: 90,
      });
      continue;
    }
    if (notification.kind === "approval-required") {
      items.push({
        id: notification.id,
        title: "Content is ready for you",
        detail: "A finished item is waiting for your review.",
        actionLabel: "Review",
        href: notification.context.campaignId
          ? `${base}/campaigns/${encodeURIComponent(notification.context.campaignId)}`
          : `${base}/campaigns`,
        priority: 80,
      });
    }
  }

  if (!input.hasConnectedChannel) {
    items.push({
      id: `connect-channel:${input.brandId}`,
      title: "Connect a channel",
      detail: "Connect a publishing channel so Kairo can publish approved content and learn from performance.",
      actionLabel: "Connect",
      href: `${base}/brain#source-heading`,
      priority: 70,
    });
  }

  return items.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

export function buildForYou(opportunities: BrandOpportunityDto[]): HomeForYouItem[] {
  return opportunities
    .filter((item) => item.status !== "ignored")
    .sort((a, b) => b.scores.overall - a.scores.overall || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      title: item.title,
      reason: item.rationale || item.whyNow,
      direction: item.developmentDirection,
      format: inferFormatFromText(`${item.title} ${item.developmentDirection}`),
      strength: item.scores.overall,
    }));
}

export function buildUpNext(
  commands: PublishCommandView[],
  campaignNames: Map<string, string>,
  now = Date.now(),
): HomeUpNextItem[] {
  const useful = commands
    .filter((command) => !["cancelled", "unknown"].includes(command.status))
    .filter((command) => {
      if (command.status !== "published") return true;
      const when = Date.parse(command.scheduledFor);
      return Number.isFinite(when) && now - when <= 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => upNextRank(a, now) - upNextRank(b, now) || a.scheduledFor.localeCompare(b.scheduledFor))
    .slice(0, 3);

  return useful.map((command) => ({
    id: command.id,
    campaignId: command.campaignId,
    title: campaignNames.get(command.campaignId) ?? "Upcoming content",
    channel: titleCase(command.channel),
    scheduledFor: command.scheduledFor,
    state: mapPublishState(command.status),
    actionLabel: ["failed", "manual-required"].includes(command.status) ? "Fix" : "View",
  }));
}

export function buildWhatsWorking(
  metrics: PerformanceMetricView[],
  learnings: LearningView[],
): HomeWorkingView {
  const latestByName = new Map<string, PerformanceMetricView>();
  for (const metric of metrics) {
    if (metric.status !== "available" || typeof metric.value !== "number") continue;
    const previous = latestByName.get(metric.name);
    if (!previous || previous.capturedAt < metric.capturedAt) latestByName.set(metric.name, metric);
  }

  const preferredMetricNames = ["reach", "saves", "shares", "engagement", "views", "impressions"];
  const kpis = [...latestByName.values()]
    .sort((a, b) => {
      const ai = preferredMetricNames.indexOf(a.name.toLowerCase());
      const bi = preferredMetricNames.indexOf(b.name.toLowerCase());
      const ar = ai === -1 ? 999 : ai;
      const br = bi === -1 ? 999 : bi;
      return ar - br || b.capturedAt.localeCompare(a.capturedAt);
    })
    .slice(0, 3)
    .map((metric) => ({ name: friendlyMetric(metric.name), value: metric.value!, capturedAt: metric.capturedAt }));

  const accepted = learnings
    .filter((learning) => learning.status === "accepted")
    .sort((a, b) => b.confidence - a.confidence || b.createdAt.localeCompare(a.createdAt))[0];

  return {
    kpis,
    ...(accepted
      ? {
          learning: {
            statement: accepted.statement,
            interpretation: accepted.interpretation,
            confidence: accepted.confidence,
            format: normaliseFormat(
              accepted.applicability.format ??
                accepted.patterns.find((pattern) => pattern.dimension === "format")?.value,
            ),
          },
        }
      : {}),
  };
}

export function buildContinue(
  brandId: string,
  campaigns: CampaignView[],
  ideas: IdeaSummary[],
): HomeContinueItem[] {
  const base = `/brands/${encodeURIComponent(brandId)}`;
  const campaignIdeaIds = new Set(campaigns.map((campaign) => campaign.ideaId));
  const items: HomeContinueItem[] = [
    ...campaigns.map((campaign) => ({
      id: campaign.id,
      kind: "campaign" as const,
      title: campaign.name,
      context: "Draft content in progress",
      href: `${base}/campaigns/${encodeURIComponent(campaign.id)}`,
      actionLabel: "Continue" as const,
      occurredAt: campaign.createdAt,
    })),
    ...ideas
      .filter((idea) => !campaignIdeaIds.has(idea.id))
      .filter((idea) => idea.status !== "new" || Date.now() - Date.parse(idea.createdAt) < 30 * 24 * 60 * 60 * 1000)
      .map((idea) => ({
        id: idea.id,
        kind: "idea" as const,
        title: idea.title,
        context: idea.status === "angles-ready" ? "Direction ready" : idea.status === "research-ready" ? "Research ready" : "Idea in progress",
        href: `${base}/ideas/${encodeURIComponent(idea.id)}`,
        actionLabel: "Continue" as const,
        occurredAt: idea.createdAt,
      })),
  ];

  return items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 3);
}

function inferGoal(text: string): HomeCreationGoal {
  const scores: Record<HomeCreationGoal, number> = {
    "Grow audience": 1,
    "Build authority": 0,
    "Generate leads": 0,
    "Build community": 0,
    "Promote an offer": 0,
  };

  if (/\b(buy|sale|sell|offer|discount|launch|shop|order|purchase|book now|limited time)\b/i.test(text)) scores["Promote an offer"] += 5;
  if (/\b(product|service)\b/i.test(text)) scores["Promote an offer"] += 1;
  if (/\b(price|pricing|cost)\b/i.test(text)) scores["Promote an offer"] += 1;
  if (/\b(lead|leads|book a call|contact|enquir\w*|inquir\w*|sign up|consultation|request a demo|get a quote)\b/i.test(text)) scores["Generate leads"] += 5;
  if (/\b(comment|community|discuss|conversation|question|poll|share your|tell me)\b/i.test(text)) scores["Build community"] += 4;
  if (/\b(explain|teach|guide|how to|why|breakdown|expert|technical|learn)\b/i.test(text)) scores["Build authority"] += 3;
  if (/\b(compare|comparison|tradeoffs?|pros and cons|versus|vs\.?)\b/i.test(text)) scores["Build authority"] += 2;

  const order: HomeCreationGoal[] = [
    "Generate leads",
    "Promote an offer",
    "Build community",
    "Build authority",
    "Grow audience",
  ];
  return order.sort((a, b) => scores[b] - scores[a])[0]!;
}

function inferFormatFromText(value: string): HomeCreationFormat | undefined {
  const text = value.toLowerCase();
  if (/\b(reel|video|voiceover|motion|demo)\b/.test(text)) return "reel";
  if (/\b(carousel|slides?|listicle|comparison|steps?|breakdown)\b/.test(text)) return "carousel";
  if (/\b(image|photo|poster|graphic|post)\b/.test(text)) return "image";
  return undefined;
}

function normaliseFormat(value?: string): HomeCreationFormat | undefined {
  if (!value) return undefined;
  const text = value.toLowerCase();
  if (text.includes("carousel")) return "carousel";
  if (text.includes("reel") || text.includes("video")) return "reel";
  if (text.includes("image") || text.includes("photo") || text === "post") return "image";
  return undefined;
}

function addCue(
  text: string,
  pattern: RegExp,
  scores: Record<HomeCreationFormat, number>,
  reasons: Record<HomeCreationFormat, string[]>,
  format: HomeCreationFormat,
  weight: number,
  reason: string,
) {
  if (!pattern.test(text)) return;
  scores[format] += weight;
  reasons[format].push(reason);
}

function formatOrder(format: HomeCreationFormat) {
  return format === "carousel" ? 0 : format === "reel" ? 1 : 2;
}

function defaultReason(format: HomeCreationFormat) {
  if (format === "reel") return "motion will make the idea easier to absorb";
  if (format === "image") return "a focused visual post fits the idea";
  return "a structured carousel gives the idea enough room without overcomplicating it";
}

function capitalise(value: string) {
  return value ? `${value[0]!.toUpperCase()}${value.slice(1)}` : value;
}

function upNextRank(command: PublishCommandView, now: number) {
  if (["failed", "manual-required"].includes(command.status)) return 0;
  const when = Date.parse(command.scheduledFor);
  if (command.status === "published") return 3;
  if (Number.isFinite(when) && when >= now) return 1;
  return 2;
}

function mapPublishState(status: PublishCommandView["status"]): HomeUpNextItem["state"] {
  if (status === "scheduled") return "Scheduled";
  if (status === "published") return "Published";
  if (status === "failed" || status === "manual-required") return "Needs attention";
  return "In progress";
}

function friendlyMetric(name: string) {
  return name
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function titleCase(value: string) {
  return value.replace(/(^|[-_\s])\w/g, (match) => match.toUpperCase()).replace(/[-_]/g, " ");
}