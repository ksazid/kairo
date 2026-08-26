import { SourceRoutingToolGateway } from "@kairo/worker/discovery-provider";
import {
  BlueskyDiscoveryProvider,
  GitHubDiscoveryProvider,
  HackerNewsDiscoveryProvider,
  RssAtomDiscoveryProvider,
  type RssFeedDefinition,
  YouTubeDiscoveryProvider,
} from "@kairo/worker/public-discovery-adapters";
import { createSourceIntelligenceRouter } from "./source-intelligence";

/**
 * Runtime discovery wiring for Home recommendations.
 *
 * The API deployment does not currently provide an Agent Reach backend. For that compatibility
 * slot we use Kairo-owned zero-credential public providers while preserving each evidence item's
 * real provider provenance. Named source plans still route directly to their matching provider.
 */
export function createHunterToolGateway(env: NodeJS.ProcessEnv = process.env) {
  const hackerNews = new HackerNewsDiscoveryProvider();
  const bluesky = new BlueskyDiscoveryProvider();
  const github = new GitHubDiscoveryProvider();
  const feeds = rssFeedsFromEnv(env.KAIRO_HUNTER_RSS_FEEDS_JSON);
  const rss = new RssAtomDiscoveryProvider({ feeds });
  const youtubeKey = env.YOUTUBE_API_KEY?.trim();
  const youtube = youtubeKey ? new YouTubeDiscoveryProvider({ apiKey: youtubeKey }) : undefined;

  const publicFallback = {
    async discover(request: Parameters<HackerNewsDiscoveryProvider["discover"]>[0]) {
      const settled = await Promise.allSettled([
        hackerNews.discover(request),
        bluesky.discover(request),
        github.discover(request),
        rss.discover(request),
      ]);
      const evidence = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
      const unique = [...new Map(evidence.map((item) => [item.sourceUrl, item])).values()]
        .slice(0, request.maxResults);
      if (unique.length) return unique;
      const failure = settled.find((result) => result.status === "rejected");
      if (failure?.status === "rejected") throw failure.reason;
      return [];
    },
  };

  return new SourceRoutingToolGateway(publicFallback, {
    "hacker-news": hackerNews,
    bluesky,
    github,
    rss,
    ...(youtube ? { youtube } : {}),
  }, createSourceIntelligenceRouter());
}

function rssFeedsFromEnv(value: string | undefined): RssFeedDefinition[] {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item, index) => {
      if (!item || typeof item !== "object") return [];
      const value = item as Record<string, unknown>;
      if (typeof value.url !== "string" || !/^https?:\/\//i.test(value.url)) return [];
      return [{ key: typeof value.key === "string" && value.key.trim() ? value.key.trim() : `feed-${index + 1}`, url: value.url,
        tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim())) : [],
        ...(typeof value.publisher === "string" && value.publisher.trim() ? { publisher: value.publisher.trim() } : {}) }];
    });
  } catch { return []; }
}
