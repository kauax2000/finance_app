-- Installment purchase plans + monthly billing (pg_cron), mirrors workspace_subscriptions pattern.
-- Note: budget edge evaluation (evaluate-budgets) is not invoked from SQL; cron-created rows match subscription billing.

create table if not exists public.workspace_installment_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  description text,
  payment_method text,
  payment_credit_card_id uuid references public.credit_cards(id) on delete set null,
  total_installments integer not null,
  generated_count integer not null default 0,
  installment_amount numeric(15, 2) not null,
  final_installment_amount numeric(15, 2) not null,
  next_billing_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_installment_plans_total_installments_check
    check (total_installments >= 2),
  constraint workspace_installment_plans_generated_count_check
    check (generated_count >= 0 and generated_count <= total_installments),
  constraint workspace_installment_plans_installment_amount_positive
    check (installment_amount > 0),
  constraint workspace_installment_plans_final_amount_positive
    check (final_installment_amount > 0),
  constraint workspace_installment_plans_payment_method_check
    check (
      payment_method is null
      or payment_method in ('pix', 'ted', 'debit_card', 'credit_card', 'cash', 'other')
    ),
  constraint workspace_installment_plans_payment_card_matches
    check (
      payment_credit_card_id is null or payment_method = 'credit_card'
    )
);

create index if not exists idx_workspace_installment_plans_workspace_id
  on public.workspace_installment_plans(workspace_id);

create index if not exists idx_workspace_installment_plans_next_billing
  on public.workspace_installment_plans(next_billing_date)
  where is_active = true;

alter table public.workspace_installment_plans enable row level security;

drop policy if exists "Workspace members can view workspace_installment_plans"
  on public.workspace_installment_plans;
create policy "Workspace members can view workspace_installment_plans"
on public.workspace_installment_plans for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can insert workspace_installment_plans"
  on public.workspace_installment_plans;
create policy "Workspace members can insert workspace_installment_plans"
on public.workspace_installment_plans for insert
with check (
  public.is_workspace_member(workspace_id)
  and auth.uid() = user_id
);

drop policy if exists "Workspace members can update workspace_installment_plans"
  on public.workspace_installment_plans;
create policy "Workspace members can update workspace_installment_plans"
on public.workspace_installment_plans for update
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can delete workspace_installment_plans"
  on public.workspace_installment_plans;
create policy "Workspace members can delete workspace_installment_plans"
on public.workspace_installment_plans for delete
using (public.is_workspace_member(workspace_id));

do $$
begin
  if exists (
    select 1
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'set_updated_at'
  ) then
    drop trigger if exists set_workspace_installment_plans_updated_at
      on public.workspace_installment_plans;
    create trigger set_workspace_installment_plans_updated_at
      before update on public.workspace_installment_plans
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.transactions
  add column if not exists installment_plan_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'transactions_installment_plan_id_fkey'
  ) then
    alter table public.transactions
      add constraint transactions_installment_plan_id_fkey
      foreign key (installment_plan_id)
      references public.workspace_installment_plans(id)
      on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transactions_installment_plan_expense_only'
  ) then
    alter table public.transactions
      add constraint transactions_installment_plan_expense_only
      check (installment_plan_id is null or type = 'expense');
  end if;
end $$;

-- Only when `subscription_id` exists (migration 20260404100000_transactions_subscription_billing.sql).
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'subscription_id'
  ) then
    if not exists (
      select 1 from pg_constraint where conname = 'transactions_subscription_installment_exclusive'
    ) then
      alter table public.transactions
        add constraint transactions_subscription_installment_exclusive
        check (
          subscription_id is null or installment_plan_id is null
        );
    end if;
  end if;
end $$;

create index if not exists idx_transactions_installment_plan_id
  on public.transactions(installment_plan_id)
  where installment_plan_id is not null;

-- Daily billing: SECURITY DEFINER bypasses RLS for inserts/updates.
create or replace function public.run_installment_billing()
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
  v_amount numeric(15, 2);
  v_new_count int;
  v_part int;
  v_desc text;
  n int := 0;
begin
  v_today := (timezone('UTC', now()))::date;

  for r in
    select p.*
    from public.workspace_installment_plans p
    where p.is_active = true
      and p.generated_count < p.total_installments
      and p.next_billing_date <= v_today
  loop
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
      -- Omit `subscription_id` so this works before/without subscription billing migration; it defaults to null when the column exists.
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
        r.payment_method,
        r.payment_credit_card_id
      );
      n := n + 1;
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
  end loop;

  return n;
end;
$$;

revoke all on function public.run_installment_billing() from public;
grant execute on function public.run_installment_billing() to service_role;

do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(j.jobid)
    from cron.job j
    where j.jobname = 'installment-billing-daily';

    perform cron.schedule(
      'installment-billing-daily',
      '0 8 * * *',
      'select public.run_installment_billing()'
    );
  end if;
end
$cron$;
