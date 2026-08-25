import type { BrandBrainFieldDto, BrandDto } from "@kairo/contracts";
import { DiscoveryService, type DiscoveryRepository } from "@kairo/domain/discovery-service";
import { projectBrandIntelligenceProfile } from "@kairo/domain/source-policy";
import { selectSectorIntelligencePack } from "@kairo/domain/sector-packs";
import { SourceRoutingToolGateway } from "@kairo/worker/discovery-provider";
import {
  BlueskyDiscoveryProvider,
  HackerNewsDiscoveryProvider,
  RssAtomDiscoveryProvider,
  YouTubeDiscoveryProvider,
  type RssFeedDefinition,
} from "@kairo/worker/public-discovery-adapters";
import { HunterOrchestrator, isHunterJudgmentOutput } from "@kairo/worker/hunter";
import type { HunterRunnerPort } from "./hunter-routes";

type HunterAgentRuntime = ConstructorParameters<typeof HunterOrchestrator>[1];

export const hunterOutputValidator = isHunterJudgmentOutput;

export function createHunterRunner(options: {
  discoveryStore: DiscoveryRepository;
  runtime: HunterAgentRuntime;
}): HunterRunnerPort {
  const discovery = new DiscoveryService(options.discoveryStore);
  const hunter = new HunterOrchestrator(createHunterToolGateway(), options.runtime, discovery);

  return {
    async run(input) {
      const profile = projectBrandIntelligenceProfile(input.brain);
      const sectorPack = selectSectorIntelligencePack(profile);
      return hunter.runForAuthorizedBrand({
        accountId: input.accountId,
        brand: {
          workspaceId: input.brand.workspaceId,
          brandId: input.brand.id,
          contextVersion: brandContextVersion(input.brand, input.brain),
          brandName: input.brand.name,
          ...(sectionText(input.brain, "positioning") ? { positioning: sectionText(input.brain, "positioning") } : {}),
          ...(sectionText(input.brain, "audience") ? { audience: sectionText(input.brain, "audience") } : {}),
          ...(sectionText(input.brain, "voice") ? { voice: sectionText(input.brain, "voice") } : {}),
          ...(sectionText(input.brain, "goals") ? { goals: sectionText(input.brain, "goals") } : {}),
          ...(sectionText(input.brain, "boundaries") ? { boundaries: sectionText(input.brain, "boundaries") } : {}),
        },
        ...(sectorPack
          ? { intelligenceProfile: profile }
          : { query: fallbackPublicQuery(input.brand, profile) }),
        maxEvidence: 8,
      });
    },
  };
}

function createHunterToolGateway() {
  const feeds = discoveryRssFeeds();
  const rss = new RssAtomDiscoveryProvider({ feeds });
  const hackerNews = new HackerNewsDiscoveryProvider();
  const bluesky = new BlueskyDiscoveryProvider();
  const youtubeKey = process.env.YOUTUBE_API_KEY?.trim();
  const youtube = youtubeKey ? new YouTubeDiscoveryProvider({ apiKey: youtubeKey }) : undefined;
  const fallbackProviders = [
    ...(feeds.length ? [rss] : []),
    hackerNews,
    bluesky,
    ...(youtube ? [youtube] : []),
  ];

  const fallback = {
    async discover(request: Parameters<HackerNewsDiscoveryProvider["discover"]>[0]) {
      const settled = await Promise.allSettled(fallbackProviders.map((provider) => provider.discover(request)));
      const evidence = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
      const unique = [...new Map(evidence.map((item) => [canonicalUrl(item.sourceUrl), item])).values()]
        .slice(0, request.maxResults);
      if (unique.length) return unique;
      if (settled.some((result) => result.status === "fulfilled")) return [];
      const failed = settled.find((result) => result.status === "rejected");
      if (failed?.status === "rejected") throw failed.reason;
      return [];
    },
  };

  return new SourceRoutingToolGateway(fallback, {
    rss,
    "hacker-news": hackerNews,
    bluesky,
    ...(youtube ? { youtube } : {}),
  });
}

function discoveryRssFeeds(): RssFeedDefinition[] {
  const raw = process.env.KAIRO_DISCOVERY_RSS_FEEDS?.trim();
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("KAIRO_DISCOVERY_RSS_FEEDS must be valid JSON");
  }
  if (!Array.isArray(parsed)) throw new Error("KAIRO_DISCOVERY_RSS_FEEDS must be a JSON array");
  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`KAIRO_DISCOVERY_RSS_FEEDS[${index}] must be an object`);
    }
    const value = entry as Record<string, unknown>;
    const key = text(value.key);
    const url = text(value.url);
    const tags = Array.isArray(value.tags) ? value.tags.map(text).filter(Boolean) : [];
    if (!key || !url || !tags.length) {
      throw new Error(`KAIRO_DISCOVERY_RSS_FEEDS[${index}] requires key, url and tags`);
    }
    return {
      key,
      url,
      tags,
      ...(text(value.publisher) ? { publisher: text(value.publisher) } : {}),
      ...(typeof value.enabled === "boolean" ? { enabled: value.enabled } : {}),
    };
  });
}

function brandContextVersion(brand: BrandDto, brain: BrandBrainFieldDto[]) {
  const active = brain.filter((field) => field.state !== "stale");
  const latest = active.map((field) => field.updatedAt).sort().at(-1);
  return `${brand.id}@${latest ?? "current"}`;
}

function sectionText(brain: BrandBrainFieldDto[], section: BrandBrainFieldDto["section"]) {
  return brain
    .filter((field) => field.section === section && field.state !== "stale")
    .sort((left, right) => left.fieldKey.localeCompare(right.fieldKey))
    .map((field) => field.value.trim())
    .filter(Boolean)
    .join(" · ")
    .slice(0, 1_600);
}

function fallbackPublicQuery(brand: BrandDto, profile: ReturnType<typeof projectBrandIntelligenceProfile>) {
  return [brand.name, profile.sector, profile.subsector, ...profile.topics.slice(0, 2)]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);
}

function canonicalUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      const normalized = key.toLowerCase();
      if (normalized.startsWith("utm_") || ["fbclid", "gclid", "dclid", "msclkid"].includes(normalized)) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();
    return url.toString().replace(/\?$/, "");
  } catch {
    return value.trim();
  }
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
