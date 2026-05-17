-- Performance: composite indexes, RLS helper initplan fix, bundle RPCs, optional pg_cron.

-- ---------------------------------------------------------------------------
-- Indexes (non-concurrent for migration transaction compatibility)
-- ---------------------------------------------------------------------------
create index if not exists idx_transactions_workspace_date_desc
  on public.transactions (workspace_id, date desc, created_at desc);

create index if not exists idx_transactions_workspace_cc_date
  on public.transactions (workspace_id, payment_credit_card_id, date desc)
  where payment_method = 'credit_card';

create index if not exists idx_transactions_workspace_category_date
  on public.transactions (workspace_id, category_id, date desc)
  where category_id is not null;

create index if not exists idx_transactions_workspace_subscription_date
  on public.transactions (workspace_id, subscription_id, date desc)
  where subscription_id is not null;

create index if not exists idx_workspace_subscriptions_active_next_billing
  on public.workspace_subscriptions (next_billing_date)
  where is_active = true;

create index if not exists idx_credit_card_invoice_payments_card_close
  on public.credit_card_invoice_payments (credit_card_id, statement_close_date desc);

-- ---------------------------------------------------------------------------
-- RLS helpers: evaluate auth.uid() once per statement (initplan)
-- ---------------------------------------------------------------------------
create or replace function public.is_workspace_member(workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = is_workspace_member.workspace_id
      and wm.user_id = (select auth.uid())
  );
$$;

