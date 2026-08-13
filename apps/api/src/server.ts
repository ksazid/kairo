import { Pool } from "pg";
import { buildApp } from "./app";
import { OidcJwtVerifier } from "./auth";
import { PgDiscoveryRepository } from "./discovery-postgres-store";
import { PgKairoRepository } from "./postgres-store";
import { PgResearchRepository } from "./research-postgres-store";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const pool = new Pool({ connectionString: requiredEnv("DATABASE_URL") });
const app = buildApp({
  store: new PgKairoRepository(pool),
  discoveryStore: new PgDiscoveryRepository(pool),
  researchStore: new PgResearchRepository(pool),
  identityVerifier: new OidcJwtVerifier({
    issuer: requiredEnv("OIDC_ISSUER"),
    audience: requiredEnv("OIDC_AUDIENCE"),
    jwksUri: requiredEnv("OIDC_JWKS_URI"),
  }),
  logger: true,
});

const port = Number(process.env.PORT ?? "4000");
const host = process.env.HOST ?? "127.0.0.1";

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  await pool.end();
  process.exit(1);
}

async function shutdown(): Promise<void> {
  await app.close();
  await pool.end();
}

process.once("SIGTERM", () => void shutdown());
process.once("SIGINT", () => void shutdown());
