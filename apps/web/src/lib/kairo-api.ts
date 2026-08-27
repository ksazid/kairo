import { cookies } from "next/headers";
import type {
  BrandBrainFieldDto,
  BrandDto,
  BrandOpportunityDto,
  CreateKnowledgeSourceRequest,
  CreateWorkspaceWithBrandRequest,
  CreateWorkspaceWithBrandResponse,
  KnowledgeSourceDto,
  OpportunityAction,
  PutBrandBrainFieldRequest,
  SessionResponse,
  CommandSearchResponse,
  BrandNotificationsDto,
} from "@kairo/contracts";

export class KairoApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export interface IdeaSummary { id: string; workspaceId: string; brandId: string; title: string; premise: string; source: { type: "user" } | { type: "opportunity"; opportunityId: string }; status: "new" | "researching" | "research-ready" | "angles-ready"; createdAt: string }
export interface ResearchEvidence { id: string; sourceUrl: string; sourceTitle: string; publishedAt?: string; retrievedAt: string }
export interface ResearchClaim { id: string; text: string; classification: "fact" | "brand-opinion" | "uncertain-inference"; confidence: number; evidenceStrength: "weak" | "moderate" | "strong"; verificationState: "supported" | "contradicted" | "unresolved"; freshness: "fresh" | "aging" | "stale" | "unknown"; evidenceIds: string[] }
export interface ResearchDossierView { id: string; summary: string; evidence: ResearchEvidence[]; claims: ResearchClaim[]; unresolvedUncertainties: string[]; createdAt: string }
export interface AngleView { id: string; title: string; framing: string; audience: string; objective: string; hookDirection: string; expectedValue: string; effort: "low" | "medium" | "high"; recommendedFormat: string; recommendedChannel: string; supportingClaimIds: string[]; status: "candidate" | "selected"; version: number }
export interface IdeaBundleView { idea: IdeaSummary; research: ResearchDossierView | null; angles: AngleView[] }
export interface CampaignView { id:string;workspaceId:string;brandId:string;ideaId:string;researchId:string;angleId:string;name:string;objective:string;supportingClaimIds:string[];status:"draft";createdAt:string }
export interface ContentAssetView { id:string;campaignId:string;channel:"linkedin"|"instagram"|"facebook"|"manual";format:string;audience:string;topic:string;hookType:string;cta:string;currentVersion:number;status:"draft";createdAt:string }
export interface ContentVersionView { id:string;assetId:string;version:number;parentVersionId:string|null;content:string;supportingClaimIds:string[];actor:"user"|"ai";action:string;createdAt:string;libraryAssetRefs?:Array<{libraryAssetId:string;name:string;kind:"image"|"video"|"document"|"other";mimeType:string;previewRef?:string;providerRef?:string}>;provenance?:{runtime:string;provider?:string;model?:string;costUsd?:number;latencyMs:number} }
export interface CampaignDetailView { campaign:CampaignView;assets:Array<{asset:ContentAssetView;versions:ContentVersionView[]}> }
export interface ContentReviewView { id:string;versionId:string;version:number;status:"review"|"revision-required"|"passed"|"archived";revisionCycle:number;requestedAt:string;completedAt?:string;truth:{passed:boolean;findings:Array<{code:string;severity:"hard-fail";claimId?:string;message:string}>};critic?:{passed:boolean;score:number;findings:Array<{code:string;severity:"advisory"|"revision";message:string}>} }
export interface ContentApprovalView { id:string;versionId:string;version:number;reviewId:string;approverAccountId:string;destination:{channel:"linkedin"|"instagram"|"facebook"|"manual";accountRef:string};approvedAt:string }
export interface ContentReviewStatusView { review:ContentReviewView|null;approval:ContentApprovalView|null }
export interface ChannelAccountView{id:string;workspaceId:string;brandId:string;channel:"linkedin"|"instagram"|"facebook"|"manual";authMethod?:"instagram-login"|"facebook-login"|"provider-native";accountRef:string;displayName:string;capabilities:Array<"publish-text"|"publish-image"|"publish-video"|"publish-carousel"|"publish-reel">;status:"connected"|"reconnect-required"|"disabled";connectedAt:string}
export interface PublishCommandView{id:string;workspaceId:string;brandId:string;campaignId:string;assetId:string;versionId:string;version:number;approvalId:string;channelAccountId:string;channel:"linkedin"|"instagram"|"facebook"|"manual";accountRef:string;contentType:"text"|"image"|"video"|"carousel";scheduledFor:string;status:"scheduled"|"dispatching"|"published"|"failed"|"unknown"|"manual-required"|"cancelled";attemptCount:number;createdAt:string;lastAttemptAt?:string}
export interface PerformanceMetricView{id:string;workspaceId:string;brandId:string;publishedPostId:string;name:string;capturedAt:string;status:"available"|"unavailable";value?:number;reason?:string;sourceSnapshotId:string;sourceField:string;transformationVersion:string}
export interface LearningView{id:string;workspaceId:string;brandId:string;statement:string;interpretation:string;confidence:number;period:{from:string;to:string};applicability:{channel?:string;audience?:string;format?:string};patterns:Array<{dimension:"topic"|"hook"|"structure"|"template"|"format"|"timing";value:string;observation:string;evidence:Array<{publishedPostId:string;metricObservationIds:string[]}>}>;evidence:Array<{publishedPostId:string;metricObservationIds:string[]}>;contradictions:Array<{publishedPostId:string;metricObservationIds:string[];note:string}>;status:"candidate"|"accepted"|"rejected"|"superseded";version:number;createdAt:string}
export interface ExperimentView{id:string;workspaceId:string;brandId:string;hypothesis:string;variants:Array<{id:string;description:string}>;primaryMetric:string;status:"draft"|"completed";createdAt:string;winnerVariantId?:string;resultSummary?:string}

