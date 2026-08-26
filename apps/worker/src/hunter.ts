import {
  prepareAgentInvocation,
  prepareToolRequest,
  type AgentRuntimePort,
  type DiscoveryEvidence,
  type ToolGatewayPort,
  type NormalizedSourceDocument,
} from "@kairo/agent-contracts";
import type { DiscoveryService, OpportunityCandidateInput } from "@kairo/domain/discovery-service";
import {
  planSourceQueries,
  resolveBrandSourcePolicy,
  type BrandIntelligenceProfile,
} from "@kairo/domain/source-policy";
import { SECTOR_INTELLIGENCE_PACKS, selectSectorIntelligencePack } from "@kairo/domain/sector-packs";
import { DEFAULT_SOURCE_REGISTRY } from "@kairo/domain/source-registry";
import type { BrandIntelligenceTopicGraph } from "@kairo/domain/brand-intelligence";

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
  topic?: string;
  proposedAngle?: string;
  hook?: string;
  targetAudience?: string;
  objective?: string;
  recommendedFormat?: string;
  recommendedChannel?: string;
  confidence?: number;
  freshnessDays?: number;
  estimatedEffort?: "low" | "medium" | "high";
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
  intelligenceGraph?: BrandIntelligenceTopicGraph;
  intelligenceVersion?: number;
  maxEvidence?: number;
}

export interface HunterRunResult {
  evidenceCount: number;
  candidateCount: number;
  opportunityCount: number;
  degradedSources?: string[];
}

interface ExecutableDiscoveryPlan {
  source: string;
  query: string;
  explicit: boolean;
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

    // Source Registry/query planning owns the provider request ceilings. maxEvidence bounds the
    // evidence set sent to the model, not which relevant providers are allowed to participate.
    const maxResultsPerQuery = Math.max(1, Math.min(20, Math.ceil(maxEvidence / plans.length)));
    const discovered: DiscoveryEvidence[] = [];
    const degradedSources = new Set<string>();

    for (const plan of plans) {
      if (degradedSources.has(plan.source)) continue;
      const toolRequest = prepareToolRequest({
        capability: "public-content-search",
        scope: { visibility: "global-public" },
        input: {
          query: plan.query,
          maxResults: maxResultsPerQuery,
          ...(plan.explicit ? {} : { source: plan.source }),
        },
        timeoutMs: 20_000,
      });
      try {
        const discovery = await this.tools.invoke<DiscoveryEvidence[]>(toolRequest);
        discovered.push(...discovery.output);
      } catch {
        // A provider is degraded for the rest of this run. Other providers continue; failure is
        // surfaced in the run result rather than fabricated as successful empty evidence.
        degradedSources.add(plan.source);
      }
    }

    const shortlisted = rankDiscoveryEvidence(uniqueEvidence(discovered), input).slice(0, maxEvidence);
    const enrichedDocuments = new Map<string, NormalizedSourceDocument>();
    const evidence: DiscoveryEvidence[] = [];
    for (const item of shortlisted) {
      try {
        const fetched = await this.tools.invoke<{ document: NormalizedSourceDocument }> (prepareToolRequest({
          capability: "public-content-fetch", scope: { visibility: "global-public" }, input: { url: item.sourceUrl }, timeoutMs: 20_000,
        }));
        enrichedDocuments.set(item.sourceUrl, fetched.output.document);
        evidence.push(enrichDiscoveryEvidence(item, fetched.output.document));
      } catch { evidence.push(item); }
    }
    if (!evidence.length) return withDegraded({ evidenceCount: 0, candidateCount: 0, opportunityCount: 0 }, degradedSources);

