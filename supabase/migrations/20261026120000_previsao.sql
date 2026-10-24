-- Bloco 5 · Previsão: receita recorrente, orçamento que se repete e reserva.
--
-- Só acrescenta: o front de `main` continua em produção até o fim do 2.0.
-- - a assinatura criada por ele continua despesa (`kind` nasce `'expense'`);
-- - os crons mantêm assinatura e comportamento para a despesa;
-- - `budgets` aceita o upsert de hoje sem mandar `repeats`.

-- 1. Receita recorrente -------------------------------------------------------
-- Uma receita não usa cartão: receita no cartão é estorno, e estorno não se
-- repete por assinatura.
alter table public.workspace_subscriptions
  add column if not exists kind text not null default 'expense'
  check (kind in ('expense', 'income'));

alter table public.workspace_subscriptions
  drop constraint if exists workspace_subscriptions_income_no_card;
alter table public.workspace_subscriptions
  add constraint workspace_subscriptions_income_no_card
  check (kind = 'expense' or payment_method is distinct from 'credit_card');

-- O lançamento da assinatura passa a ter o tipo dela (baseline: só despesa).
alter table public.transactions drop constraint if exists transactions_subscription_expense_only;

-- Recriadas de `20260915110000_billing_anchor_timezone.sql`; a única mudança é
-- o `type` do lançamento, que deixa de ser `'expense'` e passa a ser o `kind`.
create or replace function public.charge_subscription_cycle(p_subscription_id uuid)
returns smallint
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.workspace_subscriptions%rowtype;
  v_today date;
  v_charge date;
  v_ts timestamptz;
  v_next date;
  v_rows int;
  v_legacy_day int;
begin
  v_today := public.app_today();

  select * into r
  from public.workspace_subscriptions
  where id = p_subscription_id and is_active = true
  for update skip locked;

  if not found then
    return 0;
  end if;

  if r.day_of_month is not null then
    v_legacy_day := least(
      r.day_of_month::int,
      extract(day from (date_trunc('month', v_today) + interval '1 month - 1 day'))::int
    );
  end if;

  if r.next_billing_date is not null and r.next_billing_date <= v_today then
    v_charge := r.next_billing_date;
    v_next := public.next_subscription_billing_date(v_charge, r.billing_interval, r.billing_anchor_day);
  elsif
    r.next_billing_date is null
    and r.day_of_month is not null
    and extract(day from v_today)::int = v_legacy_day
    and r.start_date <= v_today
  then
    v_charge := v_today;
    v_next := public.next_subscription_billing_date(v_charge, r.billing_interval, r.day_of_month);
  else
    return 0;
  end if;

  v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;
  insert into public.transactions (
    user_id, workspace_id, category_id, type, amount, description, date,
    is_recurring, recurring_interval, subscription_id,
    payment_method, payment_credit_card_id
  ) values (
    r.user_id, r.workspace_id, r.category_id, r.kind, r.amount, r.name, v_ts,
    false, null, r.id,
    r.payment_method, r.payment_credit_card_id
  )
  on conflict (subscription_id, ((date at time zone 'UTC')::date))
    where subscription_id is not null
    do nothing;
  get diagnostics v_rows = row_count;

  perform set_config('app.billing_advance', 'on', true);
  update public.workspace_subscriptions
  set next_billing_date = v_next
  where id = r.id;
  perform set_config('app.billing_advance', 'off', true);

  if v_rows > 0 then
    return 1;
  end if;
  return 2;
end;
$$;

revoke all on function public.charge_subscription_cycle(uuid) from public, anon, authenticated;

create or replace function public.seed_subscription_first_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_charge date;
  v_ts timestamptz;
  v_rows int;
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
    new.user_id, new.workspace_id, new.category_id, new.kind, new.amount, new.name, v_ts,
    false, null, new.id,
    new.payment_method, new.payment_credit_card_id
  )
  on conflict (subscription_id, ((date at time zone 'UTC')::date))
    where subscription_id is not null
    do nothing;
  get diagnostics v_rows = row_count;

  if v_rows > 0 then
    perform set_config('app.billing_advance', 'on', true);
    update public.workspace_subscriptions
    set next_billing_date = public.next_subscription_billing_date(v_charge, new.billing_interval, new.billing_anchor_day)
    where id = new.id;
    perform set_config('app.billing_advance', 'off', true);
  end if;

  return new;
end;
$$;

revoke all on function public.seed_subscription_first_transaction() from public, anon, authenticated;

-- 2. Orçamento que se repete --------------------------------------------------
-- Nasce falso para o histórico; só o mês corrente passa a repetir. Daí em
-- diante o padrão é repetir, e o upsert do front de `main` (sem `repeats`)
-- herda o padrão.
alter table public.budgets
  add column if not exists repeats boolean not null default false;

update public.budgets
set repeats = true
where period_start = date_trunc('month', public.app_today())::date;

alter table public.budgets alter column repeats set default true;

-- Idempotente: o mês que já tem a categoria não ganha outra (a chave única
-- `budgets_workspace_category_period_unique`), e a categoria apagada já levou
-- o orçamento dela pela FK em cascata. Os avisos (`threshold_*`) e o
-- `client_id` nascem nulos.
create or replace function public.copiar_orcamentos_do_mes(p_period_start date, p_workspace_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inicio date := date_trunc('month', p_period_start)::date;
  v_n integer;
begin
  insert into public.budgets (
    user_id, workspace_id, category_id, amount, repeats,
    period_start, period_end, year, month
  )
  select
    b.user_id, b.workspace_id, b.category_id, b.amount, b.repeats,
    v_inicio,
    (v_inicio + interval '1 month - 1 day')::date,
    extract(year from v_inicio)::int,
    extract(month from v_inicio)::int
  from public.budgets b
  where b.period_start = (v_inicio - interval '1 month')::date
    and b.repeats
    and (p_workspace_id is null or b.workspace_id = p_workspace_id)
  on conflict (workspace_id, category_id, period_start) do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke all on function public.copiar_orcamentos_do_mes(date, uuid) from public, anon, authenticated;
grant execute on function public.copiar_orcamentos_do_mes(date, uuid) to service_role;

-- O Painel e a tela de Categorias chamam ao abrir: o mês chega copiado mesmo
-- que o cron do dia 1 não tenha rodado.
create or replace function public.garantir_orcamentos_do_mes(p_workspace_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'not a workspace member' using errcode = '42501';
  end if;

  return public.copiar_orcamentos_do_mes(date_trunc('month', public.app_today())::date, p_workspace_id);
end;
$$;

revoke all on function public.garantir_orcamentos_do_mes(uuid) from public, anon;
grant execute on function public.garantir_orcamentos_do_mes(uuid) to authenticated;

-- Dia 1 às 03:05 UTC = 00:05 em Brasília (hosted: extensão presente; local: no-op).
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(j.jobid) from cron.job j
    where j.jobname = 'orcamentos-do-mes';
    perform cron.schedule(
      'orcamentos-do-mes', '5 3 1 * *',
      $cmd$select public.copiar_orcamentos_do_mes(date_trunc('month', public.app_today())::date)$cmd$
    );
  end if;
end;
$cron$;

-- 3. Reserva do mês -----------------------------------------------------------
-- Quanto a carteira quer guardar por mês; sai do "seguro para gastar". A
-- escrita segue a política de `update` de `workspaces` (só o dono).
alter table public.workspaces
  add column if not exists monthly_savings_target numeric(15, 2)
  check (monthly_savings_target is null or monthly_savings_target >= 0);
