-- Corrige impasse: criar projeto novo + inserir primeiro workspace_members como owner
-- Executar no SQL Editor se já aplicaste workspaces-rls.sql sem esta regra.

drop policy if exists "Owners can add members" on public.workspace_members;
create policy "Owners can add members"
on public.workspace_members
for insert
with check (
  public.is_workspace_owner(workspace_id)
  or (
    exists (
      select 1
      from public.workspaces w
      where w.id = workspace_id
        and w.created_by = auth.uid()
    )
    and user_id = auth.uid()
    and role = 'owner'
  )
);