    const invocation = prepareAgentInvocation({
      role: "hunter",
      scope: { visibility: "brand-private", workspaceId: input.brand.workspaceId, brandId: input.brand.brandId },
      approvedContextVersion: input.brand.contextVersion,
      capabilities: ["public-content-search", "public-content-fetch"],
      task: {
        instruction: "Evaluate the supplied public evidence for this Brand. Return only genuinely worthwhile, evidence-linked opportunities; returning zero candidates is preferred to filler.",
        context: {
          brand: compactBrand(input.brand),
          ...(input.intelligenceProfile ? { intelligenceProfile: compactIntelligenceProfile(input.intelligenceProfile) } : {}),
          ...(input.intelligenceGraph ? { topicGraph: compactTopicGraph(input.intelligenceGraph), intelligenceVersion: input.intelligenceVersion } : {}),
          evidence: evidence.map((item) => ({
            title: item.title,
            ...(item.summary ? { summary: item.summary } : {}),
            sourceUrl: item.sourceUrl,
            platform: item.platform,
            ...(item.publisher ? { publisher: item.publisher } : {}),
            ...(item.publishedAt ? { publishedAt: item.publishedAt } : {}),
            retrievedAt: item.retrievedAt,
            ...(enrichedDocuments.get(item.sourceUrl)?.transcript ? { transcript: enrichedDocuments.get(item.sourceUrl)!.transcript } : {}),
            ...(enrichedDocuments.get(item.sourceUrl)?.tags?.length ? { tags: enrichedDocuments.get(item.sourceUrl)!.tags } : {}),
          })),
        },
      },
      outputSchema: { name: "hunter-opportunities", version: "2" },
      budget: { maxOutputTokens: 2_000, maxToolCalls: 0, maxCostUsd: 0.08, timeoutMs: 30_000 },
    });

    let judgment: Awaited<ReturnType<AgentRuntimePort["invoke"]>>;
    try {
      judgment = await this.runtime.invoke<HunterJudgmentOutput>(invocation);
    } catch {
      // A provider/model contract failure must not turn a recommendation refresh into a
      // server error. The evidence fetch was still useful, but no trustworthy opportunities
      // can be persisted without a valid judgment.
      return withDegraded({
        evidenceCount: evidence.length,
        candidateCount: 0,
        opportunityCount: 0,
      }, new Set([...degradedSources, "hunter-model"]));
    }
    if (!isHunterJudgmentOutput(judgment.output)) {
      return withDegraded({
        evidenceCount: evidence.length,
        candidateCount: 0,
        opportunityCount: 0,
      }, new Set([...degradedSources, "hunter-model"]));
    }

    const byUrl = new Map(evidence.map((item) => [item.sourceUrl, item]));
    let opportunityCount = 0;
    for (const candidate of judgment.output.candidates.slice(0, 5)) {
      const source = byUrl.get(candidate.sourceUrl);
      if (!source) continue; // No evidence lineage → cannot create an Opportunity.
      const adjustedScores = evidenceAdjustedScores(candidate.scores, source, enrichedDocuments.get(source.sourceUrl), input.intelligenceGraph);
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
          ...(source.contentHash ? { contentHash: source.contentHash.replace(/^sha256:/, "") } : {}),
        },
        title: candidate.title,
        rationale: candidate.rationale,
        whyNow: candidate.whyNow,
        developmentDirection: candidate.developmentDirection,
        brandContextVersion: input.brand.contextVersion,
        scores: adjustedScores,
        details: opportunityDetails(candidate, source, input),
      };
      const saved = await this.opportunities.recordCandidate(input.accountId, input.brand.brandId, record);
      if (saved.opportunity) opportunityCount += 1;
    }

    return withDegraded({
      evidenceCount: evidence.length,
      candidateCount: judgment.output.candidates.length,
      opportunityCount,
    }, degradedSources);
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
  if (explicit) return [{ source: "agent-reach", query: explicit, explicit: true }];
  if (input.query !== undefined && !explicit) throw new Error("Hunter query is required");
  if (!input.intelligenceProfile) throw new Error("Hunter requires an explicit query or Brand Intelligence Profile");

  const pack = selectSectorIntelligencePack(input.intelligenceProfile, Object.values(SECTOR_INTELLIGENCE_PACKS));
  const policy = resolveBrandSourcePolicy(input.intelligenceProfile, pack, DEFAULT_SOURCE_REGISTRY);
  const base = planSourceQueries(input.intelligenceProfile, pack, policy, DEFAULT_SOURCE_REGISTRY);
  return expandIntentPlans(base, input).slice(0, 16);
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
  const storyKeys = new Set<string>();
  const result: DiscoveryEvidence[] = [];
  for (const item of items) {
    const key = canonicalEvidenceKey(item.sourceUrl);
    const storyKey = normalizedStoryKey(item.title);
    if (seen.has(key) || (storyKey && storyKeys.has(storyKey))) continue;
    seen.add(key);
    if (storyKey) storyKeys.add(storyKey);
    result.push(item);
  }
  return result;
}

