create table brand_discovery_plan_versions (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  revision integer not null check (revision > 0),
  schema_version text not null,
  plan_version text not null,
  snapshot_version text not null,
  state text not null check (state in ('initial','customized')),
  topics jsonb not null,
  excluded_topics jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (brand_id, revision),
  unique (brand_id, plan_version)
);

create index brand_discovery_plan_versions_latest_idx
  on brand_discovery_plan_versions (brand_id, revision desc);
