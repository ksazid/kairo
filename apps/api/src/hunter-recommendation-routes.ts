import { Pool } from "pg";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { KairoService, type KairoRepository } from "@kairo/domain";
import { DiscoveryService } from "@kairo/domain/discovery-service";
import { createBrandBrainActivationSnapshot } from "@kairo/domain/brand-brain-activation";
import {
  BrandDiscoveryPlanService,
  projectInitialBrandDiscoveryPlan,
  type BrandDiscoveryPlan,
  type BrandDiscoveryPlanRepository,
} from "@kairo/domain/brand-discovery-plan";
import { projectBrandIntelligenceSnapshot, type BrandIntelligenceSnapshot } from "@kairo/domain/brand-intelligence-snapshot";
import { projectBrandIntelligenceProfile, type BrandIntelligenceProfile } from "@kairo/domain/source-policy";
import { selectSectorIntelligencePack } from "@kairo/domain/sector-packs";
import type { HunterRunInput, HunterRunResult } from "@kairo/worker/hunter";
import type { IdentityVerifier } from "./auth";
import type { BrandIntelligenceGraphStore } from "./brand-intelligence-graph-store";
import type { SectorPackId } from "@kairo/domain/brand-intelligence";
import { PgBrandDiscoveryPlanRepository } from "./brand-discovery-plan-postgres";
import {
  hunterClosedLoopStoreFromEnvironment,
  type HunterClosedLoopStore,
  type RecommendationFeedbackAction,
} from "./batch7-closed-loop-store";

let runtimePlanPool: Pool | undefined;

export interface HunterRecommendationRunner {
  runForAuthorizedBrand(input: HunterRunInput): Promise<HunterRunResult>;
}

export function registerHunterRecommendationRoutes(app: FastifyInstance, options: {
  store: KairoRepository;
  identityVerifier: IdentityVerifier;
  runner?: HunterRecommendationRunner;
  graphStore?: BrandIntelligenceGraphStore;
  closedLoopStore?: HunterClosedLoopStore;
  discovery?: DiscoveryService;
  discoveryPlanStore?: BrandDiscoveryPlanRepository;
}) {
  const core = new KairoService(options.store);
  const inFlight = new Map<string, Promise<HunterRunResult>>();
  const closedLoop = options.closedLoopStore ?? hunterClosedLoopStoreFromEnvironment();
  const planStore = options.discoveryPlanStore ?? discoveryPlanStoreFromEnv();
  const plans = planStore ? new BrandDiscoveryPlanService(planStore) : undefined;

  app.post<{ Params: { brandId: string } }>(
    "/api/v1/brands/:brandId/recommendations",
    async (request, reply) => {
      const account = await authenticate(request, reply, core, options.identityVerifier);
      if (!account) return;

      const brand = await core.getBrand(account.id, request.params.brandId);
      if (!options.runner) {
        return reply.status(503).send({
          type: "about:blank",
          title: "Recommendations unavailable",
          status: 503,
          detail: "Kairo's recommendation runtime is not configured right now.",
          code: "hunter_unavailable",
          correlationId: request.id,
        });
      }

      const [brain, sources] = await Promise.all([
        core.listBrandBrain(account.id, brand.id),
        core.listKnowledgeSources(account.id, brand.id),
      ]);
      const activation = createBrandBrainActivationSnapshot(brain, sources);
      const snapshot = projectBrandIntelligenceSnapshot({ brand, fields: brain, sources, activation });
      if (!snapshot.hunterReady) {
        return reply.status(409).send({
          type: "about:blank",
          title: "Brand Brain is not ready for Hunter",
          status: 409,
          detail: "Complete or confirm the required Brand Brain context before running discovery.",
          code: "hunter_not_ready",
          correlationId: request.id,
          readiness: snapshot.status,
          gaps: snapshot.readinessGaps,
          weakFields: snapshot.weakFields,
          snapshotVersion: snapshot.snapshotVersion,
        });
      }

      const discoveryPlan = plans
        ? await plans.ensure(account.id, snapshot)
        : projectInitialBrandDiscoveryPlan(snapshot);
      const baseProfile = projectBrandIntelligenceProfile(brain);
      const intelligenceProfile = applyDiscoveryPlan(baseProfile, discoveryPlan);
      const pack = selectSectorIntelligencePack(intelligenceProfile);
      const graphRecord = options.graphStore
        ? await options.graphStore.ensureCurrent(account.id, brand.workspaceId, brand.id, brain, topicGraphPack(pack.id))
        : undefined;
      const existingOpportunities = options.discovery ? await options.discovery.list(account.id, brand.id) : [];
      const projectedBrand = projectBrandContext(snapshot, discoveryPlan);
      const learnedContext = closedLoop ? await closedLoop.learningContext(account.id, brand.id) : undefined;
      const input: HunterRunInput = {
        accountId: account.id,
        brand: learnedContext
          ? { ...projectedBrand, goals: mergeClosedLoopContext(projectedBrand.goals, learnedContext) }
          : projectedBrand,
        intelligenceProfile,
        ...(graphRecord ? { intelligenceGraph: graphRecord.graph, intelligenceVersion: graphRecord.version } : {}),
        maxEvidence: 20,
        refreshSeed: new Date().toISOString(),
        ...(existingOpportunities.length ? { existingOpportunityTitles: existingOpportunities.map((item) => item.title).slice(0, 100) } : {}),
      };
      const key = `${account.id}:${brand.id}`;
      let run = inFlight.get(key);
      if (!run) {
        run = options.runner.runForAuthorizedBrand(input).finally(() => inFlight.delete(key));
        inFlight.set(key, run);
      }
      return run;
    },
  );

  app.post<{ Params: { brandId: string; opportunityId: string; action: string } }>(
    "/api/v1/brands/:brandId/opportunities/:opportunityId/feedback/:action",
    async (request, reply) => {
      const account = await authenticate(request, reply, core, options.identityVerifier);
      if (!account) return;
      await core.getBrand(account.id, request.params.brandId);
      if (!closedLoop) return unavailableClosedLoop(reply, request.id);
      if (!isFeedbackAction(request.params.action)) {
        return reply.status(400).send({
          type: "about:blank",
          title: "Invalid feedback",
          status: 400,
          detail: "Recommendation feedback must be seen or dismissed.",
          code: "invalid_feedback_action",
          correlationId: request.id,
        });
      }
      return closedLoop.recordFeedback(
        account.id,
        request.params.brandId,
        request.params.opportunityId,
        request.params.action,
      );
    },
  );

  app.post<{ Params: { brandId: string; opportunityId: string } }>(
    "/api/v1/brands/:brandId/opportunities/:opportunityId/development",
    async (request, reply) => {
      const account = await authenticate(request, reply, core, options.identityVerifier);
      if (!account) return;
      await core.getBrand(account.id, request.params.brandId);
      if (!closedLoop) return unavailableClosedLoop(reply, request.id);
      return closedLoop.developOpportunity(account.id, request.params.brandId, request.params.opportunityId);
    },
  );
}

