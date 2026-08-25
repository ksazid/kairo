import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AccountDto, BrandBrainFieldDto, BrandDto } from "@kairo/contracts";
import { KairoService, type KairoRepository } from "@kairo/domain";
import type { IdentityVerifier } from "./auth";

export interface HunterRunResultView {
  evidenceCount: number;
  candidateCount: number;
  opportunityCount: number;
  degradedSources?: string[];
}

export interface HunterRunnerPort {
  run(input: {
    accountId: string;
    brand: BrandDto;
    brain: BrandBrainFieldDto[];
  }): Promise<HunterRunResultView>;
}

export function registerHunterRoutes(app: FastifyInstance, options: {
  coreStore: KairoRepository;
  identityVerifier: IdentityVerifier;
  runner?: HunterRunnerPort;
}) {
  const core = new KairoService(options.coreStore);
  const activeRuns = new Map<string, Promise<HunterRunResultView>>();

  app.post<{ Params: { brandId: string } }>("/api/v1/brands/:brandId/hunter/run", async (request, reply) => {
    const account = await authenticate(request, reply, core, options.identityVerifier);
    if (!account) return;

    const brand = await core.getBrand(account.id, request.params.brandId);
    if (!options.runner) {
      return reply.status(503).send({
        type: "https://kairo.local/problems/hunter_unavailable",
        title: "Hunter unavailable",
        status: 503,
        detail: "Recommendation discovery is not configured for this environment.",
        code: "hunter_unavailable",
        correlationId: request.id,
      });
    }

    const runKey = `${account.id}:${brand.id}`;
    const active = activeRuns.get(runKey);
    if (active) {
      const result = await active;
      return { status: "reused-active" as const, ...result };
    }

    const brain = await core.listBrandBrain(account.id, brand.id);
    const run = options.runner.run({ accountId: account.id, brand, brain });
    activeRuns.set(runKey, run);
    try {
      const result = await run;
      return { status: "completed" as const, ...result };
    } finally {
      if (activeRuns.get(runKey) === run) activeRuns.delete(runKey);
    }
  });
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
