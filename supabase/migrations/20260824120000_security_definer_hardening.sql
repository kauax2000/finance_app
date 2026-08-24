-- Security hardening for SECURITY DEFINER functions.
--
-- 1. `delete_workspace_installment_plan_cascade` failed OPEN: the membership
--    check was skipped entirely when `auth.uid()` was NULL, so an unauthenticated
--    execution path could cascade-delete a plan and its transactions. The auth
--    check now comes first and raises, matching the pattern used by
--    `complete_workspace_categories_onboarding` and `create_workspace_installment_plan`.
-- 2. `cleanup_expired_sessions` was SECURITY DEFINER with a mutable search_path
--    and PUBLIC execute. Pin search_path and restrict to service_role.
-- 3. Pin search_path on the remaining definer/trigger helpers that lacked it and
--    drop the implicit PUBLIC execute from workspace helper functions.

-- ---------------------------------------------------------------------------
-- 1. Fail-closed cascade delete (auth check BEFORE any lookup)
-- ---------------------------------------------------------------------------
create or replace function public.delete_workspace_installment_plan_cascade(p_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select workspace_id into v_workspace_id
  from public.workspace_installment_plans
  where id = p_plan_id;

  if not found then
    return;
  end if;

  if not public.is_workspace_member(v_workspace_id) then
    raise exception 'Forbidden';
  end if;

  delete from public.transactions
  where installment_plan_id = p_plan_id;

  delete from public.workspace_installment_plans
  where id = p_plan_id;
end;
$$;

revoke all on function public.delete_workspace_installment_plan_cascade(uuid) from public;
grant execute on function public.delete_workspace_installment_plan_cascade(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. cleanup_expired_sessions: pinned search_path, service_role only
--    (loose-file object: guard for DBs where it does not exist yet)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.cleanup_expired_sessions()') is not null then
    alter function public.cleanup_expired_sessions() set search_path = public, pg_temp;
    revoke all on function public.cleanup_expired_sessions() from public;
    revoke all on function public.cleanup_expired_sessions() from anon;
    revoke all on function public.cleanup_expired_sessions() from authenticated;
    grant execute on function public.cleanup_expired_sessions() to service_role;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Pin search_path on shared trigger/util helpers (loose-file objects)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    alter function public.set_updated_at() set search_path = public, pg_temp;
  end if;

  if to_regprocedure('public.get_device_info_from_user_agent(text)') is not null then
    alter function public.get_device_info_from_user_agent(text) set search_path = public, pg_temp;
  end if;

  if to_regprocedure('public.cleanup_old_activity_logs()') is not null then
    revoke all on function public.cleanup_old_activity_logs() from public;
    revoke all on function public.cleanup_old_activity_logs() from anon;
    revoke all on function public.cleanup_old_activity_logs() from authenticated;
    grant execute on function public.cleanup_old_activity_logs() to service_role;
  end if;
end;
$$;

-- Workspace RLS helpers: drop the implicit PUBLIC grant. `anon` keeps execute
-- so policies referencing them return empty results (not permission errors)
-- for unauthenticated PostgREST requests.
do $$
begin
  if to_regprocedure('public.is_workspace_member(uuid)') is not null then
    revoke all on function public.is_workspace_member(uuid) from public;
    grant execute on function public.is_workspace_member(uuid) to anon, authenticated, service_role;
  end if;

  if to_regprocedure('public.workspace_role(uuid)') is not null then
    revoke all on function public.workspace_role(uuid) from public;
    grant execute on function public.workspace_role(uuid) to anon, authenticated, service_role;
  end if;

  if to_regprocedure('public.is_workspace_owner(uuid)') is not null then
    revoke all on function public.is_workspace_owner(uuid) from public;
    grant execute on function public.is_workspace_owner(uuid) to anon, authenticated, service_role;
  end if;

  if to_regprocedure('public.workspace_member_directory(uuid)') is not null then
    revoke all on function public.workspace_member_directory(uuid) from public;
    revoke all on function public.workspace_member_directory(uuid) from anon;
    grant execute on function public.workspace_member_directory(uuid) to authenticated, service_role;
  end if;
end;
$$;
