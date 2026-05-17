-- Patch: allow creators to SELECT a workspace before workspace_members row exists
-- (fixes insert + .select().single() in the app right after creating a row)
-- Run in Supabase SQL Editor if you already applied an older workspaces-rls.sql

drop policy if exists "Users can view own workspaces" on public.workspaces;
create policy "Users can view own workspaces"
on public.workspaces
for select
using (
  public.is_workspace_member(id)
  or created_by = auth.uid()
);
