-- Close the billing double-charge race (minimal hotfix; the structural
-- unification of run/catch_up into one charge function is a later phase).
--
-- Changes vs 20260531120000:
--   * `run_subscription_billing` now locks each subscription row with
--     FOR UPDATE SKIP LOCKED before charging (mirrors `catch_up_recurring_billing`
--     and `charge_workspace_installment_plan_step`). A row being processed by a
--     concurrent catch-up is skipped — that writer finishes the job.
--   * Both functions (and the seed trigger) insert with ON CONFLICT DO NOTHING
--     against `transactions_subscription_charge_unique`
--     (migration 20260824130000), so even a lost race cannot double-charge.
--
-- Requires: 20260824130000_billing_idempotency_indexes.sql.

create or replace function public.run_subscription_billing()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.workspace_subscriptions%rowtype;
  v_id uuid;
  v_today date;
  v_charge date;
  v_ts timestamptz;
  v_next date;
  v_rows int;
  n int := 0;
begin
  v_today := (timezone('UTC', now()))::date;

  for v_id in
    select ws.id
    from public.workspace_subscriptions ws
    where ws.is_active = true
      and (
        (ws.next_billing_date is not null and ws.next_billing_date <= v_today)
        or (
          ws.next_billing_date is null
          and ws.day_of_month is not null
          and extract(day from v_today)::smallint = ws.day_of_month
          and ws.start_date <= v_today
        )
      )
  loop
    -- Serialize against catch_up_recurring_billing; skip rows another
    -- writer is already charging.
    select * into r
    from public.workspace_subscriptions
    where id = v_id and is_active = true
    for update skip locked;

    if not found then
      continue;
    end if;

    if r.next_billing_date is not null and r.next_billing_date <= v_today then
      v_charge := r.next_billing_date;

      v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;
      insert into public.transactions (
        user_id, workspace_id, category_id, type, amount, description, date,
        is_recurring, recurring_interval, subscription_id,
        payment_method, payment_credit_card_id
      ) values (
        r.user_id, r.workspace_id, r.category_id, 'expense', r.amount, r.name, v_ts,
        false, null, r.id,
        r.payment_method, r.payment_credit_card_id
      )
      on conflict (subscription_id, ((date at time zone 'UTC')::date))
        where subscription_id is not null
        do nothing;
      get diagnostics v_rows = row_count;
      n := n + v_rows;

      v_next := case r.billing_interval
        when 'weekly' then (v_charge + interval '7 days')::date
        when 'monthly' then (v_charge + interval '1 month')::date
        when 'bimonthly' then (v_charge + interval '2 months')::date
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

      v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;
      insert into public.transactions (
        user_id, workspace_id, category_id, type, amount, description, date,
        is_recurring, recurring_interval, subscription_id,
        payment_method, payment_credit_card_id
      ) values (
        r.user_id, r.workspace_id, r.category_id, 'expense', r.amount, r.name, v_ts,
        false, null, r.id,
        r.payment_method, r.payment_credit_card_id
      )
      on conflict (subscription_id, ((date at time zone 'UTC')::date))
        where subscription_id is not null
        do nothing;
      get diagnostics v_rows = row_count;
      n := n + v_rows;

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

