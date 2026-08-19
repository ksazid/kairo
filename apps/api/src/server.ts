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
import{registerGuidedBrandBrainRoutes}from"./guided-brand-brain-routes";
import{PgChannelAccountGroupRepository}from"./channel-account-group-postgres-store";
import{registerChannelAccountGroupRoutes}from"./channel-account-group-routes";
import{PgContentAssetLibraryRepository}from"./content-asset-library-postgres-store";
import{registerContentAssetLibraryRoutes}from"./content-asset-library-routes";
import{registerContentAssetSelectionRoutes}from"./content-asset-selection-routes";
import{GoogleDriveContentAssetService}from"./google-drive-content-assets";
import{GoogleDriveOAuthClient}from"./google-drive-content-assets-client";
import{PgEncryptedContentAssetCredentialVault,PgGoogleDriveConnectionRepository}from"./google-drive-content-assets-postgres";
import{registerGoogleDriveContentAssetRoutes}from"./google-drive-content-assets-routes";
import{ObservedAgentRuntime}from"./operations-runtime";
import{PgOperationsTelemetrySink}from"./operations-telemetry-postgres";
import {AgentRuntimeRouter,DirectModelRuntime,hermesBridgeRuntimeFromEnv}from"@kairo/worker/agent-runtime";import{openAICompatibleGatewayFromEnv}from"@kairo/worker/model-gateway";import{BrandBrainBuilder}from"@kairo/worker/brand-brain-builder";import{DrafterGenerationAdapter}from"./drafter-adapter";
import{validateCarouselPlan}from"@kairo/domain/creative-formats";
import{PerformanceCollectionWorker}from"@kairo/worker/performance";
import{InstagramMetricCollector}from"@kairo/worker/instagram-insights";
import{InstagramConnectionService}from"./instagram-connection";
import{PgEncryptedChannelCredentialVault,PgInstagramConnectionRepository}from"./instagram-connection-postgres";
import{MetaInstagramOAuthClient}from"./meta-instagram-oauth";
import{registerInstagramConnectionRoutes}from"./instagram-connection-routes";
import{InstagramMetricCollectionRunner,PgMetricCollectionJobStore}from"./instagram-metric-runner";
import{
  executeMarketingShadowEvidenceAttempt,
  marketingShadowEvidenceRequestFromEnv,
  PgMarketingShadowEvidenceRunStore,
  safeFailureKind,
}from"./marketing-shadow-evidence-run";
import{directModelProviderDiagnosticRequested,runDirectModelProviderDiagnostic}from"./direct-model-diagnostic";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const pool = new Pool({ connectionString: requiredEnv("DATABASE_URL") });
const coreStore=new PgKairoRepository(pool);
const campaignStore=new PgCampaignRepository(pool);
const publishingStore=new PgPublishingRepository(pool);
const groupStore=new PgChannelAccountGroupRepository(pool);
const contentAssetLibraryStore=new PgContentAssetLibraryRepository(pool);
const operationsStore=new PgOperationsRepository(pool);
const telemetrySink=new PgOperationsTelemetrySink(pool,operationsStore);
const agentOutputValidators={
  "content-draft@1":(value:unknown)=>!!value&&typeof value==="object"&&typeof(value as{content?:unknown}).content==="string"&&Array.isArray((value as{supportingClaimIds?:unknown}).supportingClaimIds),
  "critic-review@1":(value:unknown)=>!!value&&typeof value==="object"&&typeof(value as{passed?:unknown}).passed==="boolean"&&typeof(value as{score?:unknown}).score==="number"&&Array.isArray((value as{findings?:unknown}).findings),
  "brand-brain-proposals@1":(value:unknown)=>!!value&&typeof value==="object"&&Array.isArray((value as{proposals?:unknown}).proposals),
  "marketing-carousel-plan@1":(value:unknown)=>{try{validateCarouselPlan(value as Parameters<typeof validateCarouselPlan>[0]);return true}catch{return false}},
};
const evidenceRequest=marketingShadowEvidenceRequestFromEnv();
const evidenceStore=evidenceRequest?new PgMarketingShadowEvidenceRunStore(pool):undefined;
const directModelDiagnosticRequested=directModelProviderDiagnosticRequested();
const gateway=openAICompatibleGatewayFromEnv();
const directRuntime=gateway?new DirectModelRuntime({gateway,policy:request=>({qualityTier:"balanced",privacyClass:"brand-private",maxCostUsd:request.budget.maxCostUsd,maxOutputTokens:request.budget.maxOutputTokens,allowedProviders:[]}),validators:agentOutputValidators}):null;
const directModelDiagnosticRuntime=gateway&&directModelDiagnosticRequested?new DirectModelRuntime({gateway,policy:request=>({qualityTier:"balanced",privacyClass:"global-public",maxCostUsd:request.budget.maxCostUsd,maxOutputTokens:request.budget.maxOutputTokens,allowedProviders:[]}),validators:{"direct-model-diagnostic@1":(value:unknown)=>!!value&&typeof value==="object"&&!Array.isArray(value)&&(value as{ok?:unknown}).ok===true&&Object.keys(value as Record<string,unknown>).length===1}}):null;
const hermesRuntime=hermesBridgeRuntimeFromEnv(agentOutputValidators);
const baseRuntime=hermesRuntime&&directRuntime?new AgentRuntimeRouter(hermesRuntime,directRuntime):(hermesRuntime??directRuntime??undefined);
const runtime=baseRuntime?new ObservedAgentRuntime(baseRuntime,telemetrySink):undefined;
const contentGenerator=runtime?new DrafterGenerationAdapter(runtime):undefined;const criticEvaluator=runtime?new CriticEvaluationAdapter(runtime):undefined;const brandBrainGenerator=runtime?new BrandBrainBuilder(runtime):undefined;
const identityVerifier=new OidcJwtVerifier({
  issuer:requiredEnv("OIDC_ISSUER"),
  audience:requiredEnv("OIDC_AUDIENCE"),
  jwksUri:requiredEnv("OIDC_JWKS_URI"),
});
const app = buildApp({
  store:coreStore,
  discoveryStore: new PgDiscoveryRepository(pool),
  researchStore: new PgResearchRepository(pool),
  campaignStore,
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
registerGuidedBrandBrainRoutes(app,{store:coreStore,identityVerifier,...(brandBrainGenerator?{generator:brandBrainGenerator}:{})});
registerChannelAccountGroupRoutes(app,{coreStore,groupStore,channelStore:publishingStore,identityVerifier});
registerContentAssetLibraryRoutes(app,{coreStore,libraryStore:contentAssetLibraryStore,identityVerifier});
registerContentAssetSelectionRoutes(app,{coreStore,campaignStore,libraryStore:contentAssetLibraryStore,identityVerifier});

const googleDrive=googleDriveConfig();
let googleDriveService:GoogleDriveContentAssetService|undefined;
if(googleDrive){
  googleDriveService=new GoogleDriveContentAssetService({
    brands:coreStore,
    libraries:contentAssetLibraryStore,
    connections:new PgGoogleDriveConnectionRepository(pool),
    vault:new PgEncryptedContentAssetCredentialVault(pool,googleDrive.encryptionKey),
    oauth:new GoogleDriveOAuthClient(googleDrive.clientId,googleDrive.clientSecret,googleDrive.redirectUri),
    picker:{developerKey:googleDrive.pickerApiKey,appId:googleDrive.pickerAppId},
  });
}
registerGoogleDriveContentAssetRoutes(app,{coreStore,identityVerifier,...(googleDriveService?{service:googleDriveService}:{})});
registerReadinessRoutes(app,{releaseSha:requiredEnv("KAIRO_RELEASE_SHA"),check:async()=>{await pool.query("select 1")}});

const meta=metaInstagramConfig();
let instagramMetricRunner:InstagramMetricCollectionRunner|undefined;
let instagramConnectionRepo:PgInstagramConnectionRepository|undefined;
if(meta){
  const vault=new PgEncryptedChannelCredentialVault(pool,meta.encryptionKey);
  instagramConnectionRepo=new PgInstagramConnectionRepository(pool);
  const connectionService=new InstagramConnectionService({
    brands:coreStore,
    publishing:publishingStore,
    repo:instagramConnectionRepo,
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
let evidenceTimer:NodeJS.Timeout|undefined;
let evidenceTickRunning=false;
let evidenceTerminal=false;

try {
  await app.listen({ port, host });
  if(instagramMetricRunner){
    void collectMetricTick();
    metricTimer=setInterval(()=>void collectMetricTick(),60_000);
    metricTimer.unref();
  }
  if(directModelDiagnosticRequested){
    if(!directModelDiagnosticRuntime){
      app.log.error("KAIRO_DIRECT_MODEL_PROVIDER_DIAGNOSTIC_FAILED: DirectModelRuntime is not configured");
    }else{
      void runDirectModelProviderDiagnostic(directModelDiagnosticRuntime)
        .then(metadata=>app.log.warn({metadata},"KAIRO_DIRECT_MODEL_PROVIDER_DIAGNOSTIC_OK"))
        .catch(error=>app.log.error({err:error},"KAIRO_DIRECT_MODEL_PROVIDER_DIAGNOSTIC_FAILED"));
    }
  }
  if(evidenceRequest){
    if(!directRuntime){
      evidenceTerminal=true;
      app.log.error({runId:evidenceRequest.runId,releaseSha:evidenceRequest.releaseSha},"KAIRO_MARKETING_SHADOW_EVIDENCE_FAILED: DirectModelRuntime is not configured");
    }else{
      void collectEvidenceTick();
      evidenceTimer=setInterval(()=>void collectEvidenceTick(),5_000);
      evidenceTimer.unref();
    }
  }
} catch (error) {
  app.log.error(error);
  await pool.end();
  process.exit(1);
}

async function collectMetricTick(){
  if(metricTickRunning||!instagramMetricRunner)return;
  metricTickRunning=true;
  try{
    const at=new Date().toISOString();
    await instagramConnectionRepo?.purgeExpiredPendingCredentials(at);
    await instagramConnectionRepo?.markExpiredConnectionsReconnectRequired(at);
    for(let i=0;i<5;i++)if(!(await instagramMetricRunner.runOnce()))break;
  }catch(error){app.log.error({err:error},"Instagram maintenance tick failed")}finally{metricTickRunning=false}
}

async function collectEvidenceTick(){
  if(evidenceTickRunning||evidenceTerminal||!evidenceRequest||!directRuntime||!evidenceStore)return;
  evidenceTickRunning=true;
  try{
    const result=await executeMarketingShadowEvidenceAttempt(evidenceStore,directRuntime,evidenceRequest);
    if(result.kind==="skipped"){
      if(result.priorStatus==="not-authorized")return;
      evidenceTerminal=true;
      stopEvidenceTimer();
      app.log.warn({runId:evidenceRequest.runId,releaseSha:evidenceRequest.releaseSha,priorStatus:result.priorStatus},"KAIRO_MARKETING_SHADOW_EVIDENCE_SKIPPED_ALREADY_CONSUMED");
      return;
    }
    evidenceTerminal=true;
    stopEvidenceTimer();
    app.log.info({
      runId:evidenceRequest.runId,
      releaseSha:evidenceRequest.releaseSha,
      persisted:true,
      pairCount:result.evidence.pairs.length,
      runtimeRoute:result.evidence.runtimeRoute,
    },"KAIRO_MARKETING_SHADOW_EVIDENCE_COMPLETE");
  }catch(error){
    const failureKind=safeFailureKind(error);
    let status:Awaited<ReturnType<PgMarketingShadowEvidenceRunStore["status"]>>|undefined;
    try{status=await evidenceStore.status(evidenceRequest.runId,evidenceRequest.releaseSha)}catch{}
    if(status==="authorized"){
      app.log.warn({runId:evidenceRequest.runId,releaseSha:evidenceRequest.releaseSha,failureKind},"KAIRO_MARKETING_SHADOW_EVIDENCE_CONTROL_RETRY");
      return;
    }
    if(status===undefined){
      app.log.error({runId:evidenceRequest.runId,releaseSha:evidenceRequest.releaseSha,failureKind},"KAIRO_MARKETING_SHADOW_EVIDENCE_CONTROL_CHECK_FAILED");
      return;
    }
    evidenceTerminal=true;
    stopEvidenceTimer();
    app.log.error({runId:evidenceRequest.runId,releaseSha:evidenceRequest.releaseSha,status,failureKind},"KAIRO_MARKETING_SHADOW_EVIDENCE_FAILED");
  }finally{evidenceTickRunning=false}
}

function stopEvidenceTimer(){if(evidenceTimer){clearInterval(evidenceTimer);evidenceTimer=undefined}}

async function shutdown(): Promise<void> {
  if(metricTimer)clearInterval(metricTimer);
  stopEvidenceTimer();
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

function googleDriveConfig(){
  const names=["GOOGLE_DRIVE_CLIENT_ID","GOOGLE_DRIVE_CLIENT_SECRET","GOOGLE_DRIVE_OAUTH_REDIRECT_URI","GOOGLE_DRIVE_PICKER_API_KEY","GOOGLE_DRIVE_PICKER_APP_ID","CONTENT_ASSET_CREDENTIAL_ENCRYPTION_KEY"] as const;
  const values=Object.fromEntries(names.map(name=>[name,process.env[name]?.trim()??""])) as Record<(typeof names)[number],string>;
  if(names.every(name=>!values[name]))return null;
  const missing=names.filter(name=>!values[name]);
  if(missing.length)throw new Error(`Google Drive Content Asset configuration is incomplete: ${missing.join(", ")}`);
  return{clientId:values.GOOGLE_DRIVE_CLIENT_ID,clientSecret:values.GOOGLE_DRIVE_CLIENT_SECRET,redirectUri:values.GOOGLE_DRIVE_OAUTH_REDIRECT_URI,pickerApiKey:values.GOOGLE_DRIVE_PICKER_API_KEY,pickerAppId:values.GOOGLE_DRIVE_PICKER_APP_ID,encryptionKey:values.CONTENT_ASSET_CREDENTIAL_ENCRYPTION_KEY};
}
