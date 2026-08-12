import { describe, expect, it } from "vitest";
import { prepareToolRequest, type DiscoveryRequest } from "@kairo/agent-contracts";
import {
  AGENT_REACH_PIN,
  AgentReachDiscoveryProvider,
  DiscoveryProviderError,
  KairoToolGateway,
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

describe("VS-03 Agent Reach discovery boundary", () => {
  it("normalizes public evidence and pins provider provenance", async () => {
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

  it("rejects unsafe/private URLs before evidence can leave the provider", async () => {
    const provider = new AgentReachDiscoveryProvider({
      async search() { return [{ title: "Unsafe", url: "http://127.0.0.1/private" }]; },
    });
    await expect(provider.discover({ query: "x", scope: { visibility: "global-public" }, maxResults: 1, timeoutMs: 1000 }))
      .rejects.toBeInstanceOf(DiscoveryProviderError);
  });

  it("ToolGateway accepts a fixed search capability, never an executable command", async () => {
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
    expect(JSON.stringify(request.input)).not.toContain("command");
  });

  it("bounds result count before the backend runs", async () => {
    const provider = new AgentReachDiscoveryProvider(new FakeBackend());
    const bad: DiscoveryRequest = { query: "AI", scope: { visibility: "global-public" }, maxResults: 21, timeoutMs: 1000 };
    await expect(provider.discover(bad)).rejects.toThrow(/maxResults/);
  });
});
