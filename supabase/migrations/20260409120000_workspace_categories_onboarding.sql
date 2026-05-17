-- Categories onboarding: workspace-level completion flag (any member can set via RPC; owners-only UPDATE on workspaces would block otherwise).

alter table public.workspaces
  add column if not exists categories_onboarding_completed_at timestamptz;

comment on column public.workspaces.categories_onboarding_completed_at is
  'When set, the categories/budgets onboarding wizard is skipped for this workspace.';

-- Existing workspaces: avoid forcing the wizard on upgrade.
update public.workspaces w
set categories_onboarding_completed_at = coalesce(w.categories_onboarding_completed_at, now())
where w.categories_onboarding_completed_at is null;

create or replace function public.complete_workspace_categories_onboarding(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'not a workspace member';
  end if;

  update public.workspaces
  set
    categories_onboarding_completed_at = now(),
    updated_at = now()
  where id = p_workspace_id;
end;
$$;

revoke all on function public.complete_workspace_categories_onboarding(uuid) from public;
grant execute on function public.complete_workspace_categories_onboarding(uuid) to authenticated;
