import type { Pool, PoolClient } from "pg";
import { ConcurrencyConflictError, ResourceNotFoundError } from "@kairo/domain";
import type { ChannelAccount, PublishAttempt, PublishCommand, PublishedPost } from "@kairo/domain/publishing";
import type { PublishingRepository } from "@kairo/domain/publishing-service";

export class PgPublishingRepository implements PublishingRepository {
  constructor(private pool: Pool) {}

  async saveChannelAccount(accountId: string, channel: ChannelAccount) {
    const client = await this.pool.connect();
    try {
      const workspaceId = await scope(client, accountId, channel.brandId);
      if (workspaceId !== channel.workspaceId) throw new ResourceNotFoundError("Brand not found");
      await client.query(
        `insert into channel_accounts(id,workspace_id,brand_id,channel,account_ref,display_name,credential_ref,capabilities,status,connected_at)
         values($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10)
         on conflict(brand_id,channel,account_ref) do update set display_name=excluded.display_name,credential_ref=excluded.credential_ref,capabilities=excluded.capabilities,status=excluded.status,connected_at=excluded.connected_at`,
        [
          channel.id,
          channel.workspaceId,
          channel.brandId,
          channel.channel,
          channel.accountRef,
          channel.displayName,
          channel.credentialRef,
          JSON.stringify(channel.capabilities),
          channel.status,
          channel.connectedAt,
        ],
      );
      const found = await this.byAccount(client, workspaceId, channel.brandId, channel.channel, channel.accountRef);
      return found!;
    } finally {
      client.release();
    }
  }

