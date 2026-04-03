create table if not exists public.workspaces (
  id text primary key,
  name text not null unique,
  password_hash text not null,
  workspace_json jsonb not null,
  document_count integer not null default 0,
  character_count integer not null default 0,
  plot_count integer not null default 0,
  kraft_count integer not null default 0,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  archived_at timestamptz
);

create table if not exists public.sessions (
  token_hash text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null
);

create index if not exists idx_sessions_workspace_id on public.sessions(workspace_id);
create index if not exists idx_sessions_expires_at on public.sessions(expires_at);

create table if not exists public.admin_sessions (
  token_hash text primary key,
  expires_at timestamptz not null,
  created_at timestamptz not null
);

create index if not exists idx_admin_sessions_expires_at on public.admin_sessions(expires_at);
