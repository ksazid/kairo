import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import type {
  AccountDto,
  BrandDto,
  CreateWorkspaceWithBrandRequest,
  CreateWorkspaceWithBrandResponse,
  ExternalIdentity,
  WorkspaceDto,
} from "@kairo/contracts";
import type { KairoRepository } from "@kairo/domain";

export class PgKairoRepository implements KairoRepository {
  constructor(private readonly pool: Pool) {}

  async resolveAccount(identity: ExternalIdentity): Promise<AccountDto> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const identityLockKey = JSON.stringify([identity.provider, identity.subject]);
      await client.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [identityLockKey]);

      const existing = await client.query<AccountRow>(
        `select a.id, a.email, a.display_name
           from external_identities ei
           join accounts a on a.id = ei.account_id
          where ei.provider = $1 and ei.subject = $2`,
        [identity.provider, identity.subject],
      );
      const row = existing.rows[0];
      if (row) {
        await client.query("commit");
        return toAccount(row);
      }

      const accountId = randomUUID();
      await client.query(
        `insert into accounts (id, email, display_name) values ($1, $2, $3)`,
        [accountId, identity.email ?? null, identity.displayName ?? null],
      );
      await client.query(
        `insert into external_identities (id, account_id, provider, subject)
         values ($1, $2, $3, $4)`,
        [randomUUID(), accountId, identity.provider, identity.subject],
      );
      await client.query("commit");
      return {
        id: accountId,
        ...(identity.email ? { email: identity.email } : {}),
        ...(identity.displayName ? { displayName: identity.displayName } : {}),
      };
    } catch (error) {
      await safeRollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async createWorkspaceWithBrand(
    accountId: string,
    input: CreateWorkspaceWithBrandRequest,
  ): Promise<CreateWorkspaceWithBrandResponse> {
    const client = await this.pool.connect();
    const workspaceId = randomUUID();
    const brandId = randomUUID();
    try {
      await client.query("begin");
      await client.query(`insert into workspaces (id, name) values ($1, $2)`, [workspaceId, input.workspaceName]);
      await client.query(
        `insert into workspace_memberships (workspace_id, account_id, role, active)
         values ($1, $2, 'owner', true)`,
        [workspaceId, accountId],
      );
      await client.query(
        `insert into brands (id, workspace_id, name, public_source_url, public_profile_url)
         values ($1, $2, $3, $4, $5)`,
        [brandId, workspaceId, input.brandName, input.publicSourceUrl ?? null, input.publicProfileUrl ?? null],
      );
      await client.query(
        `insert into audit_events (id, workspace_id, account_id, event_type, subject_id)
         values ($1, $2, $3, 'workspace_brand.created', $4)`,
        [randomUUID(), workspaceId, accountId, brandId],
      );
      await client.query("commit");
      return {
        workspace: { id: workspaceId, name: input.workspaceName, role: "owner" },
        brand: {
          id: brandId,
          workspaceId,
          name: input.brandName,
          ...(input.publicSourceUrl ? { publicSourceUrl: input.publicSourceUrl } : {}),
          ...(input.publicProfileUrl ? { publicProfileUrl: input.publicProfileUrl } : {}),
        },
      };
    } catch (error) {
      await safeRollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async listWorkspacesForAccount(accountId: string): Promise<WorkspaceDto[]> {
    const result = await this.pool.query<{ id: string; name: string; role: "owner" | "member" }>(
      `select w.id, w.name, m.role
         from workspace_memberships m
         join workspaces w on w.id = m.workspace_id
        where m.account_id = $1 and m.active = true
        order by w.created_at, w.id`,
      [accountId],
    );
    return result.rows;
  }

  async hasWorkspaceAccess(accountId: string, workspaceId: string): Promise<boolean> {
    const result = await this.pool.query<{ allowed: boolean }>(
      `select exists(
         select 1 from workspace_memberships
          where account_id = $1 and workspace_id = $2 and active = true
       ) as allowed`,
      [accountId, workspaceId],
    );
    return result.rows[0]?.allowed === true;
  }

  async listBrandsForAccount(accountId: string, workspaceId: string): Promise<BrandDto[]> {
    const result = await this.pool.query<BrandRow>(
      `select b.id, b.workspace_id, b.name, b.public_source_url, b.public_profile_url
         from brands b
         join workspace_memberships m on m.workspace_id = b.workspace_id
        where m.account_id = $1 and m.active = true and b.workspace_id = $2
        order by b.created_at, b.id`,
      [accountId, workspaceId],
    );
    return result.rows.map(toBrand);
  }

  async getBrandForAccount(accountId: string, brandId: string): Promise<BrandDto | null> {
    const result = await this.pool.query<BrandRow>(
      `select b.id, b.workspace_id, b.name, b.public_source_url, b.public_profile_url
         from brands b
         join workspace_memberships m on m.workspace_id = b.workspace_id
        where m.account_id = $1 and m.active = true and b.id = $2`,
      [accountId, brandId],
    );
    return result.rows[0] ? toBrand(result.rows[0]) : null;
  }
}

type AccountRow = { id: string; email: string | null; display_name: string | null };
type BrandRow = {
  id: string;
  workspace_id: string;
  name: string;
  public_source_url: string | null;
  public_profile_url: string | null;
};

function toAccount(row: AccountRow): AccountDto {
  return {
    id: row.id,
    ...(row.email ? { email: row.email } : {}),
    ...(row.display_name ? { displayName: row.display_name } : {}),
  };
}

function toBrand(row: BrandRow): BrandDto {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    ...(row.public_source_url ? { publicSourceUrl: row.public_source_url } : {}),
    ...(row.public_profile_url ? { publicProfileUrl: row.public_profile_url } : {}),
  };
}

async function safeRollback(client: PoolClient): Promise<void> {
  try {
    await client.query("rollback");
  } catch {
    // Preserve the original transaction error.
  }
}
