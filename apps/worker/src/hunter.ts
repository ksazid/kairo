import {
  prepareAgentInvocation,
  prepareToolRequest,
  type AgentRuntimePort,
  type DiscoveryEvidence,
  type ToolGatewayPort,
} from "@kairo/agent-contracts";
import type { DiscoveryService, OpportunityCandidateInput } from "@kairo/domain/discovery-service";

export interface BrandContextProjection {
  workspaceId: string;
  brandId: string;
  contextVersion: string;
  brandName: string;
  positioning?: string;
  audience?: string;
  voice?: string;
  goals?: string;
  boundaries?: string;
}

export interface HunterJudgmentCandidate {
  sourceUrl: string;
  title: string;
  rationale: string;
  whyNow: string;
  developmentDirection: string;
  scores: {
    relevance: number;
    evidence: number;
    novelty: number;
    timeliness: number;
    brandAuthority: number;
    audienceFit: number;
  };
}

export interface HunterJudgmentOutput {
  candidates: HunterJudgmentCandidate[];
}

export interface HunterRunInput {
  accountId: string;
  brand: BrandContextProjection;
  query: string;
  maxEvidence?: number;
}

export interface HunterRunResult {
  evidenceCount: number;
  candidateCount: number;
  opportunityCount: number;
}

export class HunterOrchestrator {
  constructor(
    private readonly tools: ToolGatewayPort,
    private readonly runtime: AgentRuntimePort,
    private readonly opportunities: Pick<DiscoveryService, "recordCandidate">,
  ) {}

  async runForAuthorizedBrand(input: HunterRunInput): Promise<HunterRunResult> {
    const query = input.query.trim();
    if (!query) throw new Error("Hunter query is required");
    const maxEvidence = input.maxEvidence ?? 8;

    const toolRequest = prepareToolRequest({
      capability: "public-content-search",
      scope: { visibility: "global-public" },
      input: { query, maxResults: maxEvidence },
      timeoutMs: 20_000,
    });
    const discovery = await this.tools.invoke<DiscoveryEvidence[]>(toolRequest);
    const evidence = uniqueEvidence(discovery.output).slice(0, maxEvidence);
    if (!evidence.length) return { evidenceCount: 0, candidateCount: 0, opportunityCount: 0 };

    const invocation = prepareAgentInvocation({
      role: "hunter",
      scope: { visibility: "brand-private", workspaceId: input.brand.workspaceId, brandId: input.brand.brandId },
      approvedContextVersion: input.brand.contextVersion,
      capabilities: ["public-content-search"],
      task: {
        instruction: "Evaluate the supplied public evidence for this Brand. Return only genuinely worthwhile, evidence-linked opportunities; returning zero candidates is preferred to filler.",
        context: {
          brand: compactBrand(input.brand),
          evidence: evidence.map((item) => ({
            title: item.title,
            ...(item.summary ? { summary: item.summary } : {}),
            sourceUrl: item.sourceUrl,
            platform: item.platform,
            ...(item.publisher ? { publisher: item.publisher } : {}),
            ...(item.publishedAt ? { publishedAt: item.publishedAt } : {}),
            retrievedAt: item.retrievedAt,
          })),
        },
      },
      outputSchema: { name: "hunter-opportunities", version: "1" },
      budget: { maxOutputTokens: 2_000, maxToolCalls: 0, maxCostUsd: 0.08, timeoutMs: 30_000 },
    });

    const judgment = await this.runtime.invoke<HunterJudgmentOutput>(invocation);
    if (!isHunterJudgmentOutput(judgment.output)) throw new Error("Hunter output failed domain validation");

    const byUrl = new Map(evidence.map((item) => [item.sourceUrl, item]));
    let opportunityCount = 0;
    for (const candidate of judgment.output.candidates.slice(0, 5)) {
      const source = byUrl.get(candidate.sourceUrl);
      if (!source) continue; // No evidence lineage → cannot create an Opportunity.
      const record: OpportunityCandidateInput = {
        signal: {
          title: source.title,
          ...(source.summary ? { summary: source.summary } : {}),
          sourceUrl: source.sourceUrl,
          platform: source.platform,
          ...(source.publisher ? { publisher: source.publisher } : {}),
          ...(source.author ? { author: source.author } : {}),
          ...(source.publishedAt ? { publishedAt: source.publishedAt } : {}),
          retrievedAt: source.retrievedAt,
          provider: source.provider,
          ...(source.providerVersion ? { providerVersion: source.providerVersion } : {}),
          ...(source.contentHash ? { contentHash: source.contentHash } : {}),
        },
        title: candidate.title,
        rationale: candidate.rationale,
        whyNow: candidate.whyNow,
        developmentDirection: candidate.developmentDirection,
        brandContextVersion: input.brand.contextVersion,
        scores: candidate.scores,
      };
      const saved = await this.opportunities.recordCandidate(input.accountId, input.brand.brandId, record);
      if (saved.opportunity) opportunityCount += 1;
    }

    return { evidenceCount: evidence.length, candidateCount: judgment.output.candidates.length, opportunityCount };
  }
}

export function isHunterJudgmentOutput(value: unknown): value is HunterJudgmentOutput {
  if (!value || typeof value !== "object" || !Array.isArray((value as HunterJudgmentOutput).candidates)) return false;
  return (value as HunterJudgmentOutput).candidates.every((candidate) =>
    candidate && typeof candidate === "object" &&
    nonEmpty(candidate.sourceUrl) && nonEmpty(candidate.title) && nonEmpty(candidate.rationale) &&
    nonEmpty(candidate.whyNow) && nonEmpty(candidate.developmentDirection) && validScores(candidate.scores),
  );
}

function validScores(scores: HunterJudgmentCandidate["scores"] | undefined): boolean {
  if (!scores || typeof scores !== "object") return false;
  return [scores.relevance, scores.evidence, scores.novelty, scores.timeliness, scores.brandAuthority, scores.audienceFit]
    .every((value) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1);
}

function uniqueEvidence(items: DiscoveryEvidence[]): DiscoveryEvidence[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.sourceUrl)) return false;
    seen.add(item.sourceUrl);
    return true;
  });
}

function compactBrand(brand: BrandContextProjection) {
  return {
    brandName: brand.brandName,
    ...(brand.positioning ? { positioning: brand.positioning } : {}),
    ...(brand.audience ? { audience: brand.audience } : {}),
    ...(brand.voice ? { voice: brand.voice } : {}),
    ...(brand.goals ? { goals: brand.goals } : {}),
    ...(brand.boundaries ? { boundaries: brand.boundaries } : {}),
  };
}

function nonEmpty(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
