import type { BrandBrainFieldDto } from "@kairo/contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { KairoService, type KairoRepository } from "@kairo/domain";
import { DiscoveryService } from "@kairo/domain/discovery-service";
import { projectBrandIntelligenceProfile } from "@kairo/domain/source-policy";
import { selectSectorIntelligencePack } from "@kairo/domain/sector-packs";
import type { HunterRunInput, HunterRunResult } from "@kairo/worker/hunter";
import type { IdentityVerifier } from "./auth";
import type { BrandIntelligenceGraphStore } from "./brand-intelligence-graph-store";
import type { SectorPackId } from "@kairo/domain/brand-intelligence";
import {
  hunterClosedLoopStoreFromEnvironment,
  type HunterClosedLoopStore,
  type RecommendationFeedbackAction,
} from "./batch7-closed-loop-store";

export interface HunterRecommendationRunner {
  runForAuthorizedBrand(input: HunterRunInput): Promise<HunterRunResult>;
}

export function registerHunterRecommendationRoutes(app: FastifyInstance, options: {
  store: KairoRepository;
  identityVerifier: IdentityVerifier;
  runner?: HunterRecommendationRunner;
  graphStore?: BrandIntelligenceGraphStore;
  closedLoopStore?: HunterClosedLoopStore;
}) {
  const core = new KairoService(options.store);
  const inFlight = new Map<string, Promise<HunterRunResult>>();
  const closedLoop = options.closedLoopStore ?? hunterClosedLoopStoreFromEnvironment();

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

      const brain = await core.listBrandBrain(account.id, brand.id);
      const intelligenceProfile = projectBrandIntelligenceProfile(brain);
      const pack = selectSectorIntelligencePack(intelligenceProfile);
      const graphRecord = options.graphStore
        ? await options.graphStore.ensureCurrent(account.id, brand.workspaceId, brand.id, brain, topicGraphPack(pack.id))
        : undefined;
      const projectedBrand = projectBrandContext(brand, brain);
      const learnedContext = closedLoop ? await closedLoop.learningContext(account.id, brand.id) : undefined;
      const input: HunterRunInput = {
        accountId: account.id,
        brand: learnedContext
          ? { ...projectedBrand, goals: mergeClosedLoopContext(projectedBrand.goals, learnedContext) }
          : projectedBrand,
        intelligenceProfile,
        ...(graphRecord ? { intelligenceGraph: graphRecord.graph, intelligenceVersion: graphRecord.version } : {}),
        maxEvidence: 8,
      };
      const key = `${account.id}:${brand.id}`;
      let run = inFlight.get(key);
      if (!run) {
        run = options.runner.runForAuthorizedBrand(input).then(async (result) => {
          if (result.opportunityCount === 0) {
            const starterCount = await createProfileStarters(options.store, account.id, brand.id, input, brain);
            if (starterCount) return { ...result, candidateCount: result.candidateCount + starterCount, opportunityCount: starterCount };
          }
          return result;
        }).finally(() => inFlight.delete(key));
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

async function createProfileStarters(repository: KairoRepository, accountId: string, brandId: string, input: HunterRunInput, brain: readonly BrandBrainFieldDto[]) {
  const source = (await repository.listKnowledgeSources(accountId, brandId)).find((item) => item.status === "active" && item.sourceUrl);
  if (!source?.sourceUrl) return 0;
  const topics = brain.find((field) => field.fieldKey === "content.preferred-topics")?.value?.trim() || "the Brand's core topics";
  const audience = brain.find((field) => field.fieldKey === "audience.primary")?.value?.trim() || "the Brand audience";
  const service = new DiscoveryService(repository as unknown as ConstructorParameters<typeof DiscoveryService>[0]);
  const ideas: Array<[string, string, string, string]> = [
    [`${input.brand.brandName}: a practical guide for ${topics}`, `Starter opportunity grounded in the Brand's learned topics and public source.`, `The onboarding source is available now, so this is ready to develop.`, `Create an educational carousel for ${audience}.`],
    [`What ${audience} should know about ${topics}`, `Starter opportunity based on the Brand's audience and learned content direction.`, `A clear audience question is available immediately after onboarding.`, `Create a concise Instagram post with one useful takeaway.`],
    [`Behind the Brand: ${topics}`, `Starter opportunity using the Brand's own public context as the evidence boundary.`, `The Brand can begin with an owned-context story while broader sources refresh.`, `Create a visual story or Reel draft without making unsupported claims.`],
  ];
  let created = 0;
  for (const [title, rationale, whyNow, direction] of ideas) {
    const result = await service.recordCandidate(accountId, brandId, { signal: { title, summary: rationale, sourceUrl: source.sourceUrl, platform: source.sourceUrl.includes("instagram") ? "instagram" : "web", retrievedAt: new Date().toISOString(), provider: "brand-profile-fallback", providerVersion: "v1" }, title, rationale, whyNow, developmentDirection: direction, brandContextVersion: input.brand.contextVersion, scores: { relevance: .78, evidence: .55, novelty: .68, timeliness: .62, brandAuthority: .72, audienceFit: .78 }, details: { topic: topics, proposedAngle: direction, hook: title, targetAudience: audience, objective: "Grow audience", confidence: .62, estimatedEffort: "low", recommendedFormat: "carousel", recommendedChannel: "instagram" } });
    if (result.opportunity) created++;
  }
  return created;
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

function projectBrandContext(
  brand: { id: string; workspaceId: string; name: string },
  brain: readonly BrandBrainFieldDto[],
): HunterRunInput["brand"] {
  const active = brain.filter((field) => field.state !== "stale");
  const latest = [...active].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  return {
    workspaceId: brand.workspaceId,
    brandId: brand.id,
    contextVersion: `${brand.id}@${latest?.updatedAt ?? "brain-empty"}`,
    brandName: brand.name,
    ...sectionContext(active, "positioning", "positioning"),
    ...sectionContext(active, "audience", "audience"),
    ...sectionContext(active, "voice", "voice"),
    ...sectionContext(active, "goals", "goals"),
    ...sectionContext(active, "boundaries", "boundaries"),
  };
}

function sectionContext(
  fields: readonly BrandBrainFieldDto[],
  section: BrandBrainFieldDto["section"],
  key: "positioning" | "audience" | "voice" | "goals" | "boundaries",
) {
  const value = fields
    .filter((field) => field.section === section)
    .map((field) => field.value.trim())
    .filter(Boolean)
    .join(" · ")
    .slice(0, 4_000);
  return value ? { [key]: value } : {};
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
