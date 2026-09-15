-- Revisão geral · Fase 1b: cobrança ancorada no dia, primeira cobrança, fuso e higiene.
--
-- O defeito medido: a próxima cobrança era calculada a partir da anterior, que
-- já tinha sido cortada no fim do mês. Uma assinatura ou parcela do dia 31 ia
-- para 28/02 e ficava no dia 28 para sempre.
--
-- A âncora não pode ser `start_date`: em dados antigos e nos testes, o início e
-- a primeira cobrança caem em dias diferentes. Ela vira coluna, preenchida pela
-- primeira cobrança real e mantida por trigger — uma edição manual da próxima
-- data move a âncora; o avanço feito pela própria cobrança, não.

-- ─── 1. Coluna e preenchimento ──────────────────────────────────────────────
alter table public.workspace_subscriptions
  add column if not exists billing_anchor_day smallint;
alter table public.workspace_installment_plans
  add column if not exists billing_anchor_day smallint;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'workspace_subscriptions_billing_anchor_day_range') then
    alter table public.workspace_subscriptions
      add constraint workspace_subscriptions_billing_anchor_day_range
      check (billing_anchor_day is null or billing_anchor_day between 1 and 31);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'workspace_installment_plans_billing_anchor_day_range') then
    alter table public.workspace_installment_plans
      add constraint workspace_installment_plans_billing_anchor_day_range
      check (billing_anchor_day is null or billing_anchor_day between 1 and 31);
  end if;
end
$$;

update public.workspace_subscriptions s
set billing_anchor_day = coalesce(
  (select extract(day from (min(t.date) at time zone 'UTC'))::smallint
   from public.transactions t
   where t.subscription_id = s.id),
  extract(day from coalesce(s.next_billing_date, s.start_date))::smallint
)
where s.billing_anchor_day is null;

update public.workspace_installment_plans p
set billing_anchor_day = coalesce(
  (select extract(day from (t.date at time zone 'UTC'))::smallint
   from public.transactions t
   where t.installment_plan_id = p.id and t.installment_sequence = 1
   limit 1),
  extract(day from p.next_billing_date)::smallint
)
where p.billing_anchor_day is null;

-- ─── 2. Regra de avanço ─────────────────────────────────────────────────────
-- Sem âncora, reproduz a regra anterior (os vetores dourados continuam valendo):
-- o dia de `p_from`, cortado no último dia do mês de destino.
create or replace function public.next_subscription_billing_date(
  p_from date,
  p_interval text,
  p_anchor_day integer
)
returns date
language plpgsql
immutable
set search_path = public
as $$
declare
  v_months int;
  v_month date;
  v_last int;
  v_day int;
begin
  if p_from is null then
    return null;
  end if;
  if p_interval = 'weekly' then
    return p_from + 7;
  end if;

  v_months := case p_interval
    when 'bimonthly' then 2
    when 'yearly' then 12
    else 1
  end;
  v_month := (date_trunc('month', p_from) + make_interval(months => v_months))::date;
  v_last := extract(day from (v_month + interval '1 month - 1 day'))::int;
  v_day := least(coalesce(p_anchor_day, extract(day from p_from)::int), v_last);
  return make_date(extract(year from v_month)::int, extract(month from v_month)::int, v_day);
end;
$$;

create or replace function public.next_subscription_billing_date(p_from date, p_interval text)
returns date
language sql
immutable
set search_path = public
as $$
  select public.next_subscription_billing_date(p_from, p_interval, null);
$$;

revoke all on function public.next_subscription_billing_date(date, text, integer) from public, anon, authenticated;

-- ─── 3. Âncora mantida por trigger ──────────────────────────────────────────
-- As funções de cobrança ligam `app.billing_advance` antes de mover a próxima
-- data; qualquer outra mudança da próxima data (edição na tela) redefine a âncora.
create or replace function public.maintain_billing_anchor_day()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_ref date;
begin
  if tg_op = 'INSERT' then
    if tg_table_name = 'workspace_subscriptions' then
      v_ref := coalesce(new.next_billing_date, new.start_date);
    else
      v_ref := new.next_billing_date;
    end if;
    if new.billing_anchor_day is null and v_ref is not null then
      new.billing_anchor_day := extract(day from v_ref)::smallint;
    end if;
    return new;
  end if;

  if coalesce(current_setting('app.billing_advance', true), '') <> 'on'
     and new.next_billing_date is not null
     and new.next_billing_date is distinct from old.next_billing_date then
    new.billing_anchor_day := extract(day from new.next_billing_date)::smallint;
  end if;
  return new;
end;
$$;

revoke all on function public.maintain_billing_anchor_day() from public, anon, authenticated;

drop trigger if exists maintain_billing_anchor_day on public.workspace_subscriptions;
create trigger maintain_billing_anchor_day
  before insert or update on public.workspace_subscriptions
  for each row execute function public.maintain_billing_anchor_day();

drop trigger if exists maintain_billing_anchor_day on public.workspace_installment_plans;
create trigger maintain_billing_anchor_day
  before insert or update on public.workspace_installment_plans
  for each row execute function public.maintain_billing_anchor_day();

-- ─── 4. Assinaturas ─────────────────────────────────────────────────────────
-- Caminho legado (sem next_billing_date): dia configurado cortado no último dia
-- do mês — antes, `day_of_month` 29–31 nunca cobrava em meses curtos.
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
    r.user_id, r.workspace_id, r.category_id, 'expense', r.amount, r.name, v_ts,
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

create or replace function public.run_subscription_billing()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_step smallint;
  v_today date;
  v_last_day int;
  n int := 0;
