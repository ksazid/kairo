import { SourceRoutingToolGateway } from "@kairo/worker/discovery-provider";
import {
  BlueskyDiscoveryProvider,
  HackerNewsDiscoveryProvider,
  YouTubeDiscoveryProvider,
} from "@kairo/worker/public-discovery-adapters";

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
  const youtubeKey = env.YOUTUBE_API_KEY?.trim();
  const youtube = youtubeKey ? new YouTubeDiscoveryProvider({ apiKey: youtubeKey }) : undefined;

  const publicFallback = {
    async discover(request: Parameters<HackerNewsDiscoveryProvider["discover"]>[0]) {
      const settled = await Promise.allSettled([
        hackerNews.discover(request),
        bluesky.discover(request),
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
    ...(youtube ? { youtube } : {}),
  });
}
