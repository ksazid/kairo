import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { KairoService, type KairoRepository } from "@kairo/domain";
import { projectBrandIntelligenceContext } from "@kairo/domain/brand-intelligence-context";
import type { LearningRepository } from "@kairo/domain/learning-service";
import { projectBrandIntelligenceProfile } from "@kairo/domain/source-policy";
import { selectSectorIntelligencePack } from "@kairo/domain/sector-packs";
import type { HunterRunInput, HunterRunResult } from "@kairo/worker/hunter";
import type { IdentityVerifier } from "./auth";

export interface HunterRecommendationRunner {
  runForAuthorizedBrand(input: HunterRunInput): Promise<HunterRunResult>;
}

export function registerHunterRecommendationRoutes(app: FastifyInstance, options: {
  store: KairoRepository;
  identityVerifier: IdentityVerifier;
  runner?: HunterRecommendationRunner;
  learningRepository?: Pick<LearningRepository, "listLearnings">;
}) {
  const core = new KairoService(options.store);
  const inFlight = new Map<string, Promise<HunterRunResult>>();

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

      const [brain, learnings] = await Promise.all([
        core.listBrandBrain(account.id, brand.id),
        options.learningRepository?.listLearnings(account.id, brand.id).catch(() => []) ?? Promise.resolve([]),
      ]);
      const intelligenceProfile = projectBrandIntelligenceProfile(brain);
      const context = projectBrandIntelligenceContext(brand, brain, learnings);
      const brandContext: HunterRunInput["brand"] = {
        workspaceId: brand.workspaceId,
        brandId: brand.id,
        contextVersion: context.version,
        brandName: context.brandName,
        completeness: context.completeness,
        ...(context.identity ? { identity: context.identity } : {}),
        ...(context.positioning ? { positioning: context.positioning } : {}),
        ...(context.audience ? { audience: context.audience } : {}),
        ...(context.voice ? { voice: context.voice } : {}),
        ...(context.contentStrategy ? { contentStrategy: context.contentStrategy } : {}),
        ...(context.goals ? { goals: context.goals } : {}),
        ...(context.boundaries ? { boundaries: context.boundaries } : {}),
        ...(context.performanceMemory.length ? { performanceMemory: context.performanceMemory } : {}),
      };
      const input: HunterRunInput = {
        accountId: account.id,
        brand: brandContext,
        ...(selectSectorIntelligencePack(intelligenceProfile)
          ? { intelligenceProfile }
          : { query: fallbackPublicQuery(brand, intelligenceProfile, context) }),
        maxEvidence: 8,
      };
      const key = `${account.id}:${brand.id}`;
      let run = inFlight.get(key);
      if (!run) {
        run = options.runner.runForAuthorizedBrand(input).finally(() => inFlight.delete(key));
        inFlight.set(key, run);
      }
      const result = await run;
      return { ...result, brandContextStatus: context.completeness };
    },
  );
}

function fallbackPublicQuery(
  brand: { name: string },
  profile: ReturnType<typeof projectBrandIntelligenceProfile>,
  context: ReturnType<typeof projectBrandIntelligenceContext>,
) {
  return [
    brand.name,
    profile.sector,
    profile.subsector,
    ...profile.topics.slice(0, 3),
    context.identity,
    context.contentStrategy,
    context.goals,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);
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
