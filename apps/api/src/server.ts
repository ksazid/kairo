import { Pool } from "pg";
import { buildApp } from "./app";
import { OidcJwtVerifier } from "./auth";
import { PgDiscoveryRepository } from "./discovery-postgres-store";
import { PgKairoRepository } from "./postgres-store";
import { PgResearchRepository } from "./research-postgres-store";
import { PgCampaignRepository } from "./campaign-postgres-store";
import{PgReviewRepository}from"./review-postgres-store";import{CriticEvaluationAdapter}from"./critic-adapter";
import{PgPublishingRepository}from"./publishing-postgres-store";
import{PgAnalyticsRepository}from"./analytics-postgres-store";
import{PgLearningRepository}from"./learning-postgres-store";
import{PgOperationsRepository}from"./operations-postgres-store";
import{registerOperationsRoutes}from"./operations-routes";
import{registerReadinessRoutes}from"./readiness-routes";
import{ObservedAgentRuntime}from"./operations-runtime";
import{PgOperationsTelemetrySink}from"./operations-telemetry-postgres";
import {DirectModelRuntime}from"@kairo/worker/agent-runtime";import{openAICompatibleGatewayFromEnv}from"@kairo/worker/model-gateway";import{DrafterGenerationAdapter}from"./drafter-adapter";
import{PerformanceCollectionWorker}from"@kairo/worker/performance";
import{InstagramMetricCollector}from"@kairo/worker/instagram-insights";
import{InstagramConnectionService}from"./instagram-connection";
import{PgEncryptedChannelCredentialVault,PgInstagramConnectionRepository}from"./instagram-connection-postgres";
import{MetaInstagramOAuthClient}from"./meta-instagram-oauth";
import{registerInstagramConnectionRoutes}from"./instagram-connection-routes";
import{InstagramMetricCollectionRunner,PgMetricCollectionJobStore}from"./instagram-metric-runner";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const pool = new Pool({ connectionString: requiredEnv("DATABASE_URL") });
const coreStore=new PgKairoRepository(pool);
const publishingStore=new PgPublishingRepository(pool);
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
  publishingStore,
  analyticsStore:new PgAnalyticsRepository(pool),
  learningStore:new PgLearningRepository(pool),
  ...(contentGenerator?{contentGenerator}:{}),
  ...(criticEvaluator?{criticEvaluator}:{}),
  identityVerifier,
  logger: true,
});
registerOperationsRoutes(app,{store:operationsStore,coreStore,identityVerifier});
registerReadinessRoutes(app,{releaseSha:requiredEnv("KAIRO_RELEASE_SHA"),check:async()=>{await pool.query("select 1")}});

const meta=metaInstagramConfig();
let instagramMetricRunner:InstagramMetricCollectionRunner|undefined;
if(meta){
  const vault=new PgEncryptedChannelCredentialVault(pool,meta.encryptionKey);
  const connectionRepo=new PgInstagramConnectionRepository(pool);
  const connectionService=new InstagramConnectionService({
    brands:coreStore,
    publishing:publishingStore,
    repo:connectionRepo,
    vault,
    meta:new MetaInstagramOAuthClient(meta.appId,meta.appSecret,meta.graphVersion,meta.redirectUri),
  });
  registerInstagramConnectionRoutes(app,{coreStore,identityVerifier,service:connectionService});
  instagramMetricRunner=new InstagramMetricCollectionRunner(
    new PgMetricCollectionJobStore(pool),
    new PerformanceCollectionWorker([new InstagramMetricCollector(vault,meta.graphVersion)]),
    `api-${process.pid}`,
  );
}

const port = Number(process.env.PORT ?? "4000");
const host = process.env.HOST ?? "0.0.0.0";
let metricTimer:NodeJS.Timeout|undefined;
let metricTickRunning=false;

try {
  await app.listen({ port, host });
  if(instagramMetricRunner){
    void collectMetricTick();
    metricTimer=setInterval(()=>void collectMetricTick(),60_000);
    metricTimer.unref();
  }
} catch (error) {
  app.log.error(error);
  await pool.end();
  process.exit(1);
}

async function collectMetricTick(){
  if(metricTickRunning||!instagramMetricRunner)return;
  metricTickRunning=true;
  try{for(let i=0;i<5;i++)if(!(await instagramMetricRunner.runOnce()))break}catch(error){app.log.error({err:error},"Instagram metric collection tick failed")}finally{metricTickRunning=false}
}

async function shutdown(): Promise<void> {
  if(metricTimer)clearInterval(metricTimer);
  await app.close();
  await pool.end();
}

process.once("SIGTERM", () => void shutdown());
process.once("SIGINT", () => void shutdown());

function metaInstagramConfig(){
  const names=["META_APP_ID","META_APP_SECRET","META_GRAPH_VERSION","META_OAUTH_REDIRECT_URI","CHANNEL_CREDENTIAL_ENCRYPTION_KEY"] as const;
  const values=Object.fromEntries(names.map(name=>[name,process.env[name]?.trim()??""])) as Record<(typeof names)[number],string>;
  if(names.every(name=>!values[name]))return null;
  const missing=names.filter(name=>!values[name]);
  if(missing.length)throw new Error(`Meta Instagram configuration is incomplete: ${missing.join(", ")}`);
  return{appId:values.META_APP_ID,appSecret:values.META_APP_SECRET,graphVersion:values.META_GRAPH_VERSION,redirectUri:values.META_OAUTH_REDIRECT_URI,encryptionKey:values.CHANNEL_CREDENTIAL_ENCRYPTION_KEY};
}