create or replace function public.workspace_role(workspace_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = workspace_role.workspace_id
    and wm.user_id = (select auth.uid())
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- user_activity_logs policies (hot path for account activity)
-- ---------------------------------------------------------------------------
drop policy if exists "Users can view own activities" on public.user_activity_logs;
create policy "Users can view own activities"
on public.user_activity_logs for select
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own activities" on public.user_activity_logs;
create policy "Users can insert own activities"
on public.user_activity_logs for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own activities" on public.user_activity_logs;
create policy "Users can delete own activities"
on public.user_activity_logs for delete
using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Subscriptions page bundle (single round-trip)
-- ---------------------------------------------------------------------------
create or replace function public.rpc_fetch_subscriptions_page_bundle(p_workspace_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_cats jsonb;
  v_cards jsonb;
  v_subs jsonb;
  v_stats jsonb;
begin
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(to_jsonb(c) order by c.name), '[]'::jsonb)
  into v_cats
  from public.categories c
  where c.workspace_id = p_workspace_id;

  select coalesce(jsonb_agg(to_jsonb(cc) order by cc.name), '[]'::jsonb)
  into v_cards
  from public.credit_cards cc
  where cc.workspace_id = p_workspace_id;

  select coalesce(jsonb_agg(to_jsonb(s) order by s.name), '[]'::jsonb)
  into v_subs
  from public.workspace_subscriptions s
  where s.workspace_id = p_workspace_id;

  select coalesce(
    jsonb_object_agg(
      t.subscription_id::text,
      jsonb_build_object('count', t.cnt, 'lastDate', t.last_d)
    ),
    '{}'::jsonb
  )
  into v_stats
  from (
    select
      subscription_id,
      count(*)::int as cnt,
      max((date at time zone 'utc')::date)::text as last_d
    from public.transactions
    where workspace_id = p_workspace_id
      and subscription_id is not null
    group by subscription_id
  ) t;

  return jsonb_build_object(
    'categories', coalesce(v_cats, '[]'::jsonb),
    'credit_cards', coalesce(v_cards, '[]'::jsonb),
    'subscriptions', coalesce(v_subs, '[]'::jsonb),
    'billing_stats', coalesce(v_stats, '{}'::jsonb),
    'table_missing', false
  );
exception
  when undefined_table then
    return jsonb_build_object(
      'categories', '[]'::jsonb,
      'credit_cards', '[]'::jsonb,
      'subscriptions', '[]'::jsonb,
      'billing_stats', '{}'::jsonb,
      'table_missing', true
    );
end;
$$;

grant execute on function public.rpc_fetch_subscriptions_page_bundle(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Bills page bundle (single round-trip; CC tx rows raw for client normalize)
-- ---------------------------------------------------------------------------
create or replace function public.rpc_fetch_bills_page_bundle(p_workspace_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_bills jsonb;
  v_pending jsonb;
  v_paid jsonb;
  v_cats jsonb;
  v_cards jsonb;
  v_cc_tx jsonb;
  v_plans jsonb;
  v_inv jsonb;
  v_since date := (current_date - interval '90 days')::date;
begin
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(
      case
        when c.id is not null then to_jsonb(b) || jsonb_build_object('category', to_jsonb(c))
        else to_jsonb(b)
      end
      order by b.name
    ),
    '[]'::jsonb
  )
  into v_bills
  from public.bills b
  left join public.categories c on c.id = b.category_id
  where b.workspace_id = p_workspace_id;

  select coalesce(jsonb_agg(to_jsonb(i) order by i.due_date), '[]'::jsonb)
  into v_pending
  from public.bill_instances i
  where i.workspace_id = p_workspace_id
    and i.status = 'pending';

  select coalesce(jsonb_agg(to_jsonb(i) order by i.paid_at desc), '[]'::jsonb)
  into v_paid
  from (
    select *
    from public.bill_instances i2
    where i2.workspace_id = p_workspace_id
      and i2.status = 'paid'
      and i2.due_date >= v_since
    order by i2.paid_at desc nulls last
    limit 120
  ) i;

  select coalesce(jsonb_agg(to_jsonb(c) order by c.name), '[]'::jsonb)
  into v_cats
  from public.categories c
  where c.workspace_id = p_workspace_id;

  select coalesce(jsonb_agg(to_jsonb(cc) order by cc.name), '[]'::jsonb)
  into v_cards
  from public.credit_cards cc
  where cc.workspace_id = p_workspace_id;

  select coalesce(
    jsonb_agg(
      to_jsonb(t) || jsonb_build_object(
        'category', case when cat.id is null then null else jsonb_build_object('name', cat.name) end
      )
      order by t.date desc
    ),
    '[]'::jsonb
  )
  into v_cc_tx
  from public.transactions t
  left join public.categories cat on cat.id = t.category_id
  where t.workspace_id = p_workspace_id
    and t.type = 'expense'
    and t.payment_method = 'credit_card';

  select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
  into v_plans
  from public.workspace_installment_plans p
  where p.workspace_id = p_workspace_id;

  select coalesce(jsonb_agg(to_jsonb(ip)), '[]'::jsonb)
  into v_inv
  from public.credit_card_invoice_payments ip
  where ip.workspace_id = p_workspace_id;

  return jsonb_build_object(
    'bills', coalesce(v_bills, '[]'::jsonb),
    'pending_instances', coalesce(v_pending, '[]'::jsonb),
    'recent_paid_instances', coalesce(v_paid, '[]'::jsonb),
    'categories', coalesce(v_cats, '[]'::jsonb),
    'credit_cards', coalesce(v_cards, '[]'::jsonb),
    'cc_transactions', coalesce(v_cc_tx, '[]'::jsonb),
    'installment_plans', coalesce(v_plans, '[]'::jsonb),
    'invoice_payments', coalesce(v_inv, '[]'::jsonb),
    'table_missing', false
  );
exception
  when undefined_table then
    return jsonb_build_object(
      'bills', '[]'::jsonb,
      'pending_instances', '[]'::jsonb,
      'recent_paid_instances', '[]'::jsonb,
      'categories', '[]'::jsonb,
      'credit_cards', '[]'::jsonb,
      'cc_transactions', '[]'::jsonb,
      'installment_plans', '[]'::jsonb,
      'invoice_payments', '[]'::jsonb,
      'table_missing', true
    );
end;
$$;

grant execute on function public.rpc_fetch_bills_page_bundle(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Category detail bundle (single round-trip)
-- ---------------------------------------------------------------------------
create or replace function public.rpc_fetch_category_detail_bundle(
  p_workspace_id uuid,
  p_category_id uuid,
  p_year_month text
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_period_start date;
  v_period_end date;
  v_prev_start date;
  v_prev_end date;
  v_range_start date;
  v_cat jsonb;
  v_budget jsonb;
  v_tx_month jsonb;
  v_tx_range jsonb;
  v_ws_month jsonb;
  v_prev_cat jsonb;
  v_plans jsonb;
  v_subs jsonb;
  v_ym date;
  v_ps text;
  v_pe text;
  v_prs text;
  v_pre text;
  v_rs text;
  y int;
  m int;
begin
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  y := split_part(p_year_month, '-', 1)::int;
  m := split_part(p_year_month, '-', 2)::int;
  v_ym := make_date(y, m, 1);
  v_period_start := date_trunc('month', v_ym)::date;
  v_period_end := (date_trunc('month', v_ym) + interval '1 month - 1 day')::date;
  v_prev_end := (v_period_start - interval '1 day')::date;
  v_prev_start := date_trunc('month', v_prev_end)::date;
  v_range_start := (v_period_start - interval '11 months')::date;

  v_ps := to_char(v_period_start, 'YYYY-MM-DD');
  v_pe := to_char(v_period_end, 'YYYY-MM-DD');
  v_prs := to_char(v_prev_start, 'YYYY-MM-DD');
  v_pre := to_char(v_prev_end, 'YYYY-MM-DD');
  v_rs := to_char(v_range_start, 'YYYY-MM-DD');

  select to_jsonb(c) into v_cat
  from public.categories c
  where c.workspace_id = p_workspace_id and c.id = p_category_id;

  select to_jsonb(b) into v_budget
  from public.budgets b
  where b.workspace_id = p_workspace_id
    and b.user_id = (select auth.uid())
    and b.category_id = p_category_id
    and b.period_start = v_period_start
  limit 1;

  select coalesce(
    jsonb_agg(
      to_jsonb(t)
      || jsonb_build_object(
        'category', case when cat.id is null then null else to_jsonb(cat) end,
        'subscription', case when ws.id is null then null else to_jsonb(ws) end,
        'installment_plan', case when ip.id is null then null else to_jsonb(ip) end
      )
      order by t.date desc, t.created_at desc
    ),
    '[]'::jsonb
  )
  into v_tx_month
  from public.transactions t
  left join public.categories cat on cat.id = t.category_id
  left join public.workspace_subscriptions ws on ws.id = t.subscription_id
  left join public.workspace_installment_plans ip on ip.id = t.installment_plan_id
  where t.workspace_id = p_workspace_id
    and t.category_id = p_category_id
    and t.date >= (v_ps || 'T00:00:00.000Z')::timestamptz
    and t.date <= (v_pe || 'T23:59:59.999Z')::timestamptz;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', t.date,
        'amount', t.amount,
        'type', t.type,
        'category_id', t.category_id
      )
      order by t.date
    ),
    '[]'::jsonb
  )
  into v_tx_range
  from public.transactions t
  where t.workspace_id = p_workspace_id
    and t.category_id = p_category_id
    and t.date >= (v_rs || 'T00:00:00.000Z')::timestamptz
    and t.date <= (v_pe || 'T23:59:59.999Z')::timestamptz;

  select coalesce(
    jsonb_agg(jsonb_build_object('amount', t.amount, 'type', t.type)),
    '[]'::jsonb
  )
  into v_ws_month
  from public.transactions t
  where t.workspace_id = p_workspace_id
    and t.date >= (v_ps || 'T00:00:00.000Z')::timestamptz
    and t.date <= (v_pe || 'T23:59:59.999Z')::timestamptz;

  select coalesce(
    jsonb_agg(jsonb_build_object('amount', t.amount, 'type', t.type)),
    '[]'::jsonb
  )
  into v_prev_cat
  from public.transactions t
  where t.workspace_id = p_workspace_id
    and t.category_id = p_category_id
    and t.date >= (v_prs || 'T00:00:00.000Z')::timestamptz
    and t.date <= (v_pre || 'T23:59:59.999Z')::timestamptz;

  select coalesce(jsonb_agg(to_jsonb(p) order by p.next_billing_date), '[]'::jsonb)
  into v_plans
  from public.workspace_installment_plans p
  where p.workspace_id = p_workspace_id
    and p.category_id = p_category_id;

  select coalesce(jsonb_agg(to_jsonb(s) order by s.name), '[]'::jsonb)
  into v_subs
  from public.workspace_subscriptions s
  where s.workspace_id = p_workspace_id
    and s.category_id = p_category_id;

  return jsonb_build_object(
    'category', v_cat,
    'budget', v_budget,
    'txs_month', coalesce(v_tx_month, '[]'::jsonb),
    'series_rows', coalesce(v_tx_range, '[]'::jsonb),
    'workspace_month_rows', coalesce(v_ws_month, '[]'::jsonb),
    'prev_category_rows', coalesce(v_prev_cat, '[]'::jsonb),
    'installment_plans', coalesce(v_plans, '[]'::jsonb),
    'subscriptions', coalesce(v_subs, '[]'::jsonb)
  );
end;
$$;

grant execute on function public.rpc_fetch_category_detail_bundle(uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Optional: weekly activity log cleanup (requires pg_cron on host)
-- ---------------------------------------------------------------------------
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('finance_cleanup_old_activity_logs');
    exception
      when others then
        null;
    end;
    begin
      perform cron.schedule(
        'finance_cleanup_old_activity_logs',
        '0 4 * * 0',
        $cmd$select public.cleanup_old_activity_logs()$cmd$
      );
    exception
      when others then
        null;
    end;
  end if;
end;
$cron$;
