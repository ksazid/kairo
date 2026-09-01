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
import { HunterOrchestrator } from "./hunter";

class SearchCaptureTools implements ToolGatewayPort {
  requests: ToolRequest[] = [];

  async invoke<TOutput>(request: ToolRequest): Promise<ToolResult<TOutput>> {
    this.requests.push(request);
    return { output: [] as TOutput, provenance: [] };
  }
}

class NoEvidenceRuntime implements AgentRuntimePort {
  calls = 0;

  async invoke<TOutput>(_request: AgentInvocationRequest): Promise<AgentRuntimeResult<TOutput>> {
    this.calls += 1;
    throw new Error("Model must not be called when discovery returns no evidence");
  }
}

class NoopSink {
  async recordCandidate() {
    throw new Error("No opportunity may be persisted in a zero-evidence POC run");
  }
}

const brandBase = {
  workspaceId: "workspace-poc",
  contextVersion: "snapshot-v1|plan-v1",
};

const cases = [
  {
    name: "Kairo AI / developer technology",
    brand: { ...brandBase, brandId: "brand-kairo", brandName: "Kairo" },
    profile: {
      sector: "Developer Technology",
      geographies: ["Malta"],
      languages: ["English"],
      audiences: ["technical founders"],
      topics: ["AI agents", "software architecture"],
      excludedTopics: ["celebrity gossip"],
      goals: ["build technical authority"],
    },
    expectedSources: ["agent-reach", "bluesky", "github", "hacker-news", "rss", "youtube"],
  },
  {
    name: "Noorpath Umrah / religious travel",
    brand: { ...brandBase, brandId: "brand-noorpath", brandName: "Noorpath" },
    profile: {
      sector: "Religious Travel",
      geographies: ["India"],
      languages: ["English"],
      audiences: ["first-time Umrah pilgrims"],
      topics: ["Umrah visa", "pilgrimage guidance"],
      excludedTopics: ["party politics"],
      goals: ["guide pilgrims"],
    },
    expectedSources: ["agent-reach", "bluesky", "rss", "youtube"],
  },
  {
    name: "Motorcycle brand",
    brand: { ...brandBase, brandId: "brand-moto", brandName: "Moto Malta" },
    profile: {
      sector: "Motorcycles",
      geographies: ["Malta"],
      languages: ["English"],
      audiences: ["motorcycle riders"],
      topics: ["EV motorcycles", "motorcycle safety"],
      excludedTopics: ["car reviews"],
      goals: ["educate riders"],
    },
    expectedSources: ["agent-reach", "bluesky", "hacker-news", "rss", "youtube"],
  },
  {
    name: "UPSC education brand",
    brand: { ...brandBase, brandId: "brand-upsc", brandName: "Civil Prep" },
    profile: {
      sector: "UPSC",
      geographies: ["India"],
      languages: ["English"],
      audiences: ["civil services aspirants"],
      topics: ["UPSC current affairs", "public policy"],
      excludedTopics: ["celebrity gossip"],
      goals: ["help exam preparation"],
    },
    expectedSources: ["agent-reach", "bluesky", "hacker-news", "rss", "youtube"],
  },
  {
    name: "generic restaurant brand",
    brand: { ...brandBase, brandId: "brand-restaurant", brandName: "Harbour Kitchen" },
    profile: {
      sector: "Restaurant",
      geographies: ["Malta"],
      languages: ["English"],
      audiences: ["local diners"],
      topics: ["seasonal menus", "restaurant experiences"],
      excludedTopics: ["crypto trading"],
      goals: ["increase local discovery"],
    },
    // This intentionally records current generic-pack behavior. If these sources are later
    // narrowed by a hospitality pack or Discovery Plan source-class policy, this expectation
    // should change with that product decision rather than silently changing Hunter behavior.
    expectedSources: ["agent-reach", "bluesky", "github", "hacker-news", "rss", "youtube"],
  },
] as const;

describe("Hunter Chunk 1-2 multi-brand POC", () => {
  for (const testCase of cases) {
    it(`${testCase.name}: creates a bounded sector-aware search plan and stays truthful on zero evidence`, async () => {
      const tools = new SearchCaptureTools();
      const runtime = new NoEvidenceRuntime();
      const hunter = new HunterOrchestrator(tools, runtime, new NoopSink() as never);

      const result = await hunter.runForAuthorizedBrand({
        accountId: "account-poc",
        brand: testCase.brand,
        intelligenceProfile: testCase.profile,
        maxEvidence: 12,
        refreshSeed: "2026-09-01T11:30:00.000Z",
      });

      expect(result).toEqual({ evidenceCount: 0, candidateCount: 0, opportunityCount: 0 });
      expect(runtime.calls).toBe(0);

      const searches = tools.requests.filter((request) => request.capability === "public-content-search");
      const sources = [...new Set(searches.map((request) => String(request.input.source)))].sort();
      expect(sources).toEqual([...testCase.expectedSources].sort());
      expect(searches.length).toBeGreaterThan(0);
      expect(searches.length).toBeLessThanOrEqual(16);
      expect(searches.every((request) => String(request.input.query).length <= 600)).toBe(true);
      expect(searches.every((request) => String(request.input.query).includes(testCase.profile.geographies[0]))).toBe(true);

      const excluded = testCase.profile.excludedTopics[0];
      const negativeToken = excluded.includes(" ") ? `-\"${excluded}\"` : `-${excluded}`;
      expect(searches.every((request) => String(request.input.query).includes(negativeToken))).toBe(true);
    });
  }

  it("keeps materially different Brand sectors isolated from each other's source policy", async () => {
    const sourceSets = new Map<string, string>();

    for (const testCase of cases) {
      const tools = new SearchCaptureTools();
      const hunter = new HunterOrchestrator(tools, new NoEvidenceRuntime(), new NoopSink() as never);
      await hunter.runForAuthorizedBrand({
        accountId: "account-poc",
        brand: testCase.brand,
        intelligenceProfile: testCase.profile,
        maxEvidence: 12,
      });
      const sources = [...new Set(tools.requests
        .filter((request) => request.capability === "public-content-search")
        .map((request) => String(request.input.source)))].sort().join(",");
      sourceSets.set(testCase.brand.brandId, sources);
    }

    expect(sourceSets.get("brand-kairo")).not.toBe(sourceSets.get("brand-noorpath"));
    expect(sourceSets.get("brand-noorpath")).not.toContain("github");
    expect(sourceSets.get("brand-noorpath")).not.toContain("hacker-news");
  });
});
