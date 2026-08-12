import { describe, expect, it } from "vitest";
import type {
  AccountDto,
  BrandDto,
  CreateWorkspaceWithBrandRequest,
  CreateWorkspaceWithBrandResponse,
  ExternalIdentity,
  KairoRepository,
  WorkspaceDto,
} from "./index";
import { DomainValidationError, KairoService, ResourceNotFoundError } from "./index";

class FakeRepository implements KairoRepository {
  account: AccountDto = { id: "account-1", email: "owner@example.com" };
  workspaceAccess = true;
  brand: BrandDto | null = { id: "brand-1", workspaceId: "workspace-1", name: "Kairo" };
  lastIdentity: ExternalIdentity | null = null;
  lastCreation: CreateWorkspaceWithBrandRequest | null = null;

  async resolveAccount(identity: ExternalIdentity): Promise<AccountDto> {
    this.lastIdentity = identity;
    return this.account;
  }

  async createWorkspaceWithBrand(_accountId: string, input: CreateWorkspaceWithBrandRequest): Promise<CreateWorkspaceWithBrandResponse> {
    this.lastCreation = input;
    return {
      workspace: { id: "workspace-1", name: input.workspaceName, role: "owner" },
      brand: { id: "brand-1", workspaceId: "workspace-1", name: input.brandName },
    };
  }

  async listWorkspacesForAccount(): Promise<WorkspaceDto[]> {
    return [{ id: "workspace-1", name: "Studio", role: "owner" }];
  }

  async hasWorkspaceAccess(): Promise<boolean> {
    return this.workspaceAccess;
  }

  async listBrandsForAccount(): Promise<BrandDto[]> {
    return this.brand ? [this.brand] : [];
  }

  async getBrandForAccount(): Promise<BrandDto | null> {
    return this.brand;
  }
}

describe("KairoService", () => {
  it("rejects incomplete external identities", async () => {
    const service = new KairoService(new FakeRepository());
    await expect(service.establishSession({ provider: "oidc", subject: "  " })).rejects.toBeInstanceOf(DomainValidationError);
  });

  it("normalizes identity data before resolving the account", async () => {
    const repository = new FakeRepository();
    const service = new KairoService(repository);
    await service.establishSession({ provider: " issuer ", subject: " user-1 ", email: " owner@example.com " });
    expect(repository.lastIdentity).toEqual({ provider: "issuer", subject: "user-1", email: "owner@example.com" });
  });

  it("requires workspace and brand names", async () => {
    const service = new KairoService(new FakeRepository());
    await expect(service.createInitialWorkspace("account-1", { workspaceName: " ", brandName: "Brand" })).rejects.toBeInstanceOf(DomainValidationError);
  });

  it("normalizes the initial workspace and brand command", async () => {
    const repository = new FakeRepository();
    const service = new KairoService(repository);
    await service.createInitialWorkspace("account-1", {
      workspaceName: " Studio ",
      brandName: " Kairo ",
      publicSourceUrl: "https://example.com",
    });
    expect(repository.lastCreation).toEqual({
      workspaceName: "Studio",
      brandName: "Kairo",
      publicSourceUrl: "https://example.com/",
    });
  });

  it("hides a workspace from non-members", async () => {
    const repository = new FakeRepository();
    repository.workspaceAccess = false;
    const service = new KairoService(repository);
    await expect(service.listBrands("account-2", "workspace-1")).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("hides a foreign brand", async () => {
    const repository = new FakeRepository();
    repository.brand = null;
    const service = new KairoService(repository);
    await expect(service.getBrand("account-2", "brand-1")).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
