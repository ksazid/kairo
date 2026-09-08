import { describe, expect, it } from "vitest";
import { configuredHunterSourceRegistry } from "./hunter-tool-gateway";

describe("configured Hunter source registry", () => {
  it("does not plan providers whose runtime prerequisites are absent", () => {
    const registry = configuredHunterSourceRegistry({});
    expect(registry.find((source) => source.key === "youtube")?.enabled).toBe(false);
    expect(registry.find((source) => source.key === "rss")?.enabled).toBe(false);
    expect(registry.find((source) => source.key === "github")?.enabled).toBe(true);
  });

  it("enables credential and feed backed sources when configured", () => {
    const registry = configuredHunterSourceRegistry({
      YOUTUBE_API_KEY: "key",
      KAIRO_HUNTER_RSS_FEEDS_JSON: JSON.stringify([{ key: "news", url: "https://example.com/feed.xml", tags: ["technology"] }]),
    });
    expect(registry.find((source) => source.key === "youtube")?.enabled).toBe(true);
    expect(registry.find((source) => source.key === "rss")?.enabled).toBe(true);
  });
});
