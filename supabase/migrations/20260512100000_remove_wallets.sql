-- Remove public.wallets and all wallet_id FK columns; keep workspace "carteiras" (workspaces) only.

-- ---------------------------------------------------------------------------
-- 1) Subscription seed trigger: stop inserting wallet_id
-- ---------------------------------------------------------------------------
create or replace function public.seed_subscription_first_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_charge date;
  v_ts timestamptz;
begin
  v_charge := coalesce(new.next_billing_date, new.start_date);

  if v_charge is null then
    return new;
  end if;

  if exists (
    select 1
    from public.transactions t
    where t.subscription_id = new.id
      and (t.date at time zone 'UTC')::date = v_charge
  ) then
    return new;
  end if;

  v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;

  insert into public.transactions (
    user_id,
    workspace_id,
    category_id,
    type,
    amount,
    description,
    date,
    is_recurring,
    recurring_interval,
    subscription_id,
    payment_method,
    payment_credit_card_id
  ) values (
    new.user_id,
    new.workspace_id,
    new.category_id,
    'expense',
    new.amount,
    new.name,
    v_ts,
    false,
    null,
    new.id,
    new.payment_method,
    new.payment_credit_card_id
  );

  return new;
end;
$$;

revoke all on function public.seed_subscription_first_transaction() from public;
grant execute on function public.seed_subscription_first_transaction() to service_role;

-- ---------------------------------------------------------------------------
-- 2) Subscription billing RPC
-- ---------------------------------------------------------------------------
create or replace function public.run_subscription_billing()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_today date;
  v_charge date;
  v_ts timestamptz;
  v_next date;
  n int := 0;
begin
  v_today := (timezone('UTC', now()))::date;

  for r in
    select ws.*
    from public.workspace_subscriptions ws
    where ws.is_active = true
  loop
    if r.next_billing_date is not null and r.next_billing_date <= v_today then
      v_charge := r.next_billing_date;

      if not exists (
        select 1
        from public.transactions t
        where t.subscription_id = r.id
          and (t.date at time zone 'UTC')::date = v_charge
      ) then
        v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;
        insert into public.transactions (
          user_id,
          workspace_id,
          category_id,
          type,
          amount,
          description,
          date,
          is_recurring,
          recurring_interval,
          subscription_id,
          payment_method,
          payment_credit_card_id
        ) values (
          r.user_id,
          r.workspace_id,
          r.category_id,
          'expense',
          r.amount,
          r.name,
          v_ts,
          false,
          null,
          r.id,
          r.payment_method,
          r.payment_credit_card_id
        );
        n := n + 1;
      end if;

      v_next := case r.billing_interval
        when 'weekly' then (v_charge + interval '7 days')::date
        when 'monthly' then (v_charge + interval '1 month')::date
        when 'yearly' then (v_charge + interval '1 year')::date
        else (v_charge + interval '1 month')::date
      end;

      update public.workspace_subscriptions
      set next_billing_date = v_next
      where id = r.id;

    elsif
      r.next_billing_date is null
      and r.day_of_month is not null
      and extract(day from v_today)::smallint = r.day_of_month
      and r.start_date <= v_today
    then
      v_charge := v_today;

      if not exists (
        select 1
        from public.transactions t
        where t.subscription_id = r.id
          and (t.date at time zone 'UTC')::date = v_charge
      ) then
        v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;
        insert into public.transactions (
          user_id,
          workspace_id,
          category_id,
          type,
          amount,
          description,
          date,
          is_recurring,
          recurring_interval,
          subscription_id,
          payment_method,
          payment_credit_card_id
        ) values (
          r.user_id,
          r.workspace_id,
          r.category_id,
          'expense',
          r.amount,
          r.name,
          v_ts,
          false,
          null,
          r.id,
          r.payment_method,
          r.payment_credit_card_id
        );
        n := n + 1;
      end if;

      v_next := (v_charge + interval '1 month')::date;
      update public.workspace_subscriptions
      set next_billing_date = v_next
      where id = r.id;
    end if;
  end loop;

  return n;
end;
$$;

revoke all on function public.run_subscription_billing() from public;
grant execute on function public.run_subscription_billing() to service_role;

-- ---------------------------------------------------------------------------
-- 3) Installment charge step (insert without wallet_id)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 4) Drop FK columns (depend on public.wallets)
-- ---------------------------------------------------------------------------
alter table public.bills drop column if exists default_wallet_id;
alter table public.bill_instances drop column if exists wallet_id;
alter table public.workspace_subscriptions drop column if exists wallet_id;
alter table public.transactions drop column if exists wallet_id;

-- ---------------------------------------------------------------------------
-- 5) Drop wallets table (RLS policies and indexes go with the table)
-- ---------------------------------------------------------------------------
drop table if exists public.wallets cascade;

-- ---------------------------------------------------------------------------
-- 6) Workspace delete helpers (when workspaces-delete.sql was applied)
-- ---------------------------------------------------------------------------
create or replace function public.workspaces_before_delete_guard_and_cleanup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.type = 'personal' then
    raise exception 'WORKSPACE_PERSONAL_IMMUTABLE'
      using errcode = 'P0001';
  end if;

  delete from public.transactions
  where workspace_id = old.id;

  delete from public.budgets
  where workspace_id = old.id;

  delete from public.categories
  where workspace_id = old.id;

  return old;
end;
$$;

revoke all on function public.workspaces_before_delete_guard_and_cleanup() from public;

create or replace function public.get_workspace_delete_impact(p_workspace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  wtype text;
  is_owner boolean;
  tx_count bigint;
  budget_count bigint;
  category_count bigint;
  member_count bigint;
  other_members bigint;
begin
  select w.type, (wm.role = 'owner')
  into wtype, is_owner
  from public.workspaces w
  left join public.workspace_members wm
    on wm.workspace_id = w.id
   and wm.user_id = auth.uid()
  where w.id = p_workspace_id;

  if wtype is null then
    raise exception 'WORKSPACE_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  if not coalesce(is_owner, false) then
    raise exception 'WORKSPACE_NOT_OWNER'
      using errcode = 'P0001';
  end if;

  if wtype = 'personal' then
    raise exception 'WORKSPACE_PERSONAL_IMMUTABLE'
      using errcode = 'P0001';
  end if;

  select count(*) into tx_count
  from public.transactions
  where workspace_id = p_workspace_id;

  select count(*) into budget_count
  from public.budgets
  where workspace_id = p_workspace_id;

  select count(*) into category_count
  from public.categories
  where workspace_id = p_workspace_id;

  select count(*) into member_count
  from public.workspace_members
  where workspace_id = p_workspace_id;

  select count(*) into other_members
  from public.workspace_members
  where workspace_id = p_workspace_id
    and user_id <> auth.uid();

  return jsonb_build_object(
    'transactions', tx_count,
    'budgets', budget_count,
    'categories', category_count,
    'members', member_count,
    'other_members', other_members
  );
end;
$$;

revoke all on function public.get_workspace_delete_impact(uuid) from public;
grant execute on function public.get_workspace_delete_impact(uuid) to authenticated;
