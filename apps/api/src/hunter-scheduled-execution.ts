import { KairoService, type KairoRepository } from "@kairo/domain";
import { DiscoveryService } from "@kairo/domain/discovery-service";
import { createBrandBrainActivationSnapshot } from "@kairo/domain/brand-brain-activation";
import { BrandDiscoveryPlanService, projectInitialBrandDiscoveryPlan, type BrandDiscoveryPlan, type BrandDiscoveryPlanRepository } from "@kairo/domain/brand-discovery-plan";
import { projectBrandIntelligenceSnapshot, type BrandIntelligenceSnapshot } from "@kairo/domain/brand-intelligence-snapshot";
import type { HunterRunRepository } from "@kairo/domain/hunter-run-record";
import { projectBrandIntelligenceProfile, type BrandIntelligenceProfile } from "@kairo/domain/source-policy";
import { selectSectorIntelligencePack } from "@kairo/domain/sector-packs";
import type { HunterRunInput, HunterRunResult } from "@kairo/worker/hunter";
import type { BrandIntelligenceGraphStore } from "./brand-intelligence-graph-store";
import type { SectorPackId } from "@kairo/domain/brand-intelligence";
import type { HunterClosedLoopStore } from "./batch7-closed-loop-store";

export interface ScheduledHunterRunner {
  runForAuthorizedBrand(input: HunterRunInput): Promise<HunterRunResult>;
}

export class HunterNotReadyForScheduleError extends Error {
  readonly code = "hunter_not_ready";
}

export class ScheduledHunterExecutor {
  private readonly core: KairoService;
  private readonly plans?: BrandDiscoveryPlanService;

  constructor(private readonly options: {
    store: KairoRepository;
    runner: ScheduledHunterRunner;
    runStore: HunterRunRepository;
    discoveryPlanStore?: BrandDiscoveryPlanRepository;
    graphStore?: BrandIntelligenceGraphStore;
    closedLoopStore?: HunterClosedLoopStore;
    discovery?: DiscoveryService;
  }) {
    this.core = new KairoService(options.store);
    this.plans = options.discoveryPlanStore ? new BrandDiscoveryPlanService(options.discoveryPlanStore) : undefined;
  }

  async runScheduled(accountId: string, brandId: string): Promise<void> {
    const brand = await this.core.getBrand(accountId, brandId);
    const [brain, sources] = await Promise.all([
      this.core.listBrandBrain(accountId, brand.id),
      this.core.listKnowledgeSources(accountId, brand.id),
    ]);
    const activation = createBrandBrainActivationSnapshot(brain, sources);
    const snapshot = projectBrandIntelligenceSnapshot({ brand, fields: brain, sources, activation });
    if (!snapshot.hunterReady) throw new HunterNotReadyForScheduleError("Brand Brain is not ready for scheduled Hunter");

    const discoveryPlan = this.plans ? await this.plans.ensure(accountId, snapshot) : projectInitialBrandDiscoveryPlan(snapshot);
    const baseProfile = projectBrandIntelligenceProfile(brain);
    const intelligenceProfile = applyDiscoveryPlan(baseProfile, discoveryPlan);
    const pack = selectSectorIntelligencePack(intelligenceProfile);
    const graphRecord = this.options.graphStore
      ? await this.options.graphStore.ensureCurrent(accountId, brand.workspaceId, brand.id, brain, topicGraphPack(pack.id))
      : undefined;
    const existingOpportunities = this.options.discovery ? await this.options.discovery.list(accountId, brand.id) : [];
    const projectedBrand = projectBrandContext(snapshot, discoveryPlan);
    const learnedContext = this.options.closedLoopStore ? await this.options.closedLoopStore.learningContext(accountId, brand.id) : undefined;
    const startedAt = new Date().toISOString();
    const run = await this.options.runStore.start(accountId, {
      workspaceId: brand.workspaceId,
      brandId: brand.id,
      snapshotVersion: snapshot.snapshotVersion,
      planVersion: discoveryPlan.planVersion,
      trigger: "scheduled",
      startedAt,
    });
    const startedMs = Date.parse(startedAt);
    try {
      const result = await this.options.runner.runForAuthorizedBrand({
        accountId,
        brand: learnedContext ? { ...projectedBrand, goals: mergeClosedLoopContext(projectedBrand.goals, learnedContext) } : projectedBrand,
        intelligenceProfile,
        ...(graphRecord ? { intelligenceGraph: graphRecord.graph, intelligenceVersion: graphRecord.version } : {}),
        maxEvidence: 20,
        refreshSeed: startedAt,
        ...(existingOpportunities.length ? { existingOpportunityTitles: existingOpportunities.map(item => item.title).slice(0, 100) } : {}),
      });
      const completedAt = new Date().toISOString();
      await this.options.runStore.complete(accountId, run.runId, {
        completedAt,
        durationMs: elapsedMs(startedMs, completedAt),
        evidenceCount: result.evidenceCount,
        candidateCount: result.candidateCount,
        opportunityCount: result.opportunityCount,
        sourcesScanned: authoritativeSources(result),
        degradedSources: result.degradedSources ?? [],
      });
    } catch (error) {
      const completedAt = new Date().toISOString();
      await this.options.runStore.fail(accountId, run.runId, {
        completedAt,
        durationMs: elapsedMs(startedMs, completedAt),
        sourcesScanned: [],
        degradedSources: [],
        failureCode: failureCode(error),
        failureMessage: failureMessage(error),
      }).catch(() => undefined);
      throw error;
    }
  }
}