function apiBase(): string { return (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, ""); }
async function accessToken(): Promise<string | null> { return (await cookies()).get("kairo_access_token")?.value ?? null; }

async function authorizedFetch(path: string, init?: RequestInit): Promise<Response | null> {
  const token = await accessToken();
  if (!token) return null;
  return fetch(`${apiBase()}${path}`, {
    ...init,
    cache: "no-store",
    headers: { authorization: `Bearer ${token}`, ...(init?.body != null ? { "content-type": "application/json" } : {}), ...(init?.headers ?? {}) },
  });
}

async function bodyOrError<T>(response: Response | null, fallback: string): Promise<T> {
  if (!response) throw new KairoApiError("Authentication is required", 401);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new KairoApiError(body?.detail ?? fallback, response.status);
  }
  return (await response.json()) as T;
}

export async function getSession(): Promise<SessionResponse | null> {
  const response = await authorizedFetch("/api/v1/session");
  if (!response?.ok) return null;
  return (await response.json()) as SessionResponse;
}

export async function getBrands(workspaceId: string): Promise<BrandDto[]> {
  const response = await authorizedFetch(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/brands`);
  if (!response?.ok) return [];
  return (await response.json()) as BrandDto[];
}

export async function getBrand(brandId: string): Promise<BrandDto | null> {
  const response = await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}`);
  if (!response?.ok) return null;
  return (await response.json()) as BrandDto;
}

export async function deleteBrand(brandId: string): Promise<void> {
  const response = await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}`, { method: "DELETE" });
  if (!response) throw new KairoApiError("Authentication is required", 401);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new KairoApiError(body?.detail ?? "Unable to delete Brand", response.status);
  }
}

export async function searchCommands(query: string, options: { brandId?: string; limit?: number } = {}): Promise<CommandSearchResponse> {
  const params = new URLSearchParams({ q: query });
  if (options.brandId) params.set("brandId", options.brandId);
  if (options.limit) params.set("limit", String(options.limit));
  return bodyOrError(await authorizedFetch(`/api/v1/command-search?${params}`), "Unable to search Kairo");
}

export async function getBrandNotifications(brandId:string):Promise<BrandNotificationsDto>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/notifications`),"Unable to load notifications")}

