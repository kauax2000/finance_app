-- Core financial data RLS: workspace membership (not user_id owner-only).
-- Fixes invited members seeing empty transactions/categories on shared workspaces.
-- Prerequisite: public.workspaces, public.workspace_members, public.is_workspace_member.

-- ---------------------------------------------------------------------------
-- RLS helpers (idempotent; initplan-friendly auth.uid())
-- ---------------------------------------------------------------------------
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
      and wm.user_id = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_splits enable row level security;
alter table public.budgets enable row level security;

-- ============================================================
-- Categories
-- ============================================================
drop policy if exists "Users can view own categories" on public.categories;
drop policy if exists "Users can insert own categories" on public.categories;
drop policy if exists "Users can update own categories" on public.categories;
drop policy if exists "Users can delete own categories" on public.categories;

drop policy if exists "Workspace members can view categories" on public.categories;
create policy "Workspace members can view categories"
on public.categories
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can insert categories" on public.categories;
create policy "Workspace members can insert categories"
on public.categories
for insert
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can update categories" on public.categories;
create policy "Workspace members can update categories"
on public.categories
for update
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can delete categories" on public.categories;
create policy "Workspace members can delete categories"
on public.categories
for delete
using (public.is_workspace_member(workspace_id));

-- ============================================================
-- Transactions
-- ============================================================
drop policy if exists "Users can view own transactions" on public.transactions;
drop policy if exists "Users can insert own transactions" on public.transactions;
drop policy if exists "Users can update own transactions" on public.transactions;
drop policy if exists "Users can delete own transactions" on public.transactions;

drop policy if exists "Workspace members can view transactions" on public.transactions;
create policy "Workspace members can view transactions"
on public.transactions
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can insert transactions" on public.transactions;
create policy "Workspace members can insert transactions"
on public.transactions
for insert
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can update transactions" on public.transactions;
create policy "Workspace members can update transactions"
on public.transactions
for update
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can delete transactions" on public.transactions;
create policy "Workspace members can delete transactions"
on public.transactions
for delete
using (public.is_workspace_member(workspace_id));

-- ============================================================
-- Transaction splits
-- ============================================================
drop policy if exists "Users can view own splits" on public.transaction_splits;
drop policy if exists "Users can insert own splits" on public.transaction_splits;
drop policy if exists "Users can update own splits" on public.transaction_splits;
drop policy if exists "Users can delete own splits" on public.transaction_splits;

drop policy if exists "Workspace members can view splits" on public.transaction_splits;
create policy "Workspace members can view splits"
on public.transaction_splits
for select
using (
  exists (
    select 1
    from public.transactions t
    where t.id = transaction_splits.transaction_id
      and public.is_workspace_member(t.workspace_id)
  )
);

drop policy if exists "Workspace members can insert splits" on public.transaction_splits;
create policy "Workspace members can insert splits"
on public.transaction_splits
for insert
with check (
  exists (
    select 1
    from public.transactions t
    where t.id = transaction_splits.transaction_id
      and public.is_workspace_member(t.workspace_id)
  )
);

drop policy if exists "Workspace members can update splits" on public.transaction_splits;
create policy "Workspace members can update splits"
on public.transaction_splits
for update
using (
  exists (
    select 1
    from public.transactions t
    where t.id = transaction_splits.transaction_id
      and public.is_workspace_member(t.workspace_id)
  )
);

drop policy if exists "Workspace members can delete splits" on public.transaction_splits;
create policy "Workspace members can delete splits"
on public.transaction_splits
for delete
using (
  exists (
    select 1
    from public.transactions t
    where t.id = transaction_splits.transaction_id
      and public.is_workspace_member(t.workspace_id)
  )
);

-- ============================================================
-- Budgets
-- ============================================================
drop policy if exists "Users can view own budgets" on public.budgets;
drop policy if exists "Users can insert own budgets" on public.budgets;
drop policy if exists "Users can update own budgets" on public.budgets;
drop policy if exists "Users can delete own budgets" on public.budgets;

drop policy if exists "Workspace members can view budgets" on public.budgets;
create policy "Workspace members can view budgets"
on public.budgets
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can insert budgets" on public.budgets;
create policy "Workspace members can insert budgets"
on public.budgets
for insert
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can update budgets" on public.budgets;
create policy "Workspace members can update budgets"
on public.budgets
for update
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can delete budgets" on public.budgets;
create policy "Workspace members can delete budgets"
on public.budgets
for delete
using (public.is_workspace_member(workspace_id));

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
