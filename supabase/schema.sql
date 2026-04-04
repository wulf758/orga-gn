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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.game_memberships (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'orga', 'lecture')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (game_id, user_id)
);

create index if not exists idx_game_memberships_game_id on public.game_memberships(game_id);
create index if not exists idx_game_memberships_user_id on public.game_memberships(user_id);
create index if not exists idx_game_memberships_role on public.game_memberships(role);
