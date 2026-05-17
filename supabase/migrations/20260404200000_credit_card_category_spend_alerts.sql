-- Open-invoice category spend alerts per credit card (workspace-scoped, server-persisted)

create table if not exists public.credit_card_category_spend_alerts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  credit_card_id uuid not null references public.credit_cards(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  threshold_brl numeric(15, 2) not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_card_category_spend_alerts_threshold_positive
    check (threshold_brl > 0)
);

create unique index if not exists credit_card_category_spend_alerts_card_uncategorized_unique
  on public.credit_card_category_spend_alerts (credit_card_id)
  where category_id is null;

create unique index if not exists credit_card_category_spend_alerts_card_category_unique
  on public.credit_card_category_spend_alerts (credit_card_id, category_id)
  where category_id is not null;

create index if not exists idx_cc_category_spend_alerts_workspace_id
  on public.credit_card_category_spend_alerts (workspace_id);

create index if not exists idx_cc_category_spend_alerts_credit_card_id
  on public.credit_card_category_spend_alerts (credit_card_id);

create or replace function public.set_credit_card_category_spend_alert_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  w uuid;
  cat_ws uuid;
begin
  select cc.workspace_id into strict w
  from public.credit_cards cc
  where cc.id = new.credit_card_id;

  new.workspace_id := w;

  if new.category_id is not null then
    select c.workspace_id into cat_ws
    from public.categories c
    where c.id = new.category_id;

    if cat_ws is null or cat_ws is distinct from new.workspace_id then
      raise exception 'category not in card workspace';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_cc_category_spend_alerts_workspace
  on public.credit_card_category_spend_alerts;
create trigger trg_cc_category_spend_alerts_workspace
  before insert or update on public.credit_card_category_spend_alerts
  for each row execute function public.set_credit_card_category_spend_alert_workspace();

alter table public.credit_card_category_spend_alerts enable row level security;

drop policy if exists "Workspace members can view credit_card_category_spend_alerts"
  on public.credit_card_category_spend_alerts;
create policy "Workspace members can view credit_card_category_spend_alerts"
on public.credit_card_category_spend_alerts for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can insert credit_card_category_spend_alerts"
  on public.credit_card_category_spend_alerts;
create policy "Workspace members can insert credit_card_category_spend_alerts"
on public.credit_card_category_spend_alerts for insert
with check (
  public.is_workspace_member(workspace_id)
  and auth.uid() = created_by
);

drop policy if exists "Workspace members can update credit_card_category_spend_alerts"
  on public.credit_card_category_spend_alerts;
create policy "Workspace members can update credit_card_category_spend_alerts"
on public.credit_card_category_spend_alerts for update
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can delete credit_card_category_spend_alerts"
  on public.credit_card_category_spend_alerts;
create policy "Workspace members can delete credit_card_category_spend_alerts"
on public.credit_card_category_spend_alerts for delete
using (public.is_workspace_member(workspace_id));

do $$
begin
  if exists (
    select 1
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'set_updated_at'
  ) then
    drop trigger if exists set_credit_card_category_spend_alerts_updated_at
      on public.credit_card_category_spend_alerts;
    create trigger set_credit_card_category_spend_alerts_updated_at
      before update on public.credit_card_category_spend_alerts
      for each row execute function public.set_updated_at();
  end if;
end $$;
