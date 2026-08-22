export type WorkspaceRole = "owner" | "member";

export interface ExternalIdentity {
  provider: string;
  subject: string;
  email?: string;
  displayName?: string;
}

export interface AccountDto {
  id: string;
  email?: string;
  displayName?: string;
}

export interface WorkspaceDto {
  id: string;
  name: string;
  role: WorkspaceRole;
}

export interface BrandDto {
  id: string;
  workspaceId: string;
  name: string;
  publicSourceUrl?: string;
  publicProfileUrl?: string;
}

export interface CreateWorkspaceWithBrandRequest {
  workspaceName: string;
  brandName: string;
  publicSourceUrl?: string;
  publicProfileUrl?: string;
}

export interface CreateWorkspaceWithBrandResponse {
  workspace: WorkspaceDto;
  brand: BrandDto;
}

export interface CreateBrandRequest {
  brandName: string;
  publicSourceUrl?: string;
  publicProfileUrl?: string;
}

export interface SessionResponse {
  account: AccountDto;
  workspaces: WorkspaceDto[];
}

export type BrandBrainFieldState = "inferred" | "confirmed" | "stale";
export type BrandBrainSection =
  | "identity"
  | "positioning"
  | "audience"
  | "voice"
  | "content-strategy"
  | "goals"
  | "boundaries";

export interface BrandBrainFieldDto {
  id: string;
  workspaceId: string;
  brandId: string;
  section: BrandBrainSection;
  fieldKey: string;
  value: string;
  state: BrandBrainFieldState;
  sourceIds: string[];
  version: number;
  updatedAt: string;
  confirmedByAccountId?: string;
}

export interface PutBrandBrainFieldRequest {
  section: BrandBrainSection;
  value: string;
  expectedVersion?: number;
}

export type GuidedBrandObjective =
  | "grow-audience"
  | "build-authority"
  | "generate-leads"
  | "build-community"
  | "promote-offer";

export interface BuildBrandBrainRequest {
  primaryObjective: GuidedBrandObjective;
  publicReferenceUrl?: string;
  ownerBoundary?: string;
}

export interface BrandBrainBuildResponse {
  brain: BrandBrainFieldDto[];
  generatorStatus: "generated" | "unavailable";
  proposedCount: number;
  skippedConfirmedCount: number;
  sourceIds: string[];
}

export type KnowledgeSourceType = "url" | "website" | "document" | "note" | "pasted" | "research" | "product";
export type KnowledgeSourceStatus = "active" | "disabled" | "replaced" | "removed" | "quarantined" | "failed";

export interface KnowledgeSourceDto {
  id: string;
  workspaceId: string;
  brandId: string;
  type: KnowledgeSourceType;
  status: KnowledgeSourceStatus;
  title?: string;
  sourceUrl?: string;
  contentType?: string;
  sizeBytes?: number;
  contentHash?: string;
  hasPrivateContent: boolean;
  createdAt: string;
  updatedAt: string;
  removedAt?: string;
}

export interface CreateKnowledgeSourceRequest {
  type: KnowledgeSourceType;
  title?: string;
  url?: string;
  content?: string;
  contentType?: string;
  sizeBytes?: number;
  contentHash?: string;
}

export interface PublicSignalDto {
  id: string;
  title: string;
  summary?: string;
  sourceUrl: string;
  duplicateKey: string;
  platform: string;
  publisher?: string;
  author?: string;
  publishedAt?: string;
  retrievedAt: string;
  provider: string;
  providerVersion?: string;
  contentHash?: string;
  createdAt: string;
  updatedAt: string;
}

export type OpportunityStatus = "new" | "saved" | "ignored" | "developing";
export type OpportunityAction = "save" | "ignore" | "develop";

export interface OpportunityScoresDto {
  relevance: number;
  evidence: number;
  novelty: number;
  timeliness: number;
  brandAuthority: number;
  audienceFit: number;
  overall: number;
  scoringVersion: string;
}

export interface BrandOpportunityDto {
  id: string;
  workspaceId: string;
  brandId: string;
  title: string;
  rationale: string;
  whyNow: string;
  developmentDirection: string;
  status: OpportunityStatus;
  signalIds: string[];
  scores: OpportunityScoresDto;
  brandContextVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code: string;
  correlationId?: string;
}

export type ContentDevelopmentType = "carousel" | "reel";
export type CarouselStructure = "aida" | "pas" | "listicle" | "case-study" | "story" | "comparison";
export type CarouselSlideRole = "hook" | "attention" | "interest" | "desire" | "problem" | "agitation" | "solution" | "list-item" | "context" | "challenge" | "approach" | "result" | "story-beat" | "comparison" | "evidence" | "insight" | "cta";
export type ReelSceneRole = "hook" | "problem" | "insight" | "evidence" | "solution" | "cta" | "story-beat";

export interface ContentDevelopmentLineageDto {
  ideaId: string;
  angleId: string;
  supportingClaimIds: string[];
}

export interface ProductionCarouselSlideDto {
  id: string;
  role: CarouselSlideRole;
  headline: string;
  body: string;
  imageAssetId?: string;
  supportingClaimIds: string[];
}

export interface ProductionCarouselProjectDto {
  schemaVersion: 1;
  format: "carousel";
  structure: CarouselStructure;
  coverHook: string;
  caption: string;
  cta: string;
  slides: ProductionCarouselSlideDto[];
  supportingClaimIds: string[];
}

export interface ProductionReelSceneDto {
  id: string;
  role: ReelSceneRole;
  startSecond: number;
  endSecond: number;
  visual: string;
  onScreenText: string;
  voiceover: string;
  supportingClaimIds: string[];
}

export interface ProductionReelProjectDto {
  schemaVersion: 1;
  contentType: "reel";
  title: string;
  hook: string;
  targetDurationSeconds: number;
  caption: string;
  cta: string;
  scenes: ProductionReelSceneDto[];
  supportingClaimIds: string[];
}

export type ProductionContentProjectDto = ProductionCarouselProjectDto | ProductionReelProjectDto;

export interface StructuredContentDevelopmentDto {
  schemaVersion: 1;
  lineage: ContentDevelopmentLineageDto;
  contentType: ContentDevelopmentType;
  recommendationRationale: string;
  project: ProductionContentProjectDto;
}
