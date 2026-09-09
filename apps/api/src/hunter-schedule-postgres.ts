import type { Pool, PoolClient } from "pg";
import { ResourceNotFoundError } from "@kairo/domain";
import {
  nextHunterRunAt,
  type ClaimedHunterSchedule,
  type HunterScheduleRecord,
  type HunterScheduleRepository,
  type PutHunterScheduleInput,
} from "@kairo/domain/hunter-schedule";

export class PgHunterScheduleRepository implements HunterScheduleRepository {
  constructor(private readonly pool: Pool) {}

  async get(accountId: string, brandId: string): Promise<HunterScheduleRecord | undefined> {
    const result = await this.pool.query<ScheduleRow>(`select s.* from hunter_schedules s
      join workspace_memberships m on m.workspace_id=s.workspace_id and m.account_id=$1 and m.active=true
      where s.brand_id=$2`, [accountId, brandId]);
    return result.rows[0] ? fromRow(result.rows[0]) : undefined;
  }

  async put(accountId: string, workspaceId: string, brandId: string, input: PutHunterScheduleInput): Promise<HunterScheduleRecord> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await assertAccess(client, accountId, workspaceId, brandId);
      const nextRunAt = input.enabled ? nextHunterRunAt(input.cadence, input.now) : null;
      const result = await client.query<ScheduleRow>(`insert into hunter_schedules
        (workspace_id,brand_id,account_id,schema_version,enabled,cadence,timezone,next_run_at,last_claimed_at,lease_owner,lease_expires_at,updated_at)
        values ($1,$2,$3,'1',$4,$5,$6,$7,null,null,null,now())
        on conflict (brand_id) do update set
          workspace_id=excluded.workspace_id,
          account_id=excluded.account_id,
          enabled=excluded.enabled,
          cadence=excluded.cadence,
          timezone=excluded.timezone,
          next_run_at=excluded.next_run_at,
          lease_owner=null,
          lease_expires_at=null,
          updated_at=now()
        returning *`, [workspaceId, brandId, accountId, input.enabled, input.cadence, input.timezone, nextRunAt]);
      await client.query("commit");
      return fromRow(result.rows[0]!);
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally { client.release(); }
  }

  async claimDue(workerId: string, now: string, leaseSeconds: number, limit: number): Promise<ClaimedHunterSchedule[]> {
    const boundedLease = Math.max(30, Math.min(3_600, Math.floor(leaseSeconds)));
    const boundedLimit = Math.max(1, Math.min(20, Math.floor(limit)));
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await client.query<ScheduleRow>(`with due as (
        select s.brand_id
        from hunter_schedules s
        join workspace_memberships m on m.workspace_id=s.workspace_id and m.account_id=s.account_id and m.active=true
        where s.enabled=true
          and s.next_run_at <= $1::timestamptz
          and (s.lease_expires_at is null or s.lease_expires_at <= $1::timestamptz)
        order by s.next_run_at asc, s.brand_id asc
        for update of s skip locked
        limit $4
      )
      update hunter_schedules s set
        lease_owner=$2,
        lease_expires_at=$1::timestamptz + ($3::text || ' seconds')::interval,
        last_claimed_at=$1::timestamptz,
        updated_at=now()
      from due where s.brand_id=due.brand_id
      returning s.*`, [now, workerId, boundedLease, boundedLimit]);
      await client.query("commit");
      return result.rows.map(row => ({ ...fromRow(row), accountId: row.account_id, nextRunAt: iso(row.next_run_at!), leaseOwner: row.lease_owner!, leaseExpiresAt: iso(row.lease_expires_at!) }));
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally { client.release(); }
  }

  async releaseClaim(accountId: string, brandId: string, workerId: string, completedAt: string): Promise<HunterScheduleRecord> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const current = await client.query<ScheduleRow>(`select s.* from hunter_schedules s
        join workspace_memberships m on m.workspace_id=s.workspace_id and m.account_id=$1 and m.active=true
        where s.brand_id=$2 for update of s`, [accountId, brandId]);
      const row = current.rows[0];
      if (!row) throw new ResourceNotFoundError("Hunter schedule not found");
      if (row.lease_owner !== workerId) throw new Error("Hunter schedule lease is not owned by this worker");
      const nextRunAt = row.enabled ? nextHunterRunAt(row.cadence, completedAt) : null;
      const result = await client.query<ScheduleRow>(`update hunter_schedules set
        next_run_at=$3,
        lease_owner=null,
        lease_expires_at=null,
        updated_at=now()
        where brand_id=$2 and account_id=$1 and lease_owner=$4
        returning *`, [accountId, brandId, nextRunAt, workerId]);
      await client.query("commit");
      return fromRow(result.rows[0]!);
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally { client.release(); }
  }
}

async function assertAccess(client: PoolClient, accountId: string, workspaceId: string, brandId: string) {
  const access = await client.query(`select 1 from brands b join workspace_memberships m on m.workspace_id=b.workspace_id
    where m.account_id=$1 and m.active=true and b.workspace_id=$2 and b.id=$3`, [accountId, workspaceId, brandId]);
  if (!access.rowCount) throw new ResourceNotFoundError("Brand not found");
}

type ScheduleRow = {
  workspace_id: string;
  brand_id: string;
  account_id: string;
  schema_version: string;
  enabled: boolean;
  cadence: "twice-daily" | "daily" | "weekly";
  timezone: string;
  next_run_at: Date | string | null;
  last_claimed_at: Date | string | null;
  lease_owner: string | null;
  lease_expires_at: Date | string | null;
  updated_at: Date | string;
};

function fromRow(row: ScheduleRow): HunterScheduleRecord {
  return {
    schemaVersion: "1",
    workspaceId: row.workspace_id,
    brandId: row.brand_id,
    enabled: row.enabled,
    cadence: row.cadence,
    timezone: row.timezone,
    ...(row.next_run_at ? { nextRunAt: iso(row.next_run_at) } : {}),
    ...(row.last_claimed_at ? { lastClaimedAt: iso(row.last_claimed_at) } : {}),
    ...(row.lease_owner ? { leaseOwner: row.lease_owner } : {}),
    ...(row.lease_expires_at ? { leaseExpiresAt: iso(row.lease_expires_at) } : {}),
    updatedAt: iso(row.updated_at),
  };
}
function iso(value: Date | string) { return value instanceof Date ? value.toISOString() : new Date(value).toISOString(); }
