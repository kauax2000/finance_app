-- Core RLS switched from user_id to workspace membership
-- Run after workspaces-rls.sql + workspaces-core-migration.sql

-- Ensure RLS enabled
alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_splits enable row level security;
alter table public.budgets enable row level security;

-- ============================================================
-- Wallets
-- ============================================================
drop policy if exists "Users can view own wallets" on public.wallets;
drop policy if exists "Users can insert own wallets" on public.wallets;
drop policy if exists "Users can update own wallets" on public.wallets;
drop policy if exists "Users can delete own wallets" on public.wallets;

create policy "Workspace members can view wallets"
on public.wallets
for select
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert wallets"
on public.wallets
for insert
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update wallets"
on public.wallets
for update
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can delete wallets"
on public.wallets
for delete
using (public.is_workspace_member(workspace_id));

-- ============================================================
-- Categories
-- ============================================================
drop policy if exists "Users can view own categories" on public.categories;
drop policy if exists "Users can insert own categories" on public.categories;
drop policy if exists "Users can update own categories" on public.categories;
drop policy if exists "Users can delete own categories" on public.categories;

create policy "Workspace members can view categories"
on public.categories
for select
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert categories"
on public.categories
for insert
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update categories"
on public.categories
for update
using (public.is_workspace_member(workspace_id));

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

create policy "Workspace members can view transactions"
on public.transactions
for select
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert transactions"
on public.transactions
for insert
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update transactions"
on public.transactions
for update
using (public.is_workspace_member(workspace_id));

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

create policy "Workspace members can view budgets"
on public.budgets
for select
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert budgets"
on public.budgets
for insert
with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update budgets"
on public.budgets
for update
using (public.is_workspace_member(workspace_id));

create policy "Workspace members can delete budgets"
on public.budgets
for delete
using (public.is_workspace_member(workspace_id));

