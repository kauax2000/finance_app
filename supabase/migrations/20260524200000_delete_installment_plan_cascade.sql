-- Cascade-delete installment plan transactions before removing the plan row.

create or replace function public.delete_workspace_installment_plan_cascade(p_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  select workspace_id into v_workspace_id
  from public.workspace_installment_plans
  where id = p_plan_id;

  if not found then
    return;
  end if;

  if auth.uid() is not null and not public.is_workspace_member(v_workspace_id) then
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
grant execute on function public.delete_workspace_installment_plan_cascade(uuid) to service_role;