  async getChannelAccount(accountId: string, brandId: string, id: string) {
    const client = await this.pool.connect();
    try {
      const workspaceId = await scope(client, accountId, brandId);
      const query = await client.query(`select * from channel_accounts where workspace_id=$1 and brand_id=$2 and id=$3`, [workspaceId, brandId, id]);
      return query.rows[0] ? channel(query.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  async listChannelAccounts(accountId: string, brandId: string) {
    const client = await this.pool.connect();
    try {
      const workspaceId = await scope(client, accountId, brandId);
      const query = await client.query(`select * from channel_accounts where workspace_id=$1 and brand_id=$2 order by connected_at desc,id`, [workspaceId, brandId]);
      return query.rows.map(channel);
    } finally {
      client.release();
    }
  }

  async saveCommand(accountId: string, commandValue: PublishCommand) {
    const client = await this.pool.connect();
    try {
      await scope(client, accountId, commandValue.brandId);
      const query = await client.query(
        `insert into publish_commands(id,workspace_id,brand_id,campaign_id,asset_id,version_id,version,approval_id,channel_account_id,channel,account_ref,content_type,media_items,publish_options,scheduled_for,status,attempt_count,created_at,last_attempt_at)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15,$16,$17,$18,$19)
         on conflict(id) do update set status=excluded.status,last_attempt_at=excluded.last_attempt_at
         where publish_commands.status in ('failed','unknown') and excluded.status='scheduled' and publish_commands.attempt_count=excluded.attempt_count
         returning *`,
        params(commandValue),
      );
      if (!query.rows[0]) throw new ConcurrencyConflictError("Publish Command changed");
      return command(query.rows[0]);
    } finally {
      client.release();
    }
  }

  async getCommand(accountId: string, brandId: string, id: string) {
    const client = await this.pool.connect();
    try {
      const workspaceId = await scope(client, accountId, brandId);
      const query = await client.query(`select * from publish_commands where workspace_id=$1 and brand_id=$2 and id=$3`, [workspaceId, brandId, id]);
      return query.rows[0] ? command(query.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  async getCommandByApproval(accountId: string, brandId: string, approvalId: string) {
    const client = await this.pool.connect();
    try {
      const workspaceId = await scope(client, accountId, brandId);
      const query = await client.query(
        `select * from publish_commands where workspace_id=$1 and brand_id=$2 and approval_id=$3 limit 1`,
        [workspaceId, brandId, approvalId],
      );
      return query.rows[0] ? command(query.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  async listCommands(accountId: string, brandId: string, from?: string, to?: string) {
    const client = await this.pool.connect();
    try {
      const workspaceId = await scope(client, accountId, brandId);
      const query = await client.query(
        `select * from publish_commands
         where workspace_id=$1 and brand_id=$2 and ($3::timestamptz is null or scheduled_for >= $3) and ($4::timestamptz is null or scheduled_for <= $4)
         order by scheduled_for,id`,
        [workspaceId, brandId, from ?? null, to ?? null],
      );
      return query.rows.map(command);
    } finally {
      client.release();
    }
  }

  async cancelCommand(accountId: string, brandId: string, id: string) {
    const client = await this.pool.connect();
    try {
      const workspaceId = await scope(client, accountId, brandId);
      const query = await client.query(
        `update publish_commands set status='cancelled',lease_owner=null,lease_expires_at=null
         where workspace_id=$1 and brand_id=$2 and id=$3 and status in ('scheduled','manual-required') returning *`,
        [workspaceId, brandId, id],
      );
      if (!query.rows[0]) throw new ConcurrencyConflictError("Publish Command is no longer cancellable");
      return command(query.rows[0]);
    } finally {
      client.release();
    }
  }

  async recordDispatch(accountId: string, commandValue: PublishCommand, attemptValue: PublishAttempt) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await scope(client, accountId, commandValue.brandId);
      const query = await client.query(
        `update publish_commands set status='dispatching',attempt_count=$2,last_attempt_at=$3
         where id=$1 and version_id=$4 and attempt_count=$2-1 and status in ('scheduled','failed') returning id`,
        [commandValue.id, commandValue.attemptCount, commandValue.lastAttemptAt, commandValue.versionId],
      );
      if (!query.rows[0]) throw new ConcurrencyConflictError("Publish Command is no longer dispatchable");
      await insertAttempt(client, attemptValue);
      await client.query("commit");
      return attemptValue;
    } catch (error) {
      await rollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  async getLatestAttempt(accountId: string, brandId: string, id: string) {
    const client = await this.pool.connect();
    try {
      const workspaceId = await scope(client, accountId, brandId);
      const query = await client.query(
        `select t.* from publish_attempts t join publish_commands c on c.id=t.command_id
         where c.workspace_id=$1 and c.brand_id=$2 and c.id=$3 order by t.attempt_number desc limit 1`,
        [workspaceId, brandId, id],
      );
      return query.rows[0] ? attempt(query.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  async recordOutcome(accountId: string, commandValue: PublishCommand, attemptValue: PublishAttempt, post?: PublishedPost) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await scope(client, accountId, commandValue.brandId);
      const query = await client.query(
        `update publish_commands set status=$2,last_attempt_at=$3
         where id=$1 and version_id=$4 and status='dispatching' and attempt_count=$5 returning *`,
        [commandValue.id, commandValue.status, commandValue.lastAttemptAt, commandValue.versionId, commandValue.attemptCount],
      );
      if (!query.rows[0]) throw new ConcurrencyConflictError("Publish Attempt changed");
      const attemptQuery = await client.query(
        `update publish_attempts set status=$2,completed_at=$3,external_post_id=$4,provider_correlation_id=$5,failure_code=$6
         where id=$1 and command_id=$7 and status='dispatching' returning id`,
        [
          attemptValue.id,
          attemptValue.status,
          attemptValue.completedAt ?? null,
          attemptValue.externalPostId ?? null,
          attemptValue.providerCorrelationId ?? null,
          attemptValue.failureCode ?? null,
          commandValue.id,
        ],
      );
      if (!attemptQuery.rows[0]) throw new ConcurrencyConflictError("Publish Attempt changed");
      if (post) {
        await client.query(
          `insert into published_posts(id,workspace_id,brand_id,campaign_id,asset_id,version_id,publish_command_id,channel,account_ref,external_post_id,published_at)
           values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [post.id, post.workspaceId, post.brandId, post.campaignId, post.assetId, post.versionId, post.publishCommandId, post.channel, post.accountRef, post.externalPostId, post.publishedAt],
        );
      }
      await client.query("commit");
      return command(query.rows[0]);
    } catch (error) {
      await rollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  private async byAccount(client: PoolClient, workspaceId: string, brandId: string, channelValue: string, accountRef: string) {
    const query = await client.query(
      `select * from channel_accounts where workspace_id=$1 and brand_id=$2 and channel=$3 and account_ref=$4`,
      [workspaceId, brandId, channelValue, accountRef],
    );
    return query.rows[0] ? channel(query.rows[0]) : null;
  }
}

function params(value: PublishCommand) {
  return [
    value.id,
    value.workspaceId,
    value.brandId,
    value.campaignId,
    value.assetId,
    value.versionId,
    value.version,
    value.approvalId,
    value.channelAccountId,
    value.channel,
    value.accountRef,
    value.contentType,
    JSON.stringify(value.mediaItems ?? []),
    JSON.stringify(value.options ?? {}),
    value.scheduledFor,
    value.status,
    value.attemptCount,
    value.createdAt,
    value.lastAttemptAt ?? null,
  ];
}

async function insertAttempt(client: PoolClient, value: PublishAttempt) {
  await client.query(
    `insert into publish_attempts(id,command_id,version_id,idempotency_key,attempt_number,status,started_at) values($1,$2,$3,$4,$5,$6,$7)`,
    [value.id, value.commandId, value.versionId, value.idempotencyKey, value.attemptNumber, value.status, value.startedAt],
  );
}

function channel(row: any): ChannelAccount {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    brandId: row.brand_id,
    channel: row.channel,
    accountRef: row.account_ref,
    displayName: row.display_name,
    credentialRef: row.credential_ref,
    capabilities: row.capabilities,
    status: row.status,
    connectedAt: iso(row.connected_at),
  };
}

function command(row: any): PublishCommand {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    brandId: row.brand_id,
    campaignId: row.campaign_id,
    assetId: row.asset_id,
    versionId: row.version_id,
    version: row.version,
    approvalId: row.approval_id,
    channelAccountId: row.channel_account_id,
    channel: row.channel,
    accountRef: row.account_ref,
    contentType: row.content_type,
    mediaItems: Array.isArray(row.media_items) ? row.media_items : [],
    options: row.publish_options && typeof row.publish_options === "object" ? row.publish_options : {},
    scheduledFor: iso(row.scheduled_for),
    status: row.status,
    attemptCount: row.attempt_count,
    createdAt: iso(row.created_at),
    ...(row.last_attempt_at ? { lastAttemptAt: iso(row.last_attempt_at) } : {}),
  };
}

function attempt(row: any): PublishAttempt {
  return {
    id: row.id,
    commandId: row.command_id,
    versionId: row.version_id,
    idempotencyKey: row.idempotency_key,
    attemptNumber: row.attempt_number,
    status: row.status,
    startedAt: iso(row.started_at),
    ...(row.completed_at ? { completedAt: iso(row.completed_at) } : {}),
    ...(row.external_post_id ? { externalPostId: row.external_post_id } : {}),
    ...(row.provider_correlation_id ? { providerCorrelationId: row.provider_correlation_id } : {}),
    ...(row.failure_code ? { failureCode: row.failure_code } : {}),
  };
}

async function scope(client: PoolClient, accountId: string, brandId: string) {
  const query = await client.query(
    `select b.workspace_id from brands b join workspace_memberships m on m.workspace_id=b.workspace_id where m.account_id=$1 and m.active=true and b.id=$2`,
    [accountId, brandId],
  );
  if (!query.rows[0]) throw new ResourceNotFoundError("Brand not found");
  return query.rows[0].workspace_id as string;
}

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

async function rollback(client: PoolClient) {
  try {
    await client.query("rollback");
  } catch {}
}
