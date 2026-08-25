import type { BrandBrainFieldDto } from "@kairo/contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { DomainValidationError, KairoService, type KairoRepository } from "@kairo/domain";
import { projectBrandIntelligenceProfile } from "@kairo/domain/source-policy";
import type { HunterRunInput, HunterRunResult } from "@kairo/worker/hunter";
import type { IdentityVerifier } from "./auth";

export interface HunterRecommendationRunner {
  runForAuthorizedBrand(input: HunterRunInput): Promise<HunterRunResult>;
}

export function registerHunterRecommendationRoutes(app: FastifyInstance, options: {
  store: KairoRepository;
  identityVerifier: IdentityVerifier;
  runner?: HunterRecommendationRunner;
}) {
  const core = new KairoService(options.store);
  const inFlight = new Map<string, Promise<HunterRunResult>>();

  app.post<{ Params: { brandId: string } }>(
    "/api/v1/brands/:brandId/recommendations",
    async (request, reply) => {
      const account = await authenticate(request, reply, core, options.identityVerifier);
      if (!account) return;

      const brand = await core.getBrand(account.id, request.params.brandId);
      const brain = await core.listBrandBrain(account.id, brand.id);
      const intelligenceProfile = projectBrandIntelligenceProfile(brain);
      if (!intelligenceProfile.sector && !intelligenceProfile.subsector) {
        throw new DomainValidationError("Add a Brand category or sector before asking Kairo for recommendations");
      }

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

      const input: HunterRunInput = {
        accountId: account.id,
        brand: projectBrandContext(brand, brain),
        intelligenceProfile,
        maxEvidence: 8,
      };
      const key = `${account.id}:${brand.id}`;
      let run = inFlight.get(key);
      if (!run) {
        run = options.runner.runForAuthorizedBrand(input).finally(() => inFlight.delete(key));
        inFlight.set(key, run);
      }

      try {
        return await run;
      } catch (error) {
        if (error instanceof Error && /No Sector Intelligence Pack matches/i.test(error.message)) {
          throw new DomainValidationError("Kairo does not have a discovery pack for this Brand category yet");
        }
        throw error;
      }
    },
  );
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
