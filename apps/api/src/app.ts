import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import type {
  AccountDto,
  CreateKnowledgeSourceRequest,
  CreateWorkspaceWithBrandRequest,
  ProblemDetails,
  PutBrandBrainFieldRequest,
} from "@kairo/contracts";
import {
  ConcurrencyConflictError,
  DomainValidationError,
  KairoService,
  ResourceNotFoundError,
  type KairoRepository,
} from "@kairo/domain";
import type { IdentityVerifier } from "./auth";

export interface BuildAppOptions {
  store: KairoRepository;
  identityVerifier: IdentityVerifier;
  logger?: boolean;
}

export function buildApp(options: BuildAppOptions): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false });
  const service = new KairoService(options.store);

  app.addHook("onRequest", async (request, reply) => { reply.header("x-correlation-id", request.id); });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof DomainValidationError) return reply.status(400).send(problem(400, "Invalid request", error.message, error.code, request.id));
    if (error instanceof ResourceNotFoundError) return reply.status(404).send(problem(404, "Not found", error.message, error.code, request.id));
    if (error instanceof ConcurrencyConflictError) return reply.status(409).send(problem(409, "Conflict", error.message, error.code, request.id));
    request.log.error({ err: error }, "request failed");
    return reply.status(500).send(problem(500, "Internal server error", undefined, "internal_error", request.id));
  });

  app.get("/health", async () => ({ status: "ok" }));

  app.get("/api/v1/session", async (request, reply) => {
    const account = await authenticate(request, reply, service, options.identityVerifier);
    if (!account) return;
    return { account, workspaces: await service.listWorkspaces(account.id) };
  });

  app.get("/api/v1/workspaces", async (request, reply) => {
    const account = await authenticate(request, reply, service, options.identityVerifier);
    if (!account) return;
    return service.listWorkspaces(account.id);
  });

  app.post<{ Body: CreateWorkspaceWithBrandRequest }>("/api/v1/workspaces", async (request, reply) => {
    const account = await authenticate(request, reply, service, options.identityVerifier);
    if (!account) return;
    const created = await service.createInitialWorkspace(account.id, request.body ?? ({} as CreateWorkspaceWithBrandRequest));
    return reply.status(201).send(created);
  });

  app.get<{ Params: { workspaceId: string } }>("/api/v1/workspaces/:workspaceId/brands", async (request, reply) => {
    const account = await authenticate(request, reply, service, options.identityVerifier);
    if (!account) return;
    return service.listBrands(account.id, request.params.workspaceId);
  });

  app.get<{ Params: { brandId: string } }>("/api/v1/brands/:brandId", async (request, reply) => {
    const account = await authenticate(request, reply, service, options.identityVerifier);
    if (!account) return;
    return service.getBrand(account.id, request.params.brandId);
  });

  app.get<{ Params: { brandId: string } }>("/api/v1/brands/:brandId/brain", async (request, reply) => {
    const account = await authenticate(request, reply, service, options.identityVerifier);
    if (!account) return;
    return service.listBrandBrain(account.id, request.params.brandId);
  });

  app.put<{ Params: { brandId: string; fieldKey: string }; Body: PutBrandBrainFieldRequest }>(
    "/api/v1/brands/:brandId/brain/:fieldKey",
    async (request, reply) => {
      const account = await authenticate(request, reply, service, options.identityVerifier);
      if (!account) return;
      return service.putBrandBrainField(account.id, request.params.brandId, request.params.fieldKey, request.body ?? ({} as PutBrandBrainFieldRequest));
    },
  );

  app.get<{ Params: { brandId: string } }>("/api/v1/brands/:brandId/sources", async (request, reply) => {
    const account = await authenticate(request, reply, service, options.identityVerifier);
    if (!account) return;
    return service.listKnowledgeSources(account.id, request.params.brandId);
  });

  app.post<{ Params: { brandId: string }; Body: CreateKnowledgeSourceRequest }>("/api/v1/brands/:brandId/sources", async (request, reply) => {
    const account = await authenticate(request, reply, service, options.identityVerifier);
    if (!account) return;
    const source = await service.createKnowledgeSource(account.id, request.params.brandId, request.body ?? ({} as CreateKnowledgeSourceRequest));
    return reply.status(201).send(source);
  });

  app.post<{ Params: { brandId: string; sourceId: string } }>("/api/v1/brands/:brandId/sources/:sourceId/disable", async (request, reply) => {
    const account = await authenticate(request, reply, service, options.identityVerifier);
    if (!account) return;
    return service.setKnowledgeSourceStatus(account.id, request.params.brandId, request.params.sourceId, "disabled");
  });

  app.post<{ Params: { brandId: string; sourceId: string } }>("/api/v1/brands/:brandId/sources/:sourceId/enable", async (request, reply) => {
    const account = await authenticate(request, reply, service, options.identityVerifier);
    if (!account) return;
    return service.setKnowledgeSourceStatus(account.id, request.params.brandId, request.params.sourceId, "active");
  });

  app.delete<{ Params: { brandId: string; sourceId: string } }>("/api/v1/brands/:brandId/sources/:sourceId", async (request, reply) => {
    const account = await authenticate(request, reply, service, options.identityVerifier);
    if (!account) return;
    return service.removeKnowledgeSource(account.id, request.params.brandId, request.params.sourceId);
  });

  return app;
}

async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
  service: KairoService,
  verifier: IdentityVerifier,
): Promise<AccountDto | null> {
  const identity = await verifier.verify(request.headers.authorization);
  if (!identity) {
    await reply.status(401).send(problem(401, "Unauthorized", "A valid bearer token is required.", "unauthorized", request.id));
    return null;
  }
  return service.establishSession(identity);
}

function problem(status: number, title: string, detail: string | undefined, code: string, correlationId: string): ProblemDetails {
  return { type: `https://kairo.local/problems/${code}`, title, status, ...(detail ? { detail } : {}), code, correlationId };
}
