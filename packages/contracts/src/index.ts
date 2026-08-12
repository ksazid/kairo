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

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code: string;
  correlationId?: string;
}