begin
  v_today := public.app_today();
  v_last_day := extract(day from (date_trunc('month', v_today) + interval '1 month - 1 day'))::int;

  for v_id in
    select ws.id
    from public.workspace_subscriptions ws
    where ws.is_active = true
      and (
        (ws.next_billing_date is not null and ws.next_billing_date <= v_today)
        or (
          ws.next_billing_date is null
          and ws.day_of_month is not null
          and extract(day from v_today)::int = least(ws.day_of_month::int, v_last_day)
          and ws.start_date <= v_today
        )
      )
  loop
    loop
      v_step := public.charge_subscription_cycle(v_id);
      exit when v_step = 0;
      if v_step = 1 then n := n + 1; end if;
    end loop;
  end loop;

  return n;
end;
$$;

-- A primeira cobrança nasce com o cadastro; agora a próxima data avança junto,
-- em vez de ficar mostrando como "próxima" uma cobrança que já aconteceu.
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
    new.user_id, new.workspace_id, new.category_id, 'expense', new.amount, new.name, v_ts,
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

-- ─── 5. Compras parceladas ──────────────────────────────────────────────────
-- Sem o `not exists` por data: se a pessoa movia uma parcela para a data da
-- seguinte, a próxima era pulada e o contador avançava mesmo assim. O índice
-- único por (plano, sequência) já impede duplicata.
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
  v_rows int;
begin
  v_today := public.app_today();

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

  v_ts := (to_char(v_charge, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;
  insert into public.transactions (
    user_id, workspace_id, category_id, type, amount, description, date,
    is_recurring, recurring_interval, installment_plan_id,
    installment_sequence, payment_method, payment_credit_card_id
  ) values (
    r.user_id, r.workspace_id, r.category_id, 'expense', v_amount, v_desc, v_ts,
    false, null, r.id,
    v_part::smallint, r.payment_method, r.payment_credit_card_id
  )
  on conflict (installment_plan_id, installment_sequence)
    where installment_plan_id is not null and installment_sequence is not null
    do nothing;
  get diagnostics v_rows = row_count;

  v_new_count := r.generated_count + 1;

  perform set_config('app.billing_advance', 'on', true);
  if v_new_count >= r.total_installments then
    -- next_billing_date é NOT NULL: a versão antiga gravava null aqui, o update
    -- falhava e a última parcela nunca era cobrada. Fica a data da última.
    update public.workspace_installment_plans
    set
      generated_count = v_new_count,
      is_active = false
    where id = r.id;
  else
    v_next := public.next_subscription_billing_date(v_charge, 'monthly', r.billing_anchor_day);
    update public.workspace_installment_plans
    set
      generated_count = v_new_count,
      next_billing_date = v_next
    where id = r.id;
  end if;
  perform set_config('app.billing_advance', 'off', true);

  if v_rows > 0 then
    return 1;
  end if;
  return 2;
end;
$$;

-- `catch_up_recurring_billing` repete o filtro do caminho legado.
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
  v_last_day int;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  v_today := public.app_today();
  v_last_day := extract(day from (date_trunc('month', v_today) + interval '1 month - 1 day'))::int;

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

  for r in
    select ws.id
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
          and extract(day from v_today)::int = least(ws.day_of_month::int, v_last_day)
          and ws.start_date <= v_today
        )
      )
  loop
    loop
      v_step := public.charge_subscription_cycle(r.id);
      exit when v_step = 0;
      if v_step = 1 then v_sub_n := v_sub_n + 1; end if;
    end loop;
  end loop;

  return jsonb_build_object('subscriptions', v_sub_n, 'installments', v_inst_n);
end;
$$;

-- ─── 6. Fuso ────────────────────────────────────────────────────────────────
-- Ninguém grava `sent_on`: valia o default em UTC, e depois das 21h de Brasília
-- o dia da dedupe virava e um lembrete podia sair duas vezes.
alter table public.bill_notification_dedupe
  alter column sent_on set default public.app_today();

create or replace function public.rpc_fetch_bills_page_bundle(p_workspace_id uuid)
returns jsonb
language plpgsql
stable
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
  v_since date := (public.app_today() - interval '90 days')::date;
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

revoke all on function public.rpc_fetch_bills_page_bundle(uuid) from public, anon;
grant execute on function public.rpc_fetch_bills_page_bundle(uuid) to authenticated, service_role;

-- ─── 7. Índices nas FKs de autoria usadas pela exclusão de conta ────────────
create index if not exists bill_instances_user_id_idx on public.bill_instances (user_id);
create index if not exists bills_user_id_idx on public.bills (user_id);
create index if not exists credit_cards_user_id_idx on public.credit_cards (user_id);
create index if not exists workspace_installment_plans_user_id_idx on public.workspace_installment_plans (user_id);
create index if not exists workspace_subscriptions_user_id_idx on public.workspace_subscriptions (user_id);
create index if not exists bill_notification_dedupe_user_id_idx on public.bill_notification_dedupe (user_id);
create index if not exists credit_card_category_spend_alerts_created_by_idx on public.credit_card_category_spend_alerts (created_by);

-- ─── 8. Higiene ─────────────────────────────────────────────────────────────
-- Toda coluna de valor da casa é numeric(15,2); `budgets.amount` era a única sem escala.
alter table public.budgets alter column amount type numeric(15, 2);

-- A única política que ficou fora de `20260824170000`: `auth.jwt()` sem subselect
-- é reavaliado por linha.
drop policy if exists "Invitees can view own pending email invites" on public.workspace_invites;
create policy "Invitees can view own pending email invites" on public.workspace_invites
  as permissive for select to public
  using (
    status = 'pending'
    and expires_at > now()
    and invited_email is not null
    and lower(trim(coalesce(invited_email, ''))) = lower(trim(coalesce(((select auth.jwt()) ->> 'email'), '')))
  );
