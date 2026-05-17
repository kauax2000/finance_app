-- Scoped recurring billing for authenticated users (dashboard catch-up).
-- Processes only plans/subscriptions in workspaces the caller belongs to.
-- Idempotent: safe to call on every dashboard load.

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
      -- Re-read to pick up updated next_billing_date from previous iteration
      select * into r
      from public.workspace_subscriptions
      where id = r.id and is_active = true
      for update;

      if not found then exit sub_step; end if;

      if r.next_billing_date is not null and r.next_billing_date <= v_today then
        v_charge := r.next_billing_date;

        if not exists (
          select 1 from public.transactions t
          where t.subscription_id = r.id
            and (t.date at time zone 'UTC')::date = v_charge
        ) then
          v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;
          insert into public.transactions (
            user_id, workspace_id, category_id, type, amount, description, date,
            is_recurring, recurring_interval, subscription_id,
            payment_method, payment_credit_card_id
          ) values (
            r.user_id, r.workspace_id, r.category_id, 'expense', r.amount, r.name, v_ts,
            false, null, r.id,
            r.payment_method, r.payment_credit_card_id
          );
          v_sub_n := v_sub_n + 1;
        end if;

        v_next := case r.billing_interval
          when 'weekly'  then (v_charge + interval '7 days')::date
          when 'monthly' then (v_charge + interval '1 month')::date
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

        if not exists (
          select 1 from public.transactions t
          where t.subscription_id = r.id
            and (t.date at time zone 'UTC')::date = v_charge
        ) then
          v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;
          insert into public.transactions (
            user_id, workspace_id, category_id, type, amount, description, date,
            is_recurring, recurring_interval, subscription_id,
            payment_method, payment_credit_card_id
          ) values (
            r.user_id, r.workspace_id, r.category_id, 'expense', r.amount, r.name, v_ts,
            false, null, r.id,
            r.payment_method, r.payment_credit_card_id
          );
          v_sub_n := v_sub_n + 1;
        end if;

        v_next := (v_charge + interval '1 month')::date;
        update public.workspace_subscriptions set next_billing_date = v_next where id = r.id;

      else
        exit sub_step;
      end if;

      -- After advancing, check if there are more missed cycles
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
