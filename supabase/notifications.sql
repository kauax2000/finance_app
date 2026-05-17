-- In-app notifications center
-- Run in Supabase SQL Editor (idempotent)
-- After workspaces + is_workspace_member exist, run notifications-workspace-scoped.sql
-- so each row has workspace_id and RLS matches project membership.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('transaction','budget','system','promotion')),
  title text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created_at
  on public.notifications(user_id, created_at desc);

create index if not exists idx_notifications_user_read_at
  on public.notifications(user_id, read_at);

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
on public.notifications
for select
using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications
for update
using (auth.uid() = user_id);

-- Inserts should be done via Edge Function using service role.
-- If you want the client to insert its own notifications, add a strict insert policy like:
--   create policy ... for insert with check (auth.uid() = user_id);

-- Inserts from Edge Functions use service role (bypass RLS). Client read/update/delete
-- policies for workspace-scoped rows are defined in notifications-workspace-scoped.sql.

