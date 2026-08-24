-- Unificação do billing de assinaturas (Fase 4).
--
-- Antes, a mesma lógica de cobrança vivia duplicada (~100 linhas) em
-- `run_subscription_billing` (cron; avançava só 1 ciclo por execução) e
-- `catch_up_recurring_billing` (dashboard; fazia catch-up completo) — com
-- comportamentos divergentes e 3 implementações do stepping de intervalo.
--
-- Agora existe UMA função de cobrança, modelada em
-- `charge_workspace_installment_plan_step`:
--   * `next_subscription_billing_date(date, text)` — stepping canônico
--     (fonte da verdade; cliente TS e edge espelham, com testes de paridade);
--   * `charge_subscription_cycle(uuid)` — tri-state, FOR UPDATE SKIP LOCKED,
--     insert com ON CONFLICT (índice de idempotência), avança 1 ciclo;
--   * `run_subscription_billing` / `catch_up_recurring_billing` viram
--     wrappers finos que fazem loop até 0 — ambos com catch-up completo.
--
-- Requer: 20260824130000 (índice único) e 20260824140000 (app_today).

create or replace function public.next_subscription_billing_date(
  p_from date,
  p_interval text
)
returns date
language sql
immutable
set search_path = public
as $$
  select case p_interval
    when 'weekly'    then (p_from + interval '7 days')::date
    when 'monthly'   then (p_from + interval '1 month')::date
    when 'bimonthly' then (p_from + interval '2 months')::date
    when 'yearly'    then (p_from + interval '1 year')::date
    else (p_from + interval '1 month')::date
  end;
$$;

revoke all on function public.next_subscription_billing_date(date, text) from public;
grant execute on function public.next_subscription_billing_date(date, text)
  to anon, authenticated, service_role;

-- Tri-state: 0 = nada a fazer (inexistente/inativa/não vencida/lockada por
-- outro writer), 1 = cobrou (inseriu transação) e avançou, 2 = avançou sem
-- inserir (dia já cobrado — ON CONFLICT absorveu).
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
begin
  v_today := public.app_today();

  select * into r
  from public.workspace_subscriptions
  where id = p_subscription_id and is_active = true
  for update skip locked;

  if not found then
    return 0;
  end if;

  if r.next_billing_date is not null and r.next_billing_date <= v_today then
    v_charge := r.next_billing_date;
    v_next := public.next_subscription_billing_date(v_charge, r.billing_interval);
  elsif
    r.next_billing_date is null
    and r.day_of_month is not null
    and extract(day from v_today)::smallint = r.day_of_month
    and r.start_date <= v_today
  then
    -- Legado (sem next_billing_date): cobra no dia configurado do mês.
    v_charge := v_today;
    v_next := (v_charge + interval '1 month')::date;
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

  update public.workspace_subscriptions
  set next_billing_date = v_next
  where id = r.id;

  if v_rows > 0 then
    return 1;
  end if;
  return 2;
end;
$$;

-- Interna: sem grant para authenticated/anon (os wrappers têm os grants).
revoke all on function public.charge_subscription_cycle(uuid) from public;
revoke all on function public.charge_subscription_cycle(uuid) from anon;
revoke all on function public.charge_subscription_cycle(uuid) from authenticated;
grant execute on function public.charge_subscription_cycle(uuid) to service_role;

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
  n int := 0;
begin
  v_today := public.app_today();

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
    loop
      v_step := public.charge_subscription_cycle(v_id);
      exit when v_step = 0;
      if v_step = 1 then n := n + 1; end if;
    end loop;
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
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  v_today := public.app_today();

  -- ── Compras parceladas ──────────────────────────────────────────────
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

  -- ── Assinaturas (mesma função de cobrança do cron) ──────────────────
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
          and extract(day from v_today)::smallint = ws.day_of_month
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

revoke all on function public.catch_up_recurring_billing() from public;
grant execute on function public.catch_up_recurring_billing() to authenticated;
