-- Payment method + optional credit card on subscriptions; billing copies to transactions.

alter table public.workspace_subscriptions
  add column if not exists payment_method text;

alter table public.workspace_subscriptions
  add column if not exists payment_credit_card_id uuid references public.credit_cards(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'workspace_subscriptions_payment_method_check'
  ) then
    alter table public.workspace_subscriptions
      add constraint workspace_subscriptions_payment_method_check
      check (
        payment_method is null
        or payment_method in ('pix', 'ted', 'debit_card', 'credit_card', 'cash', 'other')
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'workspace_subscriptions_payment_card_matches'
  ) then
    alter table public.workspace_subscriptions
      add constraint workspace_subscriptions_payment_card_matches
      check (
        payment_credit_card_id is null or payment_method = 'credit_card'
      );
  end if;
end $$;

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
