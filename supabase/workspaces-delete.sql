-- Safe workspace (project) deletion: block personal, cascade financial data, RPCs
-- Run after: workspaces.sql, workspaces-rls.sql, workspaces-core-migration.sql, budgets.sql
-- Idempotent

-- ============================================================
-- 0) Ensure workspace_id on financial tables (required by trigger + impact RPC)
--    Safe if workspaces-core-migration.sql already ran.
-- ============================================================
alter table public.categories add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table public.transactions add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table public.budgets add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

create index if not exists idx_categories_workspace_id on public.categories(workspace_id);
create index if not exists idx_transactions_workspace_id on public.transactions(workspace_id);
create index if not exists idx_budgets_workspace_id on public.budgets(workspace_id);

update public.budgets b
set workspace_id = c.workspace_id
from public.categories c
where b.category_id = c.id
  and b.workspace_id is null
  and c.workspace_id is not null;

-- ============================================================
-- RLS: owners may delete only non-personal workspaces
-- ============================================================
drop policy if exists "Owners can delete workspace" on public.workspaces;
create policy "Owners can delete workspace"
on public.workspaces
for delete
using (
  public.is_workspace_owner(id)
  and type <> 'personal'
);

-- ============================================================
-- BEFORE DELETE: forbid personal + remove scoped financial rows
-- (FKs on categories/transactions/budgets use ON DELETE SET NULL — cleanup is required)
-- ============================================================
create or replace function public.workspaces_before_delete_guard_and_cleanup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.type = 'personal' then
    raise exception 'WORKSPACE_PERSONAL_IMMUTABLE'
      using errcode = 'P0001';
  end if;

  delete from public.transactions
  where workspace_id = old.id;

  delete from public.budgets
  where workspace_id = old.id;

  delete from public.categories
  where workspace_id = old.id;

  return old;
end;
$$;

drop trigger if exists workspaces_before_delete_guard on public.workspaces;
create trigger workspaces_before_delete_guard
before delete on public.workspaces
for each row
execute function public.workspaces_before_delete_guard_and_cleanup();

revoke all on function public.workspaces_before_delete_guard_and_cleanup() from public;

-- ============================================================
-- RPC: delete workspace (owner, non-personal only)
-- ============================================================
create or replace function public.delete_workspace(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  wtype text;
  is_owner boolean;
begin
  select w.type, (wm.role = 'owner')
  into wtype, is_owner
  from public.workspaces w
  left join public.workspace_members wm
    on wm.workspace_id = w.id
   and wm.user_id = auth.uid()
  where w.id = p_workspace_id;

  if wtype is null then
    raise exception 'WORKSPACE_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  if not coalesce(is_owner, false) then
    raise exception 'WORKSPACE_NOT_OWNER'
      using errcode = 'P0001';
  end if;

  if wtype = 'personal' then
    raise exception 'WORKSPACE_PERSONAL_IMMUTABLE'
      using errcode = 'P0001';
  end if;

  delete from public.workspaces
  where id = p_workspace_id;
end;
$$;

revoke all on function public.delete_workspace(uuid) from public;
grant execute on function public.delete_workspace(uuid) to authenticated;

-- ============================================================
-- RPC: preview row counts for confirmation UI
-- ============================================================
create or replace function public.get_workspace_delete_impact(p_workspace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  wtype text;
  is_owner boolean;
  tx_count bigint;
  budget_count bigint;
  category_count bigint;
  member_count bigint;
  other_members bigint;
begin
  select w.type, (wm.role = 'owner')
  into wtype, is_owner
  from public.workspaces w
  left join public.workspace_members wm
    on wm.workspace_id = w.id
   and wm.user_id = auth.uid()
  where w.id = p_workspace_id;

  if wtype is null then
    raise exception 'WORKSPACE_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  if not coalesce(is_owner, false) then
    raise exception 'WORKSPACE_NOT_OWNER'
      using errcode = 'P0001';
  end if;

  if wtype = 'personal' then
    raise exception 'WORKSPACE_PERSONAL_IMMUTABLE'
      using errcode = 'P0001';
  end if;

  select count(*) into tx_count
  from public.transactions
  where workspace_id = p_workspace_id;

  select count(*) into budget_count
  from public.budgets
  where workspace_id = p_workspace_id;

  select count(*) into category_count
  from public.categories
  where workspace_id = p_workspace_id;

  select count(*) into member_count
  from public.workspace_members
  where workspace_id = p_workspace_id;

  select count(*) into other_members
  from public.workspace_members
  where workspace_id = p_workspace_id
    and user_id <> auth.uid();

  return jsonb_build_object(
    'transactions', tx_count,
    'budgets', budget_count,
    'categories', category_count,
    'members', member_count,
    'other_members', other_members
  );
end;
$$;

revoke all on function public.get_workspace_delete_impact(uuid) from public;
grant execute on function public.get_workspace_delete_impact(uuid) to authenticated;
