import { describe, expect, it } from "vitest";
import type {
  AgentInvocationRequest,
  AgentRuntimePort,
  AgentRuntimeResult,
  DiscoveryEvidence,
  ToolGatewayPort,
  ToolRequest,
  ToolResult,
} from "@kairo/agent-contracts";
import { HunterOrchestrator, type HunterJudgmentOutput } from "./hunter";

const evidence = [{
  title: "Persistent agents",
  summary: "Agent runtimes can keep durable working state.",
  sourceUrl: "https://example.com/persistent",
  platform: "web",
  retrievedAt: "2026-08-13T00:00:00.000Z",
  provider: "agent-reach",
  providerVersion: "93ae1d18c37b707dec053c7c4f9d91cd8ef8943d",
} satisfies DiscoveryEvidence];

class FakeTools implements ToolGatewayPort {
  requests: ToolRequest[] = [];
  constructor(private readonly output: DiscoveryEvidence[] = evidence) {}
  async invoke<TOutput>(request: ToolRequest): Promise<ToolResult<TOutput>> {
    this.requests.push(request);
    return { output: this.output as TOutput, provenance: [] };
  }
}

class FakeRuntime implements AgentRuntimePort {
  lastRequest: AgentInvocationRequest | null = null;
  constructor(private readonly output: HunterJudgmentOutput) {}
  async invoke<TOutput>(request: AgentInvocationRequest): Promise<AgentRuntimeResult<TOutput>> {
    this.lastRequest = request;
    return { output: this.output as TOutput, metadata: { runtime: "fixture", latencyMs: 1 } };
  }
}

class FakeSink {
  records: unknown[] = [];
  async recordCandidate(_accountId: string, _brandId: string, input: unknown) {
    this.records.push(input);
    return { signal: { id: "signal-1" }, opportunity: { id: "opportunity-1" } } as never;
  }
}

const brand = {
  workspaceId: "workspace-1",
  brandId: "brand-1",
  contextVersion: "brand-1@7",
  brandName: "Kairo",
  positioning: "Content decision intelligence",
  audience: "Technical founders",
};

const scores = { relevance: 0.9, evidence: 0.8, novelty: 0.8, timeliness: 0.9, brandAuthority: 0.7, audienceFit: 0.9 };

describe("Hunter orchestration", () => {
  it("preserves the existing explicit-query path as one provider-neutral ToolGateway request", async () => {
    const runtime = new FakeRuntime({ candidates: [{
      sourceUrl: evidence[0]!.sourceUrl,
      title: "Persistent agents change SaaS architecture",
      rationale: "High audience fit",
      whyNow: "Runtime behavior is changing now",
      developmentDirection: "Explain multi-tenant architecture tradeoffs",
      scores,
    }] });
    const tools = new FakeTools();
    const sink = new FakeSink();
    const hunter = new HunterOrchestrator(tools, runtime, sink as never);
    const result = await hunter.runForAuthorizedBrand({ accountId: "account-1", brand, query: "AI agents" });

    expect(result).toEqual({ evidenceCount: 1, candidateCount: 1, opportunityCount: 1 });
    expect(tools.requests).toHaveLength(1);
    expect(tools.requests[0]?.input.query).toBe("AI agents");
    expect(sink.records).toHaveLength(1);
    expect(runtime.lastRequest?.scope).toEqual({ visibility: "brand-private", workspaceId: "workspace-1", brandId: "brand-1" });
    expect(runtime.lastRequest?.budget.maxToolCalls).toBe(0);
  });

  it("uses the same Hunter to generate materially different AI and Umrah fallback queries from Brand intelligence", async () => {
    const aiTools = new FakeTools();
    const umrahTools = new FakeTools();
    const noCandidates = new FakeRuntime({ candidates: [] });

    await new HunterOrchestrator(aiTools, noCandidates, new FakeSink() as never).runForAuthorizedBrand({
      accountId: "account-1",
      brand,
      intelligenceProfile: {
        sector: "Developer Technology",
        geographies: ["global"],
        languages: ["English"],
        audiences: ["technical founders"],
        topics: ["AI agents", "software architecture"],
        excludedTopics: [],
        goals: ["educate"],
      },
    });

    await new HunterOrchestrator(umrahTools, new FakeRuntime({ candidates: [] }), new FakeSink() as never).runForAuthorizedBrand({
      accountId: "account-1",
      brand,
      intelligenceProfile: {
        sector: "Religious Travel",
        geographies: ["India"],
        languages: ["English"],
        audiences: ["first-time pilgrims"],
        topics: ["Umrah visa", "pilgrimage guidance"],
        excludedTopics: [],
        goals: ["guide"],
      },
    });

    expect(aiTools.requests.length).toBeGreaterThan(0);
    expect(umrahTools.requests.length).toBeGreaterThan(0);
    expect(aiTools.requests.every((request) => request.capability === "public-content-search")).toBe(true);
    expect(umrahTools.requests.every((request) => request.capability === "public-content-search")).toBe(true);
    expect(aiTools.requests[0]?.input.query).toContain("AI agents");
    expect(umrahTools.requests[0]?.input.query).toContain("Umrah visa");
    expect(aiTools.requests[0]?.input.query).not.toBe(umrahTools.requests[0]?.input.query);
    expect(aiTools.requests.length).toBeLessThanOrEqual(2);
    expect(umrahTools.requests.length).toBeLessThanOrEqual(2);
  });

  it("returns zero opportunities without invoking the model when discovery returns no evidence", async () => {
    const tools = new FakeTools([]);
    const runtime = new FakeRuntime({ candidates: [] });
    const sink = new FakeSink();
    const hunter = new HunterOrchestrator(tools, runtime, sink as never);

    const result = await hunter.runForAuthorizedBrand({ accountId: "account-1", brand, query: "no evidence" });

    expect(result).toEqual({ evidenceCount: 0, candidateCount: 0, opportunityCount: 0 });
    expect(runtime.lastRequest).toBeNull();
    expect(sink.records).toHaveLength(0);
  });

  it("returns no Opportunity when judgment returns no strong candidates", async () => {
    const sink = new FakeSink();
    const hunter = new HunterOrchestrator(new FakeTools(), new FakeRuntime({ candidates: [] }), sink as never);
    const result = await hunter.runForAuthorizedBrand({ accountId: "account-1", brand, query: "AI agents" });
    expect(result).toEqual({ evidenceCount: 1, candidateCount: 0, opportunityCount: 0 });
    expect(sink.records).toHaveLength(0);
  });

  it("drops candidates that do not reference supplied evidence", async () => {
    const sink = new FakeSink();
    const hunter = new HunterOrchestrator(new FakeTools(), new FakeRuntime({ candidates: [{
      sourceUrl: "https://fabricated.example/no-evidence",
      title: "Fabricated",
      rationale: "Should not pass",
      whyNow: "Never",
      developmentDirection: "None",
      scores,
    }] }), sink as never);
    const result = await hunter.runForAuthorizedBrand({ accountId: "account-1", brand, query: "AI agents" });
    expect(result.opportunityCount).toBe(0);
    expect(sink.records).toHaveLength(0);
  });
});