export async function createWorkspaceWithBrand(input: CreateWorkspaceWithBrandRequest): Promise<CreateWorkspaceWithBrandResponse> {
  return bodyOrError(await authorizedFetch("/api/v1/workspaces", { method: "POST", body: JSON.stringify(input) }), "Unable to create Workspace and Brand");
}

export async function getBrandBrain(brandId: string): Promise<BrandBrainFieldDto[]> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/brain`), "Unable to load Brand Brain");
}

export async function putBrandBrainField(brandId: string, fieldKey: string, input: PutBrandBrainFieldRequest): Promise<BrandBrainFieldDto> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/brain/${encodeURIComponent(fieldKey)}`, { method: "PUT", body: JSON.stringify(input) }), "Unable to save Brand Brain field");
}

export async function getKnowledgeSources(brandId: string): Promise<KnowledgeSourceDto[]> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/sources`), "Unable to load Knowledge sources");
}

export async function createKnowledgeSource(brandId: string, input: CreateKnowledgeSourceRequest): Promise<KnowledgeSourceDto> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/sources`, { method: "POST", body: JSON.stringify(input) }), "Unable to add Knowledge source");
}

export async function setKnowledgeSourceEnabled(brandId: string, sourceId: string, enabled: boolean): Promise<KnowledgeSourceDto> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/sources/${encodeURIComponent(sourceId)}/${enabled ? "enable" : "disable"}`, { method: "POST" }), `Unable to ${enabled ? "enable" : "disable"} Knowledge source`);
}

export async function removeKnowledgeSource(brandId: string, sourceId: string): Promise<KnowledgeSourceDto> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/sources/${encodeURIComponent(sourceId)}`, { method: "DELETE" }), "Unable to remove Knowledge source");
}

export async function getOpportunities(brandId: string): Promise<BrandOpportunityDto[]> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/opportunities`), "Unable to load Opportunities");
}

export async function actOnOpportunity(brandId: string, opportunityId: string, action: OpportunityAction): Promise<BrandOpportunityDto> {
  return bodyOrError(
    await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/opportunities/${encodeURIComponent(opportunityId)}/${action}`, { method: "POST" }),
    `Unable to ${action} Opportunity`,
  );
}

export async function getIdeas(brandId: string): Promise<IdeaSummary[]> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/ideas`), "Unable to load Ideas");
}

export async function createIdea(brandId: string, input: { title: string; premise: string }): Promise<IdeaSummary> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/ideas`, { method: "POST", body: JSON.stringify(input) }), "Unable to create Idea");
}

export async function getIdea(brandId: string, ideaId: string): Promise<IdeaBundleView> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/ideas/${encodeURIComponent(ideaId)}`), "Unable to load Idea");
}

export async function startIdeaResearch(brandId: string, ideaId: string): Promise<IdeaBundleView> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/ideas/${encodeURIComponent(ideaId)}/research`, { method: "POST" }), "Unable to start Research");
}

