-- Workspaces RLS, helpers, and policies
-- Run in Supabase SQL Editor after workspaces.sql (idempotent)

-- Enable RLS
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invites enable row level security;

-- ============================================================
-- Helper functions (SECURITY DEFINER, minimal surface area)
-- ============================================================
create or replace function public.is_workspace_member(workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = is_workspace_member.workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.workspace_role(workspace_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = workspace_role.workspace_id
    and wm.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_workspace_owner(workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.workspace_role(is_workspace_owner.workspace_id) = 'owner';
$$;

-- ============================================================
-- Policies: workspaces
-- ============================================================
drop policy if exists "Users can view own workspaces" on public.workspaces;
create policy "Users can view own workspaces"
on public.workspaces
for select
using (
  public.is_workspace_member(id)
  or created_by = auth.uid()
);

drop policy if exists "Users can create workspaces" on public.workspaces;
create policy "Users can create workspaces"
on public.workspaces
for insert
with check (auth.uid() = created_by);

drop policy if exists "Owners can update workspace" on public.workspaces;
create policy "Owners can update workspace"
on public.workspaces
for update
using (public.is_workspace_owner(id));

drop policy if exists "Owners can delete workspace" on public.workspaces;
create policy "Owners can delete workspace"
on public.workspaces
for delete
using (
  public.is_workspace_owner(id)
  and type <> 'personal'
);

-- ============================================================
-- Policies: workspace_members
-- ============================================================
drop policy if exists "Users can view members of own workspaces" on public.workspace_members;
create policy "Users can view members of own workspaces"
on public.workspace_members
for select
using (public.is_workspace_member(workspace_id));

-- Bootstrap: criador ainda não é membro → is_workspace_owner é falso até existir linha.
-- Permitir ao created_by inserir-se a si próprio como owner (primeiro membro).
drop policy if exists "Owners can add members" on public.workspace_members;
create policy "Owners can add members"
on public.workspace_members
for insert
with check (
  public.is_workspace_owner(workspace_id)
  or (
    exists (
      select 1
      from public.workspaces w
      where w.id = workspace_id
        and w.created_by = auth.uid()
    )
    and user_id = auth.uid()
    and role = 'owner'
  )
);

drop policy if exists "Owners can update member roles" on public.workspace_members;
create policy "Owners can update member roles"
on public.workspace_members
for update
using (public.is_workspace_owner(workspace_id));

drop policy if exists "Owners can remove members" on public.workspace_members;
create policy "Owners can remove members"
on public.workspace_members
for delete
using (public.is_workspace_owner(workspace_id));

-- Allow a user to leave a workspace (except owner) in v1
drop policy if exists "Members can leave workspace" on public.workspace_members;
create policy "Members can leave workspace"
on public.workspace_members
for delete
using (
  auth.uid() = user_id
  and public.workspace_role(workspace_id) = 'member'
);

-- ============================================================
-- Policies: workspace_invites
-- ============================================================
drop policy if exists "Owners can view invites" on public.workspace_invites;
create policy "Owners can view invites"
on public.workspace_invites
for select
using (public.is_workspace_owner(workspace_id));

drop policy if exists "Owners can create invites" on public.workspace_invites;
create policy "Owners can create invites"
on public.workspace_invites
for insert
with check (
  public.is_workspace_owner(workspace_id)
  and auth.uid() = created_by
);

drop policy if exists "Owners can update invites" on public.workspace_invites;
create policy "Owners can update invites"
on public.workspace_invites
for update
using (public.is_workspace_owner(workspace_id));

