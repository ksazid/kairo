import {
  prepareAgentInvocation,
  prepareToolRequest,
  type AgentRuntimePort,
  type DiscoveryEvidence,
  type ToolGatewayPort,
} from "@kairo/agent-contracts";
import type { DiscoveryService, OpportunityCandidateInput } from "@kairo/domain/discovery-service";
import {
  planSourceQueries,
  resolveBrandSourcePolicy,
  type BrandIntelligenceProfile,
} from "@kairo/domain/source-policy";
import { SECTOR_INTELLIGENCE_PACKS, selectSectorIntelligencePack } from "@kairo/domain/sector-packs";
import { DEFAULT_SOURCE_REGISTRY } from "@kairo/domain/source-registry";

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
  /** Existing compatibility path. When supplied it takes precedence over sector-aware planning. */
  query?: string;
  /** Transient Brand-private projection; it is used for routing and never copied into shared source definitions. */
  intelligenceProfile?: BrandIntelligenceProfile;
  maxEvidence?: number;
}

export interface HunterRunResult {
  evidenceCount: number;
  candidateCount: number;
  opportunityCount: number;
}

interface ExecutableDiscoveryPlan {
  source: "agent-reach";
  query: string;
}

export class HunterOrchestrator {
  constructor(
    private readonly tools: ToolGatewayPort,
    private readonly runtime: AgentRuntimePort,
    private readonly opportunities: Pick<DiscoveryService, "recordCandidate">,
  ) {}

  async runForAuthorizedBrand(input: HunterRunInput): Promise<HunterRunResult> {
    const maxEvidence = normalizeMaxEvidence(input.maxEvidence);
    const plans = executablePlans(input);
    if (!plans.length) return { evidenceCount: 0, candidateCount: 0, opportunityCount: 0 };

    const boundedPlans = plans.slice(0, Math.min(plans.length, maxEvidence));
    const maxResultsPerQuery = Math.max(1, Math.ceil(maxEvidence / boundedPlans.length));
    const discovered: DiscoveryEvidence[] = [];

    for (const plan of boundedPlans) {
      const toolRequest = prepareToolRequest({
        capability: "public-content-search",
        scope: { visibility: "global-public" },
        input: { query: plan.query, maxResults: maxResultsPerQuery },
        timeoutMs: 20_000,
      });
      const discovery = await this.tools.invoke<DiscoveryEvidence[]>(toolRequest);
      discovered.push(...discovery.output);
    }

    const evidence = uniqueEvidence(discovered).slice(0, maxEvidence);
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
          ...(input.intelligenceProfile ? { intelligenceProfile: compactIntelligenceProfile(input.intelligenceProfile) } : {}),
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

function executablePlans(input: HunterRunInput): ExecutableDiscoveryPlan[] {
  const explicit = input.query?.trim();
  if (explicit) return [{ source: "agent-reach", query: explicit }];
  if (input.query !== undefined && !explicit) throw new Error("Hunter query is required");
  if (!input.intelligenceProfile) throw new Error("Hunter requires an explicit query or Brand Intelligence Profile");

  const pack = selectSectorIntelligencePack(input.intelligenceProfile, Object.values(SECTOR_INTELLIGENCE_PACKS));
  if (!pack) throw new Error("No Sector Intelligence Pack matches the Brand Intelligence Profile");
  const policy = resolveBrandSourcePolicy(input.intelligenceProfile, pack, DEFAULT_SOURCE_REGISTRY);
  const plan = planSourceQueries(input.intelligenceProfile, pack, policy, DEFAULT_SOURCE_REGISTRY);

  // VS-12A intentionally executes only the already-operational provider. VS-12B will replace
  // this filter with a provider registry without changing sector packs or policy resolution.
  return plan
    .filter((item) => item.source === "agent-reach")
    .map((item) => ({ source: "agent-reach", query: item.query }));
}

function normalizeMaxEvidence(value: number | undefined): number {
  const maxEvidence = value ?? 8;
  if (!Number.isInteger(maxEvidence) || maxEvidence < 1 || maxEvidence > 20) {
    throw new Error("maxEvidence must be an integer from 1 to 20");
  }
  return maxEvidence;
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

function compactIntelligenceProfile(profile: BrandIntelligenceProfile) {
  return {
    ...(profile.sector ? { sector: profile.sector } : {}),
    ...(profile.subsector ? { subsector: profile.subsector } : {}),
    geographies: profile.geographies,
    languages: profile.languages,
    audiences: profile.audiences,
    topics: profile.topics,
    excludedTopics: profile.excludedTopics,
    goals: profile.goals,
  };
}

function nonEmpty(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
