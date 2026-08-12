import { randomUUID } from "node:crypto";
import type {
  AccountDto,
  BrandDto,
  CreateWorkspaceWithBrandRequest,
  CreateWorkspaceWithBrandResponse,
  ExternalIdentity,
  WorkspaceDto,
  WorkspaceRole,
} from "@kairo/contracts";
import type { KairoRepository } from "@kairo/domain";

type Membership = { accountId: string; workspaceId: string; role: WorkspaceRole; active: boolean };

export class MemoryKairoRepository implements KairoRepository {
  private readonly accounts = new Map<string, AccountDto>();
  private readonly identityAccounts = new Map<string, string>();
  private readonly workspaces = new Map<string, { id: string; name: string }>();
  private readonly memberships: Membership[] = [];
  private readonly brands = new Map<string, BrandDto>();

  private identityKey(identity: ExternalIdentity): string {
    return `${identity.provider}::${identity.subject}`;
  }

  async resolveAccount(identity: ExternalIdentity): Promise<AccountDto> {
    const key = this.identityKey(identity);
    const existingId = this.identityAccounts.get(key);
    if (existingId) {
      const existing = this.accounts.get(existingId);
      if (!existing) throw new Error("Identity map references a missing account");
      return existing;
    }

    const account: AccountDto = {
      id: randomUUID(),
      ...(identity.email ? { email: identity.email } : {}),
      ...(identity.displayName ? { displayName: identity.displayName } : {}),
    };
    this.accounts.set(account.id, account);
    this.identityAccounts.set(key, account.id);
    return account;
  }

  async createWorkspaceWithBrand(
    accountId: string,
    input: CreateWorkspaceWithBrandRequest,
  ): Promise<CreateWorkspaceWithBrandResponse> {
    if (!this.accounts.has(accountId)) throw new Error("Account does not exist");

    const workspaceId = randomUUID();
    const brandId = randomUUID();
    const workspace = { id: workspaceId, name: input.workspaceName };
    const brand: BrandDto = {
      id: brandId,
      workspaceId,
      name: input.brandName,
      ...(input.publicSourceUrl ? { publicSourceUrl: input.publicSourceUrl } : {}),
      ...(input.publicProfileUrl ? { publicProfileUrl: input.publicProfileUrl } : {}),
    };

    this.workspaces.set(workspaceId, workspace);
    this.memberships.push({ accountId, workspaceId, role: "owner", active: true });
    this.brands.set(brandId, brand);

    return { workspace: { ...workspace, role: "owner" }, brand };
  }

  async listWorkspacesForAccount(accountId: string): Promise<WorkspaceDto[]> {
    return this.memberships
      .filter((membership) => membership.accountId === accountId && membership.active)
      .map((membership) => {
        const workspace = this.workspaces.get(membership.workspaceId);
        if (!workspace) throw new Error("Membership references a missing workspace");
        return { ...workspace, role: membership.role };
      });
  }

  async hasWorkspaceAccess(accountId: string, workspaceId: string): Promise<boolean> {
    return this.memberships.some(
      (membership) => membership.accountId === accountId && membership.workspaceId === workspaceId && membership.active,
    );
  }

  async listBrandsForAccount(accountId: string, workspaceId: string): Promise<BrandDto[]> {
    if (!(await this.hasWorkspaceAccess(accountId, workspaceId))) return [];
    return [...this.brands.values()].filter((brand) => brand.workspaceId === workspaceId);
  }

  async getBrandForAccount(accountId: string, brandId: string): Promise<BrandDto | null> {
    const brand = this.brands.get(brandId);
    if (!brand) return null;
    if (!(await this.hasWorkspaceAccess(accountId, brand.workspaceId))) return null;
    return brand;
  }
}
