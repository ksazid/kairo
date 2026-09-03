begin;

create table if not exists hunter_schedules (
  workspace_id text not null references workspaces(id) on delete cascade,
  brand_id text primary key references brands(id) on delete cascade,
  account_id text not null references accounts(id) on delete cascade,
  schema_version text not null default '1',
  enabled boolean not null default false,
  cadence text not null default 'daily' check (cadence in ('twice-daily','daily','weekly')),
  timezone text not null default 'UTC',
  next_run_at timestamptz null,
  last_claimed_at timestamptz null,
  lease_owner text null,
  lease_expires_at timestamptz null,
  updated_at timestamptz not null default now(),
  constraint ck_hunter_schedule_enabled_shape check (
    (enabled = true and next_run_at is not null)
    or
    (enabled = false and next_run_at is null and lease_owner is null and lease_expires_at is null)
  ),
  constraint ck_hunter_schedule_lease_shape check (
    (lease_owner is null and lease_expires_at is null)
    or
    (lease_owner is not null and lease_expires_at is not null)
  )
);

create index if not exists ix_hunter_schedules_due
  on hunter_schedules (next_run_at, brand_id)
  where enabled = true;

create unique index if not exists uq_hunter_run_records_brand_running
  on hunter_run_records (brand_id)
  where status = 'running';

commit;
