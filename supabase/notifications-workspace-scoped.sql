-- Scope notifications to workspaces + RLS (recipient must still be member)
-- Prerequisites: public.notifications, public.workspaces, public.is_workspace_member
-- Run after: workspace-member-notification-prefs.sql (recommended)

alter table public.notifications
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

-- Backfill workspace_id
update public.notifications n
set workspace_id = (n.metadata->>'workspace_id')::uuid
where n.workspace_id is null
  and (n.metadata ? 'workspace_id')
  and (n.metadata->>'workspace_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Resolve workspace from budget → category (works even when budgets.workspace_id was never added)
update public.notifications n
set workspace_id = c.workspace_id
from public.budgets b
inner join public.categories c on c.id = b.category_id
where n.workspace_id is null
  and (n.metadata ? 'budget_id')
  and b.id = (n.metadata->>'budget_id')::uuid
  and c.workspace_id is not null;

-- If budgets.workspace_id exists and category path missed (edge case), fill from budget row
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'budgets'
      and column_name = 'workspace_id'
  ) then
    update public.notifications n
    set workspace_id = b.workspace_id
    from public.budgets b
    where n.workspace_id is null
      and (n.metadata ? 'budget_id')
      and b.id = (n.metadata->>'budget_id')::uuid
      and b.workspace_id is not null;
  end if;
end
$$;

update public.notifications n
set workspace_id = (
  select w.id
  from public.workspaces w
  where w.created_by = n.user_id
    and w.type = 'personal'
  order by w.created_at asc
  limit 1
)
where n.workspace_id is null;

update public.notifications n
set workspace_id = (
  select wm.workspace_id
  from public.workspace_members wm
  where wm.user_id = n.user_id
  order by wm.joined_at asc
  limit 1
)
where n.workspace_id is null;

delete from public.notifications where workspace_id is null;

alter table public.notifications
  alter column workspace_id set not null;

create index if not exists idx_notifications_workspace_user_created
  on public.notifications(workspace_id, user_id, created_at desc);

create index if not exists idx_notifications_workspace_user_unread
  on public.notifications(workspace_id, user_id)
  where read_at is null;

drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
drop policy if exists "Workspace members can view own notifications" on public.notifications;
drop policy if exists "Workspace members can update own notifications" on public.notifications;
drop policy if exists "Workspace members can delete own notifications" on public.notifications;

create policy "Workspace members can view own notifications"
on public.notifications
for select
using (
  auth.uid() = user_id
  and public.is_workspace_member(workspace_id)
);

create policy "Workspace members can update own notifications"
on public.notifications
for update
using (
  auth.uid() = user_id
  and public.is_workspace_member(workspace_id)
);

create policy "Workspace members can delete own notifications"
on public.notifications
for delete
using (
  auth.uid() = user_id
  and public.is_workspace_member(workspace_id)
);