function canonicalEvidenceKey(sourceUrl: string): string {
  try {
    const url = new URL(sourceUrl);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      const normalized = key.toLowerCase();
      if (normalized.startsWith("utm_") || ["fbclid", "gclid", "dclid", "msclkid"].includes(normalized)) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();
    return url.toString().replace(/\?$/, "");
  } catch {
    return sourceUrl.trim();
  }
}

function withDegraded(result: Omit<HunterRunResult, "degradedSources">, degraded: ReadonlySet<string>): HunterRunResult {
  const sources = [...degraded].sort();
  return sources.length ? { ...result, degradedSources: sources } : result;
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

const QUERY_INTENTS = ["latest developments", "new release", "trend", "debate", "benchmark", "audience pain", "regulation", "new research", "tutorial", "misconception", "contrarian viewpoint"] as const;
function expandIntentPlans(base: ReturnType<typeof planSourceQueries>, input: HunterRunInput): ExecutableDiscoveryPlan[] {
  const graphTopics = input.intelligenceGraph?.nodes.filter((node) => !node.excluded).sort((a, b) => b.priority - a.priority).slice(0, 4) ?? [];
  const aliases = new Map(graphTopics.map((node) => [node.topic.toLowerCase(), node.aliases[0]]));
  const excluded = input.intelligenceProfile?.excludedTopics ?? [];
  const language = input.intelligenceProfile?.languages[0]; const geography = input.intelligenceProfile?.geographies[0];
  return base.flatMap((plan, index) => {
    const node = graphTopics[index % Math.max(1, graphTopics.length)];
    const topic = node?.topic ?? plan.query;
    const alias = aliases.get(topic.toLowerCase());
    const intent = plan.source === "github" ? "new repo tool" : QUERY_INTENTS[index % QUERY_INTENTS.length];
    const freshness = node?.freshness === "fresh" ? "past week" : "recent";
    const negative = excluded.slice(0, 3).map((item) => `-${quoteQuery(item)}`).join(" ");
    const sourceSyntax = plan.source === "github" ? `in:name,description,readme pushed:>${dateDaysAgo(90)}` : "";
    const query = [topic, alias, intent, freshness, geography, language, negative, sourceSyntax].filter(Boolean).join(" ").replace(/\s+/g, " ").trim().slice(0, 600);
    return [{ source: plan.source, query, explicit: false }];
  });
}
function compactTopicGraph(graph: BrandIntelligenceTopicGraph) { return { schemaVersion: graph.schemaVersion, sectorPack: graph.sectorPack, fingerprint: graph.fingerprint, nodes: graph.nodes.slice(0, 30).map((node) => ({ topic: node.topic, aliases: node.aliases, ...(node.parent ? { parent: node.parent } : {}), priority: node.priority, ...(node.confidence !== undefined ? { confidence: node.confidence } : {}), sourceIds: node.sourceIds, freshness: node.freshness, preferred: node.preferred, excluded: node.excluded, authority: node.authority, origin: node.origin })) }; }
function enrichDiscoveryEvidence(item: DiscoveryEvidence, document: NormalizedSourceDocument): DiscoveryEvidence {
  const summary = document.transcript ?? document.body ?? document.description ?? item.summary;
  return { ...item, ...(summary ? { summary: summary.slice(0, 8_000) } : {}), contentHash: document.contentHash, providerVersion: document.providerVersion };
}
function rankDiscoveryEvidence(items: DiscoveryEvidence[], input: HunterRunInput): DiscoveryEvidence[] {
  const topics = input.intelligenceGraph?.nodes.filter((node) => !node.excluded).map((node) => node.topic) ?? input.intelligenceProfile?.topics ?? [];
  const ranked = [...items].sort((a, b) => discoveryScore(b, topics) - discoveryScore(a, topics) || a.sourceUrl.localeCompare(b.sourceUrl));
  const result: DiscoveryEvidence[] = []; const queues = new Map<string, DiscoveryEvidence[]>();
  for (const item of ranked) queues.set(item.platform, [...(queues.get(item.platform) ?? []), item]);
  while (queues.size) for (const [platform, queue] of queues) { const item = queue.shift(); if (item) result.push(item); if (!queue.length) queues.delete(platform); }
  return result;
}
function discoveryScore(item: DiscoveryEvidence, topics: readonly string[]) { const text = `${item.title} ${item.summary ?? ""}`.toLowerCase(); const fit = topics.reduce((score, topic) => score + (text.includes(topic.toLowerCase()) ? 1 : 0), 0); const freshness = item.publishedAt ? Math.max(0, 1 - ((Date.now() - Date.parse(item.publishedAt)) / 86_400_000) / 180) : 0; return fit * 2 + freshness + sourceAuthority(item.platform); }
function evidenceAdjustedScores(scores: HunterJudgmentCandidate["scores"], source: DiscoveryEvidence, document: NormalizedSourceDocument | undefined, graph: BrandIntelligenceTopicGraph | undefined) {
  const text = `${source.title} ${source.summary ?? ""} ${document?.body ?? ""}`.toLowerCase();
  const graphFit = graph?.nodes.filter((node) => !node.excluded && text.includes(node.topic.toLowerCase())).reduce((best, node) => Math.max(best, node.priority), 0) ?? 0;
  const fresh = source.publishedAt ? Math.max(0, 1 - ((Date.now() - Date.parse(source.publishedAt)) / 86_400_000) / 180) : scores.timeliness;
  return { ...scores, relevance: clamp01(scores.relevance * 0.75 + graphFit * 0.25), evidence: clamp01(scores.evidence + (document?.body || document?.transcript ? 0.15 : 0)), timeliness: clamp01(scores.timeliness * 0.6 + fresh * 0.4), brandAuthority: clamp01(scores.brandAuthority * 0.8 + sourceAuthority(source.platform) * 0.2) };
}
function opportunityDetails(candidate: HunterJudgmentCandidate, source: DiscoveryEvidence, input: HunterRunInput): NonNullable<OpportunityCandidateInput["details"]> {
  const confidence = clamp01(candidate.confidence ?? Object.values(candidate.scores).reduce((sum, score) => sum + score, 0) / 6);
  const freshnessDays = Math.max(1, Math.min(365, Math.round(candidate.freshnessDays ?? 30)));
  return { topic: candidate.topic?.trim() || bestTopic(source, input) || candidate.title, proposedAngle: candidate.proposedAngle?.trim() || candidate.developmentDirection,
    hook: candidate.hook?.trim() || candidate.title, targetAudience: candidate.targetAudience?.trim() || input.intelligenceProfile?.audiences[0] || "Brand audience",
    objective: candidate.objective?.trim() || input.intelligenceProfile?.goals[0] || "Build relevant authority", recommendedFormat: candidate.recommendedFormat?.trim() || "post",
    recommendedChannel: candidate.recommendedChannel?.trim() || "best-fit channel", confidence, expiresAt: new Date(Date.now() + freshnessDays * 86_400_000).toISOString(),
    estimatedEffort: candidate.estimatedEffort ?? "medium", ...(input.intelligenceVersion !== undefined ? { intelligenceVersion: input.intelligenceVersion } : {}) };
}
function bestTopic(source: DiscoveryEvidence, input: HunterRunInput) { const text = `${source.title} ${source.summary ?? ""}`.toLowerCase(); return input.intelligenceGraph?.nodes.filter((node) => !node.excluded && text.includes(node.topic.toLowerCase())).sort((a, b) => b.priority - a.priority)[0]?.topic ?? input.intelligenceProfile?.topics[0]; }
function sourceAuthority(platform: string) { return ["github", "hacker-news", "rss"].includes(platform) ? 0.9 : platform === "youtube" ? 0.75 : 0.6; }
function quoteQuery(value: string) { return /\s/.test(value) ? `"${value.replaceAll('"', "")}"` : value; }
function dateDaysAgo(days: number) { return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10); }
function clamp01(value: number) { return Math.max(0, Math.min(1, value)); }
function normalizedStoryKey(title: string) { return title.toLowerCase().replace(/\b(breaking|new|latest|update|release|announcing)\b/g, " ").match(/[a-z0-9]+/g)?.filter((token) => token.length > 2).sort().slice(0, 8).join("|") ?? ""; }

function nonEmpty(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
