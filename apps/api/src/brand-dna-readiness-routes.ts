import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { evaluateBrandDnaReadiness, KairoService, type KairoRepository } from "@kairo/domain";
import { createBrandBrainActivationSnapshot } from "@kairo/domain/brand-brain-activation";
import { projectBrandIntelligenceSnapshot } from "@kairo/domain/brand-intelligence-snapshot";
import type { IdentityVerifier } from "./auth";

export function registerBrandDnaReadinessRoutes(app: FastifyInstance, options: { store: KairoRepository; identityVerifier: IdentityVerifier }): void {
  const core = new KairoService(options.store);

  app.get<{ Params: { brandId: string } }>("/api/v1/brands/:brandId/brain/readiness", async (request, reply) => {
    const account = await authenticate(request, reply, core, options.identityVerifier);
    if (!account) return;
    const fields = await core.listBrandBrain(account.id, request.params.brandId);
    return evaluateBrandDnaReadiness(fields);
  });

  app.get<{ Params: { brandId: string } }>("/api/v1/brands/:brandId/brain/activation", async (request, reply) => {
    const account = await authenticate(request, reply, core, options.identityVerifier);
    if (!account) return;
    const [brand, brain, sources] = await Promise.all([
      core.getBrand(account.id, request.params.brandId),
      core.listBrandBrain(account.id, request.params.brandId),
      core.listKnowledgeSources(account.id, request.params.brandId),
    ]);
    const activation = createBrandBrainActivationSnapshot(brain, sources);
    const intelligenceSnapshot = projectBrandIntelligenceSnapshot({ brand, fields: brain, sources, activation });
    return {
      brain,
      sources,
      ...activation,
      intelligenceSnapshot,
    };
  });
}

async function authenticate(request: FastifyRequest, reply: FastifyReply, core: KairoService, verifier: IdentityVerifier) {
  const identity = await verifier.verify(request.headers.authorization);
  if (!identity) {
    await reply.status(401).send({ type: "about:blank", title: "Unauthorized", status: 401, detail: "Authentication is required", code: "unauthorized", correlationId: request.id });
    return null;
  }
  return core.establishSession(identity);
}
