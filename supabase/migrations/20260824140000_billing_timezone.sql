-- Timezone do app: America/Sao_Paulo (decisão de produto, Fase 4).
--
-- Todo "hoje" de billing/vencimento passa a usar o dia-calendário brasileiro.
-- Antes, tudo era UTC: entre 21:00 e 23:59 BRT o sistema já considerava o dia
-- seguinte — assinaturas cobradas "um dia antes", faturas "fechando" cedo e
-- lembretes disparando no dia errado do ponto de vista do usuário.
--
-- O carimbo das transações geradas segue sendo meio-dia UTC (12:00Z = 09:00
-- BRT), que preserva o mesmo dia-calendário nas duas zonas — apenas a
-- comparação de "hoje" muda. O índice único de idempotência
-- (transactions_subscription_charge_unique) torna a transição segura: no pior
-- caso a cobrança do dia é um no-op ON CONFLICT.

create or replace function public.app_today()
returns date
language sql
stable
set search_path = public
as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;

comment on function public.app_today() is
  'Dia-calendário de referência do app (America/Sao_Paulo). Usar em toda comparação de vencimento/billing.';

revoke all on function public.app_today() from public;
grant execute on function public.app_today() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Installment billing: "hoje" em BRT
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

  if not exists (
    select 1
    from public.transactions t
    where t.installment_plan_id = r.id
      and (t.date at time zone 'UTC')::date = v_charge
  ) then
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

create or replace function public.run_installment_billing()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_step smallint;
  n int := 0;
begin
  for r in
    select p.id
    from public.workspace_installment_plans p
    where p.is_active = true
      and p.generated_count < p.total_installments
      and p.next_billing_date <= public.app_today()
  loop
    loop
      v_step := public.charge_workspace_installment_plan_step(r.id);
      exit when v_step = 0;
      if v_step = 1 then
        n := n + 1;
      end if;
    end loop;
  end loop;

  return n;
end;
$$;

revoke all on function public.run_installment_billing() from public;
grant execute on function public.run_installment_billing() to service_role;
