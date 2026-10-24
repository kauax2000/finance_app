-- Bloco 6A — Contas a pagar (spec §11, "Revisão de Contas a pagar").
--
-- Só acrescenta: o front de `main` continua gravando `bills` e
-- `bill_instances` como hoje, e o `pay_bill_instance` não muda.

-- 1. valor variável pela média ------------------------------------------------
-- A conta de valor variável (luz, água) estima pela média das 3 últimas pagas.
-- Todo leitor (lista, lembrete, previsão) já lê `amount_estimated`: a média é
-- gravada nele, e a fonte continua uma só.
alter table public.bills
  add column if not exists valor_variavel boolean not null default false;

-- Roda quando a instância vira paga. Paga sem `paid_amount` não entra; sem
-- nenhuma com valor, o `amount_estimated` digitado fica (o `coalesce`).
-- `security definer`: a média lê as instâncias e grava a conta sem depender
-- da RLS de quem paga.
-- ponytail: só recalcula ao pagar; editar o valor ou reabrir uma paga deixa a
-- média até o próximo pagamento.
create or replace function public.media_da_conta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.bills b
  set amount_estimated = coalesce((
    select round(avg(u.paid_amount), 2)
    from (
      select i.paid_amount
      from public.bill_instances i
      where i.bill_id = new.bill_id
        and i.status = 'paid'
        and i.paid_amount is not null
      order by i.due_date desc
      limit 3
    ) u
  ), b.amount_estimated)
  where b.id = new.bill_id
    and b.valor_variavel;
  return null;
end;
$$;

drop trigger if exists media_da_conta on public.bill_instances;
create trigger media_da_conta after update of status on public.bill_instances
  for each row
  when (new.status = 'paid' and old.status <> 'paid')
  execute function public.media_da_conta();

-- 2. pular é atômico ----------------------------------------------------------
-- Como o `pay_bill_instance`: a instância é reivindicada com
-- `status = 'pending'` no WHERE, e quem chega depois não passa. A próxima
-- nasce com `on conflict do nothing` em `(bill_id, due_date)`, para o passo 0
-- do lembrete e o pular não darem duas.
create or replace function public.pular_instancia_da_conta(p_instance_id uuid, p_next_due_date date)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_inst public.bill_instances%rowtype;
begin
  update public.bill_instances
  set status = 'skipped'
  where id = p_instance_id
    and status = 'pending'
  returning * into v_inst;

  if not found then
    raise exception 'BILL_INSTANCE_NOT_PENDING' using errcode = 'P0001';
  end if;

  if p_next_due_date is not null then
    insert into public.bill_instances (workspace_id, user_id, bill_id, due_date, status, amount)
    values (v_inst.workspace_id, (select auth.uid()), v_inst.bill_id, p_next_due_date, 'pending', null)
    on conflict do nothing;
  end if;
end;
$$;

revoke all on function public.pular_instancia_da_conta(uuid, date) from public, anon;
grant execute on function public.pular_instancia_da_conta(uuid, date) to authenticated, service_role;

-- 3. ligar um lançamento que já existe como o pagamento -----------------------
-- O casamento automático: "isso pagou a conta {nome}?". Um toque liga os dois,
-- sem lançamento novo. O lançamento é travado (`for update`) antes da
-- conferência, para dois toques não ligarem o mesmo lançamento a duas contas.
-- Despesa, da mesma carteira e ainda solto; senão, TRANSACTION_ALREADY_LINKED.
create or replace function public.ligar_pagamento_da_conta(p_instance_id uuid, p_transaction_id uuid, p_next_due_date date)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tx public.transactions%rowtype;
  v_inst public.bill_instances%rowtype;
begin
  select t.* into v_tx
  from public.transactions t
  where t.id = p_transaction_id
  for update;

  if not found
    or v_tx.type <> 'expense'
    or exists (
      select 1 from public.bill_instances i
      where i.transaction_id = p_transaction_id
    )
    or exists (
      select 1 from public.bill_instances i
      where i.id = p_instance_id
        and i.workspace_id is distinct from v_tx.workspace_id
    ) then
    raise exception 'TRANSACTION_ALREADY_LINKED' using errcode = 'P0001';
  end if;

  update public.bill_instances
  set status = 'paid',
      paid_at = v_tx.date,
      paid_amount = v_tx.amount,
      amount = v_tx.amount,
      payment_method = v_tx.payment_method,
      payment_credit_card_id = v_tx.payment_credit_card_id,
      transaction_id = v_tx.id
  where id = p_instance_id
    and status = 'pending'
  returning * into v_inst;

  if not found then
    raise exception 'BILL_INSTANCE_NOT_PENDING' using errcode = 'P0001';
  end if;

  if p_next_due_date is not null then
    insert into public.bill_instances (workspace_id, user_id, bill_id, due_date, status, amount)
    values (v_inst.workspace_id, (select auth.uid()), v_inst.bill_id, p_next_due_date, 'pending', null)
    on conflict do nothing;
  end if;
end;
$$;

revoke all on function public.ligar_pagamento_da_conta(uuid, uuid, date) from public, anon;
grant execute on function public.ligar_pagamento_da_conta(uuid, uuid, date) to authenticated, service_role;

-- 4. apagar o lançamento reabre a instância -----------------------------------
-- Sem isto, o `on delete set null` deixava a instância `paid` sem lançamento:
-- a conta sumia das Pendentes e o lembrete calava. Antes do delete, a
-- instância volta a `pending` com os campos do pagamento nulos juntos (o CHECK
-- só aceita `paid_amount` em `paid`).
-- `security definer`: a cascata de `delete_workspace` chega aqui depois de a
-- carteira não ter mais quem consultar; o update só toca instâncias da mesma
-- carteira, que a mesma cascata apaga em seguida. O `garantir_escrita` já
-- deixa a cascata passar (`pg_trigger_depth() > 1`), e não mora em
-- `bill_instances`.
create or replace function public.reabrir_instancia_ao_apagar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.bill_instances
  set status = 'pending',
      paid_at = null,
      paid_amount = null,
      amount = null,
      transaction_id = null
  where transaction_id = old.id;
  return old;
end;
$$;

drop trigger if exists reabrir_instancia_ao_apagar on public.transactions;
create trigger reabrir_instancia_ao_apagar before delete on public.transactions
  for each row execute function public.reabrir_instancia_ao_apagar();

-- 5. mudar o valor do lançamento acompanha o pago -----------------------------
create or replace function public.acompanhar_valor_pago()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.bill_instances
  set paid_amount = new.amount,
      amount = new.amount
  where transaction_id = new.id
    and status = 'paid';
  return null;
end;
$$;

drop trigger if exists acompanhar_valor_pago on public.transactions;
create trigger acompanhar_valor_pago after update of amount on public.transactions
  for each row
  when (new.amount is distinct from old.amount)
  execute function public.acompanhar_valor_pago();

revoke all on function public.media_da_conta() from public, anon, authenticated;
revoke all on function public.reabrir_instancia_ao_apagar() from public, anon, authenticated;
revoke all on function public.acompanhar_valor_pago() from public, anon, authenticated;
