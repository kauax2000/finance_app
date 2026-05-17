-- Per-workspace notification preferences (one row per member per project)
-- Run after: workspaces.sql, workspaces-rls.sql, user-settings.sql, workspace_members populated
-- Then run: notifications-workspace-scoped.sql, user-settings-notification-columns-drop.sql

create table if not exists public.workspace_member_notification_prefs (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  notify_email boolean not null default true,
  notify_in_app boolean not null default true,
  notify_transactions boolean not null default true,
  notify_budget boolean not null default true,
  notify_promotions boolean not null default false,
  notify_credit_cards boolean not null default true,
  notify_credit_card_calendar boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists idx_workspace_member_notification_prefs_user
  on public.workspace_member_notification_prefs(user_id);

do $$
begin
  if exists (
    select 1 from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'set_updated_at'
  ) then
    drop trigger if exists set_workspace_member_notification_prefs_updated_at
      on public.workspace_member_notification_prefs;
    create trigger set_workspace_member_notification_prefs_updated_at
      before update on public.workspace_member_notification_prefs
      for each row execute function public.set_updated_at();
  end if;
end
$$;

-- New members get a prefs row with defaults
create or replace function public.ensure_workspace_member_notification_prefs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_member_notification_prefs (workspace_id, user_id)
  values (new.workspace_id, new.user_id)
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_workspace_members_notification_prefs on public.workspace_members;
create trigger trg_workspace_members_notification_prefs
after insert on public.workspace_members
for each row execute function public.ensure_workspace_member_notification_prefs();

-- Backfill: copy global user_settings into each membership (if notify columns still exist)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_settings'
      and column_name = 'notify_email'
  ) then
    insert into public.workspace_member_notification_prefs (
      workspace_id,
      user_id,
      notify_email,
      notify_in_app,
      notify_transactions,
      notify_budget,
      notify_promotions
    )
    select
      wm.workspace_id,
      wm.user_id,
      coalesce(us.notify_email, true),
      coalesce(us.notify_in_app, true),
      coalesce(us.notify_transactions, true),
      coalesce(us.notify_budget, true),
      coalesce(us.notify_promotions, false)
    from public.workspace_members wm
    left join public.user_settings us on us.user_id = wm.user_id
    on conflict (workspace_id, user_id) do nothing;
  else
    insert into public.workspace_member_notification_prefs (workspace_id, user_id)
    select wm.workspace_id, wm.user_id
    from public.workspace_members wm
    on conflict (workspace_id, user_id) do nothing;
  end if;
end
$$;

alter table public.workspace_member_notification_prefs enable row level security;

drop policy if exists "Members can view own workspace notification prefs"
  on public.workspace_member_notification_prefs;
create policy "Members can view own workspace notification prefs"
on public.workspace_member_notification_prefs
for select
using (
  auth.uid() = user_id
  and public.is_workspace_member(workspace_id)
);

drop policy if exists "Members can insert own workspace notification prefs"
  on public.workspace_member_notification_prefs;
create policy "Members can insert own workspace notification prefs"
on public.workspace_member_notification_prefs
for insert
with check (
  auth.uid() = user_id
  and public.is_workspace_member(workspace_id)
);

drop policy if exists "Members can update own workspace notification prefs"
  on public.workspace_member_notification_prefs;
create policy "Members can update own workspace notification prefs"
on public.workspace_member_notification_prefs
for update
using (
  auth.uid() = user_id
  and public.is_workspace_member(workspace_id)
);