create or replace function public.catch_up_recurring_billing()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r record;
  v_step smallint;
  v_inst_n int := 0;
  v_sub_n int := 0;
  v_today date;
  v_charge date;
  v_ts timestamptz;
  v_next date;
  v_rows int;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  v_today := (timezone('UTC', now()))::date;

  -- ── Installment billing ─────────────────────────────────────────────
  for r in
    select p.id
    from public.workspace_installment_plans p
    where p.is_active = true
      and p.generated_count < p.total_installments
      and p.next_billing_date <= v_today
      and exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id = p.workspace_id and wm.user_id = v_uid
      )
  loop
    loop
      v_step := public.charge_workspace_installment_plan_step(r.id);
      exit when v_step = 0;
      if v_step = 1 then v_inst_n := v_inst_n + 1; end if;
    end loop;
  end loop;

  -- ── Subscription billing (mirrors run_subscription_billing, scoped) ─
  <<sub_outer>>
  for r in
    select ws.*
    from public.workspace_subscriptions ws
    where ws.is_active = true
      and exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id = ws.workspace_id and wm.user_id = v_uid
      )
      and (
        (ws.next_billing_date is not null and ws.next_billing_date <= v_today)
        or (
          ws.next_billing_date is null
          and ws.day_of_month is not null
          and extract(day from v_today)::smallint = ws.day_of_month
          and ws.start_date <= v_today
        )
      )
  loop
    <<sub_step>>
    loop
      -- Skip-locked: if the cron writer holds this row it will finish the
      -- charge; waiting here would only serialize the dashboard behind cron.
      select * into r
      from public.workspace_subscriptions
      where id = r.id and is_active = true
      for update skip locked;

      if not found then exit sub_step; end if;

      if r.next_billing_date is not null and r.next_billing_date <= v_today then
        v_charge := r.next_billing_date;

        v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;
        insert into public.transactions (
          user_id, workspace_id, category_id, type, amount, description, date,
          is_recurring, recurring_interval, subscription_id,
          payment_method, payment_credit_card_id
        ) values (
          r.user_id, r.workspace_id, r.category_id, 'expense', r.amount, r.name, v_ts,
          false, null, r.id,
          r.payment_method, r.payment_credit_card_id
        )
        on conflict (subscription_id, ((date at time zone 'UTC')::date))
          where subscription_id is not null
          do nothing;
        get diagnostics v_rows = row_count;
        v_sub_n := v_sub_n + v_rows;

        v_next := case r.billing_interval
          when 'weekly'  then (v_charge + interval '7 days')::date
          when 'monthly' then (v_charge + interval '1 month')::date
          when 'bimonthly' then (v_charge + interval '2 months')::date
          when 'yearly'  then (v_charge + interval '1 year')::date
          else (v_charge + interval '1 month')::date
        end;
        update public.workspace_subscriptions set next_billing_date = v_next where id = r.id;

      elsif
        r.next_billing_date is null
        and r.day_of_month is not null
        and extract(day from v_today)::smallint = r.day_of_month
        and r.start_date <= v_today
      then
        v_charge := v_today;

        v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;
        insert into public.transactions (
          user_id, workspace_id, category_id, type, amount, description, date,
          is_recurring, recurring_interval, subscription_id,
          payment_method, payment_credit_card_id
        ) values (
          r.user_id, r.workspace_id, r.category_id, 'expense', r.amount, r.name, v_ts,
          false, null, r.id,
          r.payment_method, r.payment_credit_card_id
        )
        on conflict (subscription_id, ((date at time zone 'UTC')::date))
          where subscription_id is not null
          do nothing;
        get diagnostics v_rows = row_count;
        v_sub_n := v_sub_n + v_rows;

        v_next := (v_charge + interval '1 month')::date;
        update public.workspace_subscriptions set next_billing_date = v_next where id = r.id;

      else
        exit sub_step;
      end if;

      select * into r
      from public.workspace_subscriptions
      where id = r.id and is_active = true;
      if not found then exit sub_step; end if;
      if r.next_billing_date is null or r.next_billing_date > v_today then
        exit sub_step;
      end if;
    end loop sub_step;
  end loop sub_outer;

  return jsonb_build_object('subscriptions', v_sub_n, 'installments', v_inst_n);
end;
$$;

revoke all on function public.catch_up_recurring_billing() from public;
grant execute on function public.catch_up_recurring_billing() to authenticated;

-- Seed trigger: same arbiter (the AFTER INSERT trigger can race the cron on
-- day-one subscriptions).
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

  v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;

  insert into public.transactions (
    user_id, workspace_id, category_id, type, amount, description, date,
    is_recurring, recurring_interval, subscription_id,
    payment_method, payment_credit_card_id
  ) values (
    new.user_id, new.workspace_id, new.category_id, 'expense', new.amount, new.name, v_ts,
    false, null, new.id,
    new.payment_method, new.payment_credit_card_id
  )
  on conflict (subscription_id, ((date at time zone 'UTC')::date))
    where subscription_id is not null
    do nothing;

  return new;
end;
$$;

revoke all on function public.seed_subscription_first_transaction() from public;
grant execute on function public.seed_subscription_first_transaction() to service_role;