function applyDiscoveryPlan(profile: BrandIntelligenceProfile, plan: BrandDiscoveryPlan): BrandIntelligenceProfile {
  const topicNames = unique(plan.topics.map(topic => topic.name));
  const topicAudiences = unique(plan.topics.map(topic => topic.audience));
  const sourceClasses = unique(plan.topics.flatMap(topic => topic.sourceClasses));
  return {
    ...profile,
    topics: topicNames.length ? topicNames : profile.topics,
    audiences: unique([...topicAudiences, ...profile.audiences]),
    excludedTopics: unique([...plan.excludedTopics, ...profile.excludedTopics]),
    ...(sourceClasses.length ? { sourceClasses } : profile.sourceClasses?.length ? { sourceClasses: profile.sourceClasses } : {}),
  };
}

function projectBrandContext(snapshot: BrandIntelligenceSnapshot, plan: BrandDiscoveryPlan): HunterRunInput["brand"] {
  const context = snapshot.context;
  return {
    workspaceId: snapshot.workspaceId,
    brandId: snapshot.brandId,
    contextVersion: `${snapshot.snapshotVersion}|${plan.planVersion}`,
    brandName: snapshot.brandName,
    ...(context.positioning ? { positioning: context.positioning } : {}),
    ...(context.audience ? { audience: context.audience } : {}),
    ...(context.voice ? { voice: context.voice } : {}),
    ...(context.goals ? { goals: context.goals } : {}),
    ...(context.boundaries ? { boundaries: context.boundaries } : {}),
  };
}

function mergeClosedLoopContext(existing: string | undefined, learnedContext: string): string {
  const prefix = existing?.trim() ? `${existing.trim()}\n\n` : "";
  return `${prefix}Closed-loop learning (use as guidance, not as public evidence):\n${learnedContext}`.slice(0, 8_000);
}

function topicGraphPack(packId: string): SectorPackId {
  if (packId === "ai-technology") return "ai-tech";
  if (packId === "umrah-religious-travel") return "umrah";
  if (packId === "ias-upsc-education") return "ias-upsc";
  if (packId === "motorcycles") return "motorcycles";
  return "generic";
}

function authoritativeSources(result: HunterRunResult): string[] {
  const value = (result as HunterRunResult & { sourcesScanned?: unknown }).sourcesScanned;
  return Array.isArray(value) ? unique(value.filter((item): item is string => typeof item === "string")) : [];
}
function elapsedMs(startedMs: number, completedAt: string) { return Number.isFinite(startedMs) ? Math.max(0, Math.round(Date.parse(completedAt) - startedMs)) : 0; }
function failureCode(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  return code.trim().slice(0, 120) || "hunter_run_failed";
}
function failureMessage(error: unknown) { return (error instanceof Error ? error.message : "Hunter run failed").trim().slice(0, 1_000) || "Hunter run failed"; }
function unique(values: readonly string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values.map(item => item.trim()).filter(Boolean)) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}