export async function selectIdeaAngle(brandId: string, ideaId: string, angleId: string, expectedVersion: number): Promise<AngleView[]> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/ideas/${encodeURIComponent(ideaId)}/angles/${encodeURIComponent(angleId)}/select`, { method: "POST", body: JSON.stringify({ expectedVersion }) }), "Unable to select Angle");
}

export async function editIdeaAngleFraming(brandId: string, ideaId: string, angleId: string, framing: string, expectedVersion: number): Promise<AngleView> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/ideas/${encodeURIComponent(ideaId)}/angles/${encodeURIComponent(angleId)}`, { method: "PATCH", body: JSON.stringify({ framing, expectedVersion }) }), "Unable to edit Angle");
}
export async function getCampaigns(brandId:string):Promise<CampaignView[]>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/campaigns`),"Unable to load Campaigns")}
export async function createCampaign(brandId:string,input:{ideaId:string;name:string;objective:string}):Promise<CampaignView>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/campaigns`,{method:"POST",body:JSON.stringify(input)}),"Unable to create Campaign")}
export async function getCampaignDetail(brandId:string,campaignId:string):Promise<CampaignDetailView>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/campaigns/${encodeURIComponent(campaignId)}`),"Unable to load Campaign")}
export async function createContentAsset(brandId:string,campaignId:string,input:{channel:string;format:string;audience:string;topic:string;hookType:string;cta:string;content:string}):Promise<CampaignDetailView>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/campaigns/${encodeURIComponent(campaignId)}/assets`,{method:"POST",body:JSON.stringify(input)}),"Unable to create Content Asset")}
export async function appendContentEdit(brandId:string,campaignId:string,assetId:string,input:{expectedVersion:number;content:string}):Promise<CampaignDetailView>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/campaigns/${encodeURIComponent(campaignId)}/assets/${encodeURIComponent(assetId)}/versions`,{method:"POST",body:JSON.stringify(input)}),"Unable to save Content Version")}
export async function generateContentVersion(brandId:string,campaignId:string,assetId:string,input:{expectedVersion:number;action:string;section?:string;brandContextVersion:string}):Promise<CampaignDetailView>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/campaigns/${encodeURIComponent(campaignId)}/assets/${encodeURIComponent(assetId)}/generate`,{method:"POST",body:JSON.stringify(input)}),"Unable to generate Content Version")}
export async function getContentReviewStatus(brandId:string,assetId:string):Promise<ContentReviewStatusView>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/assets/${encodeURIComponent(assetId)}/review-status`),"Unable to load review status")}
export async function requestContentReview(brandId:string,campaignId:string,assetId:string,input:{expectedVersion:number;brandContextVersion:string;revisionCycle:number}):Promise<ContentReviewView>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/campaigns/${encodeURIComponent(campaignId)}/assets/${encodeURIComponent(assetId)}/review`,{method:"POST",body:JSON.stringify(input)}),"Unable to review Content Version")}
export async function approveContentVersionRequest(brandId:string,campaignId:string,assetId:string,input:{expectedVersion:number;destination:{channel:"linkedin"|"instagram"|"facebook"|"manual";accountRef:string}}):Promise<ContentApprovalView>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/campaigns/${encodeURIComponent(campaignId)}/assets/${encodeURIComponent(assetId)}/approve`,{method:"POST",body:JSON.stringify(input)}),"Unable to approve Content Version")}
export async function getChannelAccounts(brandId:string):Promise<ChannelAccountView[]>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/channel-accounts`),"Unable to load channel connections")}
export async function getCalendar(brandId:string,from?:string,to?:string):Promise<PublishCommandView[]>{const query=new URLSearchParams();if(from)query.set("from",from);if(to)query.set("to",to);return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/calendar${query.size?`?${query}`:""}`),"Unable to load Calendar")}
export async function scheduleApprovedContent(brandId:string,campaignId:string,assetId:string,input:{channelAccountId:string;contentType:"text"|"image"|"video"|"carousel";scheduledFor:string}):Promise<PublishCommandView>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/campaigns/${encodeURIComponent(campaignId)}/assets/${encodeURIComponent(assetId)}/schedule`,{method:"POST",body:JSON.stringify(input)}),"Unable to schedule approved content")}
export async function retryPublishCommandRequest(brandId:string,commandId:string):Promise<PublishCommandView>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/publish-commands/${encodeURIComponent(commandId)}/retry`,{method:"POST"}),"Unable to retry publishing")}
export async function cancelPublishCommandRequest(brandId:string,commandId:string):Promise<PublishCommandView>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/publish-commands/${encodeURIComponent(commandId)}/cancel`,{method:"POST"}),"Unable to cancel publishing")}
export async function getPerformance(brandId:string):Promise<PerformanceMetricView[]>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/performance`),"Unable to load Performance")}
export async function getLearnings(brandId:string):Promise<LearningView[]>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/learnings`),"Unable to load Learnings")}
export async function decideLearning(brandId:string,id:string,input:{action:"accept"|"reject"|"correct";expectedVersion:number;reason?:string}):Promise<LearningView>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/learnings/${encodeURIComponent(id)}/decision`,{method:"POST",body:JSON.stringify(input)}),"Unable to review Learning")}
export async function getExperiments(brandId:string):Promise<ExperimentView[]>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/experiments`),"Unable to load Experiments")}
