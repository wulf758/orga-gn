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

alter table public.workspaces enable row level security;
alter table public.sessions enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.profiles enable row level security;
alter table public.game_memberships enable row level security;

drop policy if exists "members can read their workspaces" on public.workspaces;
create policy "members can read their workspaces"
on public.workspaces
for select
to authenticated
using (
  exists (
    select 1
    from public.game_memberships membership
    where membership.game_id = workspaces.id
      and membership.user_id = (select auth.uid())
  )
);

drop policy if exists "users can read their own profile" on public.profiles;
create policy "users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "users can create their own profile" on public.profiles;
create policy "users can create their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "users can read their own memberships" on public.game_memberships;
create policy "users can read their own memberships"
on public.game_memberships
for select
to authenticated
using (user_id = (select auth.uid()));
