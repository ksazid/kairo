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

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code: string;
  correlationId?: string;
}
