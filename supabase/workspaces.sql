-- Workspaces (personal + shared) + invites/members
-- Run in Supabase SQL Editor (idempotent)

-- Extensions commonly available in Supabase; safe to call.
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLE: workspaces
-- ============================================================
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'personal' check (type in ('personal','shared')),
  created_by uuid not null references auth.users(id) on delete cascade,
  icon text not null default 'home',
  icon_background_color text not null default '#2563EB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workspaces_created_by
  on public.workspaces(created_by);

create index if not exists idx_workspaces_type
  on public.workspaces(type);

-- ============================================================
-- TABLE: workspace_members
-- ============================================================
create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists idx_workspace_members_user
  on public.workspace_members(user_id);

create index if not exists idx_workspace_members_workspace
  on public.workspace_members(workspace_id);

-- ============================================================
-- TABLE: workspace_invites
-- ============================================================
create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invited_email text,
  role text not null default 'member' check (role in ('member')),
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  usage_count int not null default 0,
  max_uses int null,
  token_raw text,
  constraint workspace_invites_email_max_uses_chk check (
    (invited_email is not null and max_uses = 1)
    or (invited_email is null)
  )
);

create index if not exists idx_workspace_invites_workspace_status
  on public.workspace_invites(workspace_id, status, created_at desc);

create index if not exists idx_workspace_invites_invited_email
  on public.workspace_invites(invited_email);

create index if not exists idx_workspace_invites_created_by
  on public.workspace_invites(created_by, created_at desc);

-- ============================================================
-- TRIGGERS: updated_at (reuse public.set_updated_at if present)
-- ============================================================
do $$
begin
  if exists (
    select 1
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'set_updated_at'
  ) then
    drop trigger if exists set_workspaces_updated_at on public.workspaces;
    create trigger set_workspaces_updated_at
    before update on public.workspaces
    for each row execute function public.set_updated_at();
  end if;
end
$$;

