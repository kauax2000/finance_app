-- Add workspace_id to core tables + backfill into personal workspaces
-- Run in Supabase SQL Editor (idempotent-ish; safe to re-run)

create extension if not exists "pgcrypto";

-- ============================================================
-- 1) Add workspace_id columns
-- ============================================================
alter table public.wallets add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table public.categories add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table public.transactions add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table public.budgets add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

create index if not exists idx_wallets_workspace_id on public.wallets(workspace_id);
create index if not exists idx_categories_workspace_id on public.categories(workspace_id);
create index if not exists idx_transactions_workspace_id on public.transactions(workspace_id);
create index if not exists idx_budgets_workspace_id on public.budgets(workspace_id);

-- ============================================================
-- 2) Ensure each user has a personal workspace + owner membership
-- ============================================================
-- Source users from profiles (created by your existing handle_new_user).
with users as (
  select p.id as user_id, coalesce(nullif(trim(p.full_name), ''), 'Pessoal') as display_name
  from public.profiles p
),
missing as (
  select u.user_id, u.display_name
  from users u
  where not exists (
    select 1
    from public.workspace_members wm
    join public.workspaces w on w.id = wm.workspace_id
    where wm.user_id = u.user_id
      and w.type = 'personal'
      and w.created_by = u.user_id
  )
),
ins as (
  insert into public.workspaces (id, name, type, created_by)
  select gen_random_uuid(), 'Pessoal', 'personal', m.user_id
  from missing m
  returning id, created_by
)
insert into public.workspace_members (workspace_id, user_id, role)
select i.id, i.created_by, 'owner'
from ins i
on conflict (workspace_id, user_id) do nothing;

-- ============================================================
-- 3) Backfill workspace_id on existing rows
-- ============================================================
-- Pick the user's personal workspace (created_by=user_id, type=personal).
with personal as (
  select distinct on (w.created_by)
    w.created_by as user_id,
    w.id as workspace_id
  from public.workspaces w
  where w.type = 'personal'
  order by w.created_by, w.created_at asc
)
update public.wallets t
set workspace_id = p.workspace_id
from personal p
where t.workspace_id is null
  and t.user_id = p.user_id;

with personal as (
  select distinct on (w.created_by)
    w.created_by as user_id,
    w.id as workspace_id
  from public.workspaces w
  where w.type = 'personal'
  order by w.created_by, w.created_at asc
)
update public.categories t
set workspace_id = p.workspace_id
from personal p
where t.workspace_id is null
  and t.user_id = p.user_id;

with personal as (
  select distinct on (w.created_by)
    w.created_by as user_id,
    w.id as workspace_id
  from public.workspaces w
  where w.type = 'personal'
  order by w.created_by, w.created_at asc
)
update public.transactions t
set workspace_id = p.workspace_id
from personal p
where t.workspace_id is null
  and t.user_id = p.user_id;

with personal as (
  select distinct on (w.created_by)
    w.created_by as user_id,
    w.id as workspace_id
  from public.workspaces w
  where w.type = 'personal'
  order by w.created_by, w.created_at asc
)
update public.budgets t
set workspace_id = p.workspace_id
from personal p
where t.workspace_id is null
  and t.user_id = p.user_id;

