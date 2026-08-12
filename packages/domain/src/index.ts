import type {
  AccountDto,
  BrandDto,
  CreateWorkspaceWithBrandRequest,
  CreateWorkspaceWithBrandResponse,
  ExternalIdentity,
  WorkspaceDto,
} from "@kairo/contracts";

export class DomainValidationError extends Error {
  readonly code = "validation_error";
}

export class ResourceNotFoundError extends Error {
  readonly code = "resource_not_found";
}

export interface KairoRepository {
  resolveAccount(identity: ExternalIdentity): Promise<AccountDto>;
  createWorkspaceWithBrand(
    accountId: string,
    input: CreateWorkspaceWithBrandRequest,
  ): Promise<CreateWorkspaceWithBrandResponse>;
  listWorkspacesForAccount(accountId: string): Promise<WorkspaceDto[]>;
  hasWorkspaceAccess(accountId: string, workspaceId: string): Promise<boolean>;
  listBrandsForAccount(accountId: string, workspaceId: string): Promise<BrandDto[]>;
  getBrandForAccount(accountId: string, brandId: string): Promise<BrandDto | null>;
}

function required(value: string | undefined, field: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new DomainValidationError(`${field} is required`);
  return normalized;
}

function optionalUrl(value: string | undefined, field: string): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("unsupported protocol");
    return url.toString();
  } catch {
    throw new DomainValidationError(`${field} must be a valid HTTP(S) URL`);
  }
}

export class KairoService {
  constructor(private readonly repository: KairoRepository) {}

  async establishSession(identity: ExternalIdentity): Promise<AccountDto> {
    const provider = required(identity.provider, "identity provider");
    const subject = required(identity.subject, "identity subject");
    return this.repository.resolveAccount({
      provider,
      subject,
      ...(identity.email?.trim() ? { email: identity.email.trim() } : {}),
      ...(identity.displayName?.trim() ? { displayName: identity.displayName.trim() } : {}),
    });
  }

  async createInitialWorkspace(
    accountId: string,
    input: CreateWorkspaceWithBrandRequest,
  ): Promise<CreateWorkspaceWithBrandResponse> {
    const workspaceName = required(input.workspaceName, "workspaceName");
    const brandName = required(input.brandName, "brandName");
    return this.repository.createWorkspaceWithBrand(accountId, {
      workspaceName,
      brandName,
      ...(optionalUrl(input.publicSourceUrl, "publicSourceUrl") ? { publicSourceUrl: optionalUrl(input.publicSourceUrl, "publicSourceUrl") } : {}),
      ...(optionalUrl(input.publicProfileUrl, "publicProfileUrl") ? { publicProfileUrl: optionalUrl(input.publicProfileUrl, "publicProfileUrl") } : {}),
    });
  }

  listWorkspaces(accountId: string): Promise<WorkspaceDto[]> {
    return this.repository.listWorkspacesForAccount(accountId);
  }

  async listBrands(accountId: string, workspaceId: string): Promise<BrandDto[]> {
    if (!(await this.repository.hasWorkspaceAccess(accountId, workspaceId))) {
      throw new ResourceNotFoundError("Workspace not found");
    }
    return this.repository.listBrandsForAccount(accountId, workspaceId);
  }

  async getBrand(accountId: string, brandId: string): Promise<BrandDto> {
    const brand = await this.repository.getBrandForAccount(accountId, brandId);
    if (!brand) throw new ResourceNotFoundError("Brand not found");
    return brand;
  }
}

export type {
  AccountDto,
  BrandDto,
  CreateWorkspaceWithBrandRequest,
  CreateWorkspaceWithBrandResponse,
  ExternalIdentity,
  WorkspaceDto,
};
