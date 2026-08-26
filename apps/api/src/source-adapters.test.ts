import { describe, expect, it, vi } from "vitest";
import { SourceRouter } from "@kairo/agent-contracts";
import type { PublicBrandReferenceReader } from "@kairo/domain/brand-brain-bootstrap";
import { GitHubAdapter, HackerNewsAdapter, RssSubstackAdapter, WebsiteAdapter } from "./source-adapters";

const scope = { visibility: "global-public" as const };

describe("VS-100 WebsiteAdapter", () => {
  it("selects only bounded, prioritized same-domain Brand pages and degrades per page", async () => {
    const read = vi.fn<PublicBrandReferenceReader["read"]>(async (url) => {
      if (url.endsWith("/pricing")) throw new Error("down");
      if (url === "https://brand.example/") return {
        url, title: "Brand", summary: "Summary", excerpt: "Home", retrievedAt: "2026-08-26T08:00:00Z",
        links: ["https://other.example/about", "https://brand.example/blog", "https://brand.example/pricing", "https://brand.example/about", "https://brand.example/legal"],
      };
      return { url, excerpt: url.endsWith("/about") ? "About us" : "Recent post", retrievedAt: "2026-08-26T08:00:00Z" };
    });
    const router = new SourceRouter([new WebsiteAdapter({ reader: { read }, maxPages: 4 })]);
    const result = await router.fetch({ url: "https://brand.example/", scope, timeoutMs: 1000 });

    expect(read.mock.calls.map(([url]) => url)).toEqual(["https://brand.example/", "https://brand.example/about", "https://brand.example/pricing", "https://brand.example/blog"]);
    expect(result.document.body).toContain("About us");
    expect(result.document.extractionWarnings).toHaveLength(1);
    expect(result.document.trust).toBe("untrusted-evidence");
  });
});

describe("VS-100 GitHubAdapter", () => {
  it("normalizes repository, README, languages, releases, activity and engagement", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.endsWith("/readme")) return json({ content: Buffer.from("# Kairo\nAgent platform").toString("base64") });
      if (url.endsWith("/languages")) return json({ TypeScript: 900, Rust: 100 });
      if (url.includes("/releases")) return json([{ name: "v2", body: "Durable runs" }]);
      if (url.includes("/events")) return json([{ type: "PushEvent" }]);
      return json({ name: "kairo", full_name: "acme/kairo", description: "Content intelligence", topics: ["ai", "content"], owner: { login: "acme" }, stargazers_count: 42, forks_count: 5, subscribers_count: 3, html_url: "https://github.com/acme/kairo" });
    });
    const result = await new SourceRouter([new GitHubAdapter({ fetchImpl, now: fixedNow })]).fetch({ url: "https://github.com/acme/kairo", scope, timeoutMs: 1000 });

    expect(result.document).toMatchObject({ platform: "github", sourceType: "repository", title: "acme/kairo", profile: "acme", engagement: { stars: 42, forks: 5 } });
    expect(result.document.body).toContain("Agent platform");
    expect(result.document.body).toContain("Durable runs");
    expect(result.document.tags).toEqual(expect.arrayContaining(["ai", "TypeScript", "PushEvent"]));
  });

  it("reports public API rate limits truthfully", async () => {
    const adapter = new GitHubAdapter({ fetchImpl: async () => new Response("{}", { status: 403 }) });
    await expect(adapter.fetch({ url: "https://github.com/acme/kairo", scope, timeoutMs: 1000 })).rejects.toMatchObject({ kind: "rate-limited" });
  });
});

describe("VS-100 HackerNewsAdapter", () => {
  it("normalizes a story, bounded discussion and linked article evidence", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes("item/1.json")) return json({ id: 1, type: "story", title: "New agent runtime", by: "alice", url: "https://example.com/article", time: 1787731200, score: 90, descendants: 2, kids: [2, 3, 4] });
      return json({ type: "comment", text: url.includes("/2.") ? "Strong benchmark evidence" : "Useful architecture debate" });
    });
    const linkedReader: PublicBrandReferenceReader = { read: async (url) => ({ url, title: "Article", excerpt: "Full linked article evidence", retrievedAt: fixedNow().toISOString() }) };
    const result = await new SourceRouter([new HackerNewsAdapter({ fetchImpl, linkedReader, maxComments: 2, now: fixedNow })]).fetch({ url: "https://news.ycombinator.com/item?id=1", scope, timeoutMs: 1000 });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(result.document.body).toContain("Full linked article evidence");
    expect(result.document.body).toContain("benchmark evidence");
    expect(result.document.engagement).toEqual({ score: 90, comments: 2 });
  });

  it("normalizes public user profiles", async () => {
    const adapter = new HackerNewsAdapter({ fetchImpl: async () => json({ id: "alice", karma: 123, about: "<b>AI builder</b>" }), now: fixedNow });
    const result = await new SourceRouter([adapter]).fetch({ url: "https://news.ycombinator.com/user?id=alice", scope, timeoutMs: 1000 });
    expect(result.document).toMatchObject({ profile: "alice", body: "AI builder", engagement: { karma: 123 } });
  });
});

describe("VS-100 RssSubstackAdapter", () => {
  it("uses a Substack feed and normalizes bounded recent entries with tags", async () => {
    const feed = `<?xml version="1.0"?><rss><channel><title>Agent Notes</title>
      <item><title>First</title><link>https://notes.example/first</link><description>One</description><dc:creator>Ada</dc:creator><pubDate>Tue, 25 Aug 2026 10:00:00 GMT</pubDate><category>AI</category></item>
      <item><title>Second</title><link>https://notes.example/second</link><description>Two</description><category>Tools</category></item></channel></rss>`;
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL) => new Response(feed, { status: 200, headers: { "content-type": "application/rss+xml" } }));
    const result = await new SourceRouter([new RssSubstackAdapter({ fetchImpl, now: fixedNow, maxEntries: 1 })]).fetch({ url: "https://agentnotes.substack.com", scope, timeoutMs: 1000 });

    expect(fetchImpl.mock.calls[0]?.[0].toString()).toBe("https://agentnotes.substack.com/feed");
    expect(result.document).toMatchObject({ platform: "substack", publisher: "Agent Notes", author: "Ada", tags: ["AI"] });
    expect(result.document.body).toContain("First");
    expect(result.document.body).not.toContain("Second");
  });

  it("rejects entity-bearing feeds as untrusted malformed input", async () => {
    const adapter = new RssSubstackAdapter({ fetchImpl: async () => new Response("<!DOCTYPE rss [<!ENTITY x SYSTEM 'file:///etc/passwd'>]><rss/>", { status: 200 }) });
    await expect(adapter.fetch({ url: "https://example.com/feed.xml", scope, timeoutMs: 1000 })).rejects.toMatchObject({ kind: "invalid-response" });
  });
});

function json(value: unknown) { return new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" } }); }
function fixedNow() { return new Date("2026-08-26T08:00:00.000Z"); }
