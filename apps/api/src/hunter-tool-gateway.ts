import { SourceRoutingToolGateway } from "@kairo/worker/discovery-provider";
import {
  BlueskyDiscoveryProvider,
  HackerNewsDiscoveryProvider,
  RssAtomDiscoveryProvider,
  YouTubeDiscoveryProvider,
} from "@kairo/worker/public-discovery-adapters";

const HUNTER_RSS_FEEDS = [
  {
    key: "bbc-world",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    tags: ["news", "world", "india", "government", "policy", "travel", "saudi", "transport"],
    publisher: "BBC News",
  },
  {
    key: "the-verge",
    url: "https://www.theverge.com/rss/index.xml",
    tags: ["technology", "ai", "software", "developer", "saas", "agents"],
    publisher: "The Verge",
  },
  {
    key: "ars-technica",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    tags: ["technology", "ai", "software", "developer", "security", "science"],
    publisher: "Ars Technica",
  },
] as const;

/** Runtime discovery wiring for Home recommendations. */
export function createHunterToolGateway(env: NodeJS.ProcessEnv = process.env) {
  const hackerNews = new HackerNewsDiscoveryProvider();
  const bluesky = new BlueskyDiscoveryProvider();
  const rss = new RssAtomDiscoveryProvider({ feeds: HUNTER_RSS_FEEDS });
  const youtubeKey = env.YOUTUBE_API_KEY?.trim();
  const youtube = youtubeKey ? new YouTubeDiscoveryProvider({ apiKey: youtubeKey }) : undefined;

  const publicFallback = {
    async discover(request: Parameters<HackerNewsDiscoveryProvider["discover"]>[0]) {
      const settled = await Promise.allSettled([
        hackerNews.discover(request),
        bluesky.discover(request),
        rss.discover(request),
        ...(youtube ? [youtube.discover(request)] : []),
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
    rss,
    ...(youtube ? { youtube } : {}),
  });
}
