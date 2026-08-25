import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { KairoService, type KairoRepository } from "@kairo/domain";
import type { IdentityVerifier } from "./auth";
import { HomeMediaService, type BeginHomeMediaUploadInput } from "./home-media";

export function registerHomeMediaRoutes(
  app: FastifyInstance,
  options: {
    coreStore: KairoRepository;
    identityVerifier: IdentityVerifier;
    service?: HomeMediaService;
  },
) {
  const core = new KairoService(options.coreStore);

  app.get<{ Params: { brandId: string } }>("/api/v1/brands/:brandId/home-media", async (request, reply) => {
    const context = await authorize(request, reply, core, options.identityVerifier);
    if (!context) return;
    const brand = await core.getBrand(context.id, request.params.brandId);
    const service = requireService(options.service, reply, request.id);
    if (!service) return;
    return service.list(context.id, brand.id);
  });

  app.post<{ Params: { brandId: string }; Body: BeginHomeMediaUploadInput }>(
    "/api/v1/brands/:brandId/home-media/uploads",
    async (request, reply) => {
      const context = await authorize(request, reply, core, options.identityVerifier);
      if (!context) return;
      const brand = await core.getBrand(context.id, request.params.brandId);
      const service = requireService(options.service, reply, request.id);
      if (!service) return;
      return reply.status(201).send(await service.begin(context.id, brand.workspaceId, brand.id, request.body));
    },
  );

  app.post<{ Params: { brandId: string; uploadId: string } }>(
    "/api/v1/brands/:brandId/home-media/uploads/:uploadId/complete",
    async (request, reply) => {
      const context = await authorize(request, reply, core, options.identityVerifier);
      if (!context) return;
      const brand = await core.getBrand(context.id, request.params.brandId);
      const service = requireService(options.service, reply, request.id);
      if (!service) return;
      return service.complete(context.id, brand.id, request.params.uploadId);
    },
  );
}

function requireService(service: HomeMediaService | undefined, reply: FastifyReply, correlationId: string) {
  if (service) return service;
  void reply.status(503).send({
    type: "about:blank",
    title: "Media storage unavailable",
    status: 503,
    detail: "Private media storage is not configured for this environment.",
    code: "media-storage-unavailable",
    correlationId,
  });
  return null;
}

async function authorize(
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
