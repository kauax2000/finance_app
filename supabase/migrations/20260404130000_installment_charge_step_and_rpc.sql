-- installment_sequence on transactions; shared charge step; RPC to create plan + post due charges; refactor run_installment_billing.

alter table public.transactions
  add column if not exists installment_sequence smallint;

comment on column public.transactions.installment_sequence is
  '1-based index for installment-generated expense rows (compra parcelada).';

-- One billing cycle for a single plan: insert transaction if missing, always advance plan state.
-- Returns: 0 = nothing to do; 1 = inserted new row and advanced; 2 = advanced only (idempotent duplicate).
create or replace function public.charge_workspace_installment_plan_step(p_plan_id uuid)
returns smallint
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.workspace_installment_plans%rowtype;
  v_today date;
  v_charge date;
  v_ts timestamptz;
  v_next date;
  v_amount numeric(15, 2);
  v_new_count int;
  v_part int;
  v_desc text;
  v_inserted boolean := false;
begin
  v_today := (timezone('UTC', now()))::date;

  select * into r
  from public.workspace_installment_plans
  where id = p_plan_id
  for update;

  if not found then
    return 0;
  end if;

  if
    not r.is_active
    or r.generated_count >= r.total_installments
    or r.next_billing_date > v_today
  then
    return 0;
  end if;

  v_charge := r.next_billing_date;
  v_part := r.generated_count + 1;

  if r.generated_count = r.total_installments - 1 then
    v_amount := r.final_installment_amount;
  else
    v_amount := r.installment_amount;
  end if;

  v_desc := trim(coalesce(r.description, ''));
  if v_desc = '' then
    v_desc := 'Parcela ' || v_part::text || '/' || r.total_installments::text;
  else
    v_desc := v_desc || ' (' || v_part::text || '/' || r.total_installments::text || ')';
  end if;

  if not exists (
    select 1
    from public.transactions t
    where t.installment_plan_id = r.id
      and (t.date at time zone 'UTC')::date = v_charge
  ) then
    v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;
    insert into public.transactions (
      user_id,
      workspace_id,
      wallet_id,
      category_id,
      type,
      amount,
      description,
      date,
      is_recurring,
      recurring_interval,
      installment_plan_id,
      installment_sequence,
      payment_method,
      payment_credit_card_id
    ) values (
      r.user_id,
      r.workspace_id,
      null,
      r.category_id,
      'expense',
      v_amount,
      v_desc,
      v_ts,
      false,
      null,
      r.id,
      v_part::smallint,
      r.payment_method,
      r.payment_credit_card_id
    );
    v_inserted := true;
  end if;

  v_new_count := r.generated_count + 1;

  if v_new_count >= r.total_installments then
    update public.workspace_installment_plans
    set
      generated_count = v_new_count,
      next_billing_date = null,
      is_active = false
    where id = r.id;
  else
    v_next := (v_charge + interval '1 month')::date;
    update public.workspace_installment_plans
    set
      generated_count = v_new_count,
      next_billing_date = v_next
    where id = r.id;
  end if;

  if v_inserted then
    return 1;
  end if;
  return 2;
end;
$$;

revoke all on function public.charge_workspace_installment_plan_step(uuid) from public;

create or replace function public.run_installment_billing()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_step smallint;
  n int := 0;
begin
  for r in
    select p.id
    from public.workspace_installment_plans p
    where p.is_active = true
      and p.generated_count < p.total_installments
      and p.next_billing_date <= (timezone('UTC', now()))::date
  loop
    loop
      v_step := public.charge_workspace_installment_plan_step(r.id);
      exit when v_step = 0;
      if v_step = 1 then
        n := n + 1;
      end if;
    end loop;
  end loop;

  return n;
end;
$$;

revoke all on function public.run_installment_billing() from public;
grant execute on function public.run_installment_billing() to service_role;

-- Create plan as authenticated workspace member; post all due installments (catch-up) in one call.
create or replace function public.create_workspace_installment_plan(
  p_workspace_id uuid,
  p_category_id uuid,
  p_description text,
  p_payment_method text,
  p_payment_credit_card_id uuid,
  p_total_installments integer,
  p_installment_amount numeric,
  p_final_installment_amount numeric,
  p_next_billing_date date
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_plan_id uuid;
  v_step smallint;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'Forbidden';
  end if;

  if p_total_installments is null or p_total_installments < 2 then
    raise exception 'Invalid total_installments';
  end if;

  insert into public.workspace_installment_plans (
    workspace_id,
    user_id,
    category_id,
    description,
    payment_method,
    payment_credit_card_id,
    total_installments,
    generated_count,
    installment_amount,
    final_installment_amount,
    next_billing_date,
    is_active
  ) values (
    p_workspace_id,
    v_uid,
    p_category_id,
    nullif(trim(coalesce(p_description, '')), ''),
    p_payment_method,
    p_payment_credit_card_id,
    p_total_installments,
    0,
    p_installment_amount,
    p_final_installment_amount,
    p_next_billing_date,
    true
  )
  returning id into v_plan_id;

  loop
    v_step := public.charge_workspace_installment_plan_step(v_plan_id);
    exit when v_step = 0;
  end loop;

  return v_plan_id;
end;
$$;

revoke all on function public.create_workspace_installment_plan(
  uuid, uuid, text, text, uuid, integer, numeric, numeric, date
) from public;

grant execute on function public.create_workspace_installment_plan(
  uuid, uuid, text, text, uuid, integer, numeric, numeric, date
) to authenticated;

grant execute on function public.create_workspace_installment_plan(
  uuid, uuid, text, text, uuid, integer, numeric, numeric, date
) to service_role;
