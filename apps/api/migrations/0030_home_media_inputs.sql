begin;

alter table simple_creation_requests
  add column media_asset_ids jsonb not null default '[]'::jsonb,
  add constraint simple_creation_media_asset_ids_array check (jsonb_typeof(media_asset_ids) = 'array'),
  add constraint simple_creation_media_asset_ids_bounded check (jsonb_array_length(media_asset_ids) <= 12);

create table home_media_uploads (
  id text primary key,
  account_id text not null references accounts(id) on delete cascade,
  workspace_id text not null references workspaces(id) on delete cascade,
  brand_id text not null references brands(id) on delete cascade,
  object_key text not null unique,
  file_name text not null,
  kind text not null check (kind in ('image','video')),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  status text not null check (status in ('pending','completed')),
  expires_at timestamptz not null,
  created_at timestamptz not null,
  completed_at timestamptz,
  library_asset_id text references content_library_assets(id) on delete set null
);

create index home_media_uploads_scope_idx
  on home_media_uploads(workspace_id, brand_id, status, created_at desc);

commit;
