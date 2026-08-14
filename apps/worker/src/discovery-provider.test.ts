import { describe, expect, it } from "vitest";
import { prepareToolRequest, type DiscoveryRequest, type DiscoverySourceProvider } from "@kairo/agent-contracts";
import {
  AGENT_REACH_PIN,
  AgentReachDiscoveryProvider,
  DiscoveryProviderError,
  KairoToolGateway,
  SourceRoutingToolGateway,
  type AgentReachSearchBackend,
} from "./discovery-provider";

class FakeBackend implements AgentReachSearchBackend {
  calls: Array<{ query: string; maxResults: number; timeoutMs: number }> = [];
  async search(query: string, options: { maxResults: number; timeoutMs: number; signal: AbortSignal }) {
    this.calls.push({ query, maxResults: options.maxResults, timeoutMs: options.timeoutMs });
    return [
      { title: "Useful evidence", url: "https://example.com/story?utm_source=x", platform: "web", publisher: "Example" },
      { title: "Second result", url: "https://example.org/second", platform: "web" },
    ];
  }
}

class FakeSource implements DiscoverySourceProvider {
  calls: DiscoveryRequest[] = [];
  constructor(private readonly provider: string) {}
  async discover(request: DiscoveryRequest) {
    this.calls.push(request);
    return [{
      title: `${this.provider} result`,
      sourceUrl: `https://example.com/${this.provider}`,
      platform: this.provider,
      retrievedAt: "2026-08-14T20:00:00.000Z",
      provider: this.provider,
    }];
  }
}

describe("Discovery provider boundary", () => {
  it("normalizes public evidence and pins Agent Reach provenance", async () => {
    const backend = new FakeBackend();
    const provider = new AgentReachDiscoveryProvider(backend, () => new Date("2026-08-13T00:00:00.000Z"));
    const result = await provider.discover({ query: "AI agents", scope: { visibility: "global-public" }, maxResults: 1, timeoutMs: 1000 });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      title: "Useful evidence",
      sourceUrl: "https://example.com/story?utm_source=x",
      provider: "agent-reach",
      providerVersion: AGENT_REACH_PIN,
      retrievedAt: "2026-08-13T00:00:00.000Z",
    });
    expect(backend.calls).toEqual([{ query: "AI agents", maxResults: 1, timeoutMs: 1000 }]);
  });

  it("rejects unsafe/private URLs before evidence can leave Agent Reach", async () => {
    const provider = new AgentReachDiscoveryProvider({
      async search() { return [{ title: "Unsafe", url: "http://127.0.0.1/private" }]; },
    });
    await expect(provider.discover({ query: "x", scope: { visibility: "global-public" }, maxResults: 1, timeoutMs: 1000 }))
      .rejects.toBeInstanceOf(DiscoveryProviderError);
  });

  it("keeps legacy KairoToolGateway calls on Agent Reach without requiring a source key", async () => {
    const backend = new FakeBackend();
    const gateway = new KairoToolGateway(new AgentReachDiscoveryProvider(backend, () => new Date("2026-08-13T00:00:00.000Z")));
    const request = prepareToolRequest({
      capability: "public-content-search",
      scope: { visibility: "global-public" },
      input: { query: "AI agents", maxResults: 2 },
      timeoutMs: 1000,
    });
    const result = await gateway.invoke<unknown[]>(request);
    expect(result.provenance).toHaveLength(2);
    expect(result.provenance[0]?.providerVersion).toBe(AGENT_REACH_PIN);
    expect(backend.calls).toHaveLength(1);
    expect(JSON.stringify(request.input)).not.toContain("command");
  });

  it("routes an explicit source key to the registered provider", async () => {
    const fallback = new FakeSource("agent-reach");
    const rss = new FakeSource("rss");
    const gateway = new SourceRoutingToolGateway(fallback, { rss });
    const request = prepareToolRequest({
      capability: "public-content-search",
      scope: { visibility: "global-public" },
      input: { source: "rss", query: "Umrah visa", maxResults: 3 },
      timeoutMs: 1000,
    });

    const result = await gateway.invoke<unknown[]>(request);

    expect(rss.calls).toHaveLength(1);
    expect(fallback.calls).toHaveLength(0);
    expect(result.provenance[0]?.provider).toBe("rss");
  });

  it("fails closed for an unknown source instead of silently falling back", async () => {
    const gateway = new SourceRoutingToolGateway(new FakeSource("agent-reach"), {});
    const request = prepareToolRequest({
      capability: "public-content-search",
      scope: { visibility: "global-public" },
      input: { source: "unknown-provider", query: "AI", maxResults: 2 },
      timeoutMs: 1000,
    });
    await expect(gateway.invoke(request)).rejects.toThrow(/not registered/i);
  });

  it("bounds result count before the Agent Reach backend runs", async () => {
    const provider = new AgentReachDiscoveryProvider(new FakeBackend());
    const bad: DiscoveryRequest = { query: "AI", scope: { visibility: "global-public" }, maxResults: 21, timeoutMs: 1000 };
    await expect(provider.discover(bad)).rejects.toThrow(/maxResults/);
  });
});
