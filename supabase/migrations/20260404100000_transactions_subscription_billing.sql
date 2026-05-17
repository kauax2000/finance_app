-- Link transactions to workspace subscriptions + automated billing (pg_cron)

alter table public.transactions
  add column if not exists subscription_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'transactions_subscription_id_fkey'
  ) then
    alter table public.transactions
      add constraint transactions_subscription_id_fkey
      foreign key (subscription_id)
      references public.workspace_subscriptions(id)
      on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transactions_subscription_expense_only'
  ) then
    alter table public.transactions
      add constraint transactions_subscription_expense_only
      check (subscription_id is null or type = 'expense');
  end if;
end $$;

create index if not exists idx_transactions_subscription_id
  on public.transactions(subscription_id)
  where subscription_id is not null;

create index if not exists idx_transactions_workspace_subscription
  on public.transactions(workspace_id, subscription_id)
  where subscription_id is not null;

-- Daily billing: SECURITY DEFINER bypasses RLS for inserts/updates.
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
          wallet_id,
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
          r.wallet_id,
          r.category_id,
          'expense',
          r.amount,
          r.name,
          v_ts,
          false,
          null,
          r.id,
          null,
          null
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
          wallet_id,
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
          r.wallet_id,
          r.category_id,
          'expense',
          r.amount,
          r.name,
          v_ts,
          false,
          null,
          r.id,
          null,
          null
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

-- Hosted Supabase: schedule daily at 08:00 UTC when pg_cron is available.
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(j.jobid)
    from cron.job j
    where j.jobname = 'subscription-billing-daily';

    perform cron.schedule(
      'subscription-billing-daily',
      '0 8 * * *',
      'select public.run_subscription_billing()'
    );
  end if;
end
$cron$;
