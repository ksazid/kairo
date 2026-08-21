import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AccountDto } from "@kairo/contracts";
import { DomainValidationError, KairoService, type KairoRepository } from "@kairo/domain";
import type { IdentityVerifier } from "./auth";
import type { BrandCreatorPort } from "./brand-creator";

export interface BrandRouteOptions {
  store: KairoRepository;
  creator: BrandCreatorPort;
  identityVerifier: IdentityVerifier;
}

export function registerBrandRoutes(app: FastifyInstance, options: BrandRouteOptions): void {
  const service = new KairoService(options.store);

  app.post<{ Params: { workspaceId: string }; Body: { brandName?: string } }>(
    "/api/v1/workspaces/:workspaceId/brands",
    async (request, reply) => {
      const account = await authenticate(request, reply, service, options.identityVerifier);
      if (!account) return;
      const brandName = requiredBrandName(request.body?.brandName);
      const brand = await options.creator.createBrand(account.id, request.params.workspaceId, { brandName });
      return reply.status(201).send(brand);
    },
  );
}

async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
  service: KairoService,
  verifier: IdentityVerifier,
): Promise<AccountDto | null> {
  const identity = await verifier.verify(request.headers.authorization);
  if (!identity) {
    await reply.status(401).send({
      type: "https://kairo.local/problems/unauthorized",
      title: "Unauthorized",
      status: 401,
      detail: "A valid bearer token is required.",
      code: "unauthorized",
      correlationId: request.id,
    });
    return null;
  }
  return service.establishSession(identity);
}

function requiredBrandName(value: unknown): string {
  if (typeof value !== "string") throw new DomainValidationError("brandName is required");
  const brandName = value.trim();
  if (!brandName) throw new DomainValidationError("brandName is required");
  if (brandName.length > 120) throw new DomainValidationError("brandName is too long");
  return brandName;
}