function discoveryPlanStoreFromEnv(): BrandDiscoveryPlanRepository | undefined {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) return undefined;
  runtimePlanPool ??= new Pool({ connectionString });
  return new PgBrandDiscoveryPlanRepository(runtimePlanPool);
}

function applyDiscoveryPlan(profile: BrandIntelligenceProfile, plan: BrandDiscoveryPlan): BrandIntelligenceProfile {
  const topicNames = unique(plan.topics.map((topic) => topic.name));
  const topicAudiences = unique(plan.topics.map((topic) => topic.audience));
  return {
    ...profile,
    topics: topicNames.length ? topicNames : profile.topics,
    audiences: unique([...topicAudiences, ...profile.audiences]),
    excludedTopics: unique([...plan.excludedTopics, ...profile.excludedTopics]),
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

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values.map((item) => item.trim()).filter(Boolean)) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function isFeedbackAction(value: string): value is RecommendationFeedbackAction {
  return value === "seen" || value === "dismissed";
}

function unavailableClosedLoop(reply: FastifyReply, correlationId: string) {
  return reply.status(503).send({
    type: "about:blank",
    title: "Recommendation feedback unavailable",
    status: 503,
    detail: "Kairo's recommendation feedback store is not configured right now.",
    code: "closed_loop_unavailable",
    correlationId,
  });
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

async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
  service: KairoService,
  verifier: IdentityVerifier,
) {
  const identity = await verifier.verify(request.headers.authorization);
  if (!identity) {
    await reply.status(401).send({
      type: "about:blank",
      title: "Unauthorized",
      status: 401,
      detail: "Authentication is required",
      code: "unauthorized",
      correlationId: request.id,
    });
    return null;
  }
  return service.establishSession(identity);
}
