-- Budgets (per category + period) with threshold de-dupe fields
-- Run in Supabase SQL Editor (idempotent)

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  amount numeric not null check (amount > 0),
  threshold_80_sent_at timestamptz,
  threshold_100_sent_at timestamptz,
  threshold_over_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_period_check check (period_end >= period_start)
);

create unique index if not exists idx_budgets_user_category_period
  on public.budgets(user_id, category_id, period_start);

create index if not exists idx_budgets_user_period
  on public.budgets(user_id, period_start, period_end);

alter table public.budgets enable row level security;

drop policy if exists "Users can view own budgets" on public.budgets;
create policy "Users can view own budgets"
on public.budgets
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own budgets" on public.budgets;
create policy "Users can insert own budgets"
on public.budgets
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own budgets" on public.budgets;
create policy "Users can update own budgets"
on public.budgets
for update
using (auth.uid() = user_id);

drop policy if exists "Users can delete own budgets" on public.budgets;
create policy "Users can delete own budgets"
on public.budgets
for delete
using (auth.uid() = user_id);

-- updated_at trigger (reuse public.set_updated_at from user-settings.sql if present)
do $$
begin
  if exists (select 1 from pg_proc where pronamespace = 'public'::regnamespace and proname = 'set_updated_at') then
    drop trigger if exists set_budgets_updated_at on public.budgets;
    create trigger set_budgets_updated_at
    before update on public.budgets
    for each row execute function public.set_updated_at();
  end if;
end
$$;

