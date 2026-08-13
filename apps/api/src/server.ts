import { Pool } from "pg";
import { buildApp } from "./app";
import { OidcJwtVerifier } from "./auth";
import { PgDiscoveryRepository } from "./discovery-postgres-store";
import { PgKairoRepository } from "./postgres-store";
import { PgResearchRepository } from "./research-postgres-store";
import { PgCampaignRepository } from "./campaign-postgres-store";
import {PgReviewRepository}from"./review-postgres-store";import{CriticEvaluationAdapter}from"./critic-adapter";
import{PgPublishingRepository}from"./publishing-postgres-store";
import{PgAnalyticsRepository}from"./analytics-postgres-store";
import{PgLearningRepository}from"./learning-postgres-store";
import{PgOperationsRepository}from"./operations-postgres-store";
import{registerOperationsRoutes}from"./operations-routes";
import{ObservedAgentRuntime}from"./operations-runtime";
import{PgOperationsTelemetrySink}from"./operations-telemetry-postgres";
import {DirectModelRuntime}from"@kairo/worker/agent-runtime";import{openAICompatibleGatewayFromEnv}from"@kairo/worker/model-gateway";import{DrafterGenerationAdapter}from"./drafter-adapter";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const pool = new Pool({ connectionString: requiredEnv("DATABASE_URL") });
const coreStore=new PgKairoRepository(pool);
const operationsStore=new PgOperationsRepository(pool);
const telemetrySink=new PgOperationsTelemetrySink(pool,operationsStore);
const gateway=openAICompatibleGatewayFromEnv();
const baseRuntime=gateway?new DirectModelRuntime({gateway,policy:request=>({qualityTier:"balanced",privacyClass:"brand-private",maxCostUsd:request.budget.maxCostUsd,maxOutputTokens:request.budget.maxOutputTokens,allowedProviders:[]}),validators:{"content-draft@1":value=>!!value&&typeof value==="object"&&typeof(value as{content?:unknown}).content==="string"&&Array.isArray((value as{supportingClaimIds?:unknown}).supportingClaimIds),"critic-review@1":value=>!!value&&typeof value==="object"&&typeof(value as{passed?:unknown}).passed==="boolean"&&typeof(value as{score?:unknown}).score==="number"&&Array.isArray((value as{findings?:unknown}).findings)}}):undefined;
const runtime=baseRuntime?new ObservedAgentRuntime(baseRuntime,telemetrySink):undefined;
const contentGenerator=runtime?new DrafterGenerationAdapter(runtime):undefined;const criticEvaluator=runtime?new CriticEvaluationAdapter(runtime):undefined;
const identityVerifier=new OidcJwtVerifier({
  issuer:requiredEnv("OIDC_ISSUER"),
  audience:requiredEnv("OIDC_AUDIENCE"),
  jwksUri:requiredEnv("OIDC_JWKS_URI"),
});
const app = buildApp({
  store:coreStore,
  discoveryStore: new PgDiscoveryRepository(pool),
  researchStore: new PgResearchRepository(pool),
  campaignStore: new PgCampaignRepository(pool),
  reviewStore:new PgReviewRepository(pool),
  publishingStore:new PgPublishingRepository(pool),
  analyticsStore:new PgAnalyticsRepository(pool),
  learningStore:new PgLearningRepository(pool),
  ...(contentGenerator?{contentGenerator}:{}),
  ...(criticEvaluator?{criticEvaluator}:{}),
  identityVerifier,
  logger: true,
});
registerOperationsRoutes(app,{store:operationsStore,coreStore,identityVerifier});

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
