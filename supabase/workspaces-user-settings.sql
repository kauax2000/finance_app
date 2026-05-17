-- Persist current workspace selection per user
-- Run in Supabase SQL Editor (idempotent)

alter table public.user_settings
  add column if not exists current_workspace_id uuid references public.workspaces(id) on delete set null;

create index if not exists idx_user_settings_current_workspace
  on public.user_settings(current_workspace_id);

