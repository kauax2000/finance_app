-- Workspace-scoped subscription registry (recurring services / bills)

create table if not exists public.workspace_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(15, 2) not null,
  billing_interval text not null,
  currency text not null default 'BRL',
  start_date date not null,
  next_billing_date date,
  day_of_month smallint,
  wallet_id uuid references public.wallets(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_subscriptions_billing_interval_check
    check (billing_interval in ('weekly', 'monthly', 'yearly')),
  constraint workspace_subscriptions_day_of_month_range check (
    day_of_month is null or (day_of_month >= 1 and day_of_month <= 31)
  )
);

create index if not exists idx_workspace_subscriptions_workspace_id
  on public.workspace_subscriptions(workspace_id);

alter table public.workspace_subscriptions enable row level security;

drop policy if exists "Workspace members can view workspace_subscriptions"
  on public.workspace_subscriptions;
create policy "Workspace members can view workspace_subscriptions"
on public.workspace_subscriptions for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can insert workspace_subscriptions"
  on public.workspace_subscriptions;
create policy "Workspace members can insert workspace_subscriptions"
on public.workspace_subscriptions for insert
with check (
  public.is_workspace_member(workspace_id)
  and auth.uid() = user_id
);

drop policy if exists "Workspace members can update workspace_subscriptions"
  on public.workspace_subscriptions;
create policy "Workspace members can update workspace_subscriptions"
on public.workspace_subscriptions for update
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can delete workspace_subscriptions"
  on public.workspace_subscriptions;
create policy "Workspace members can delete workspace_subscriptions"
on public.workspace_subscriptions for delete
using (public.is_workspace_member(workspace_id));

do $$
begin
  if exists (
    select 1
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'set_updated_at'
  ) then
    drop trigger if exists set_workspace_subscriptions_updated_at
      on public.workspace_subscriptions;
    create trigger set_workspace_subscriptions_updated_at
      before update on public.workspace_subscriptions
      for each row execute function public.set_updated_at();
  end if;
end $$;
