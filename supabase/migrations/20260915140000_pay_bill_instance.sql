-- Fase 3.6 — pagar uma conta é uma transação só.
--
-- O cliente fazia três escritas soltas: criava a despesa, marcava a parcela e
-- abria a próxima. Uma falha no meio deixava despesa sem parcela paga, e um
-- segundo clique (ou um retry depois de a resposta se perder) criava a despesa
-- de novo. Aqui a parcela é reivindicada primeiro, com `status = 'pending'` no
-- WHERE: quem chega depois não passa dessa linha.
--
-- `security invoker`: valem as políticas de sempre (membro da carteira, autor
-- = auth.uid()) e os gatilhos de referência na mesma carteira.

create or replace function public.pay_bill_instance(
  p_instance_id uuid,
  p_amount numeric,
  p_paid_date date,
  p_category_id uuid,
  p_payment_method text,
  p_payment_credit_card_id uuid,
  p_description text,
  p_next_due_date date
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_inst public.bill_instances%rowtype;
  v_paid_at timestamptz;
  v_tx uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'BILL_PAYMENT_INVALID_AMOUNT' using errcode = '22023';
  end if;
  if p_paid_date is null then
    raise exception 'BILL_PAYMENT_INVALID_DATE' using errcode = '22023';
  end if;

  -- Meio-dia UTC, a mesma convenção das datas de lançamento.
  v_paid_at := (to_char(p_paid_date, 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz;

  update public.bill_instances
  set status = 'paid',
      paid_at = v_paid_at,
      paid_amount = p_amount,
      amount = p_amount,
      payment_method = p_payment_method,
      payment_credit_card_id = p_payment_credit_card_id
  where id = p_instance_id
    and status = 'pending'
  returning * into v_inst;

  if not found then
    raise exception 'BILL_INSTANCE_NOT_PENDING' using errcode = 'P0001';
  end if;

  insert into public.transactions (
    user_id, workspace_id, category_id, type, amount, description, date,
    is_recurring, recurring_interval, payment_method, payment_credit_card_id
  ) values (
    (select auth.uid()), v_inst.workspace_id, p_category_id, 'expense', p_amount,
    p_description, v_paid_at, false, null, p_payment_method, p_payment_credit_card_id
  )
  returning id into v_tx;

  update public.bill_instances
  set transaction_id = v_tx
  where id = v_inst.id;

  if p_next_due_date is not null then
    insert into public.bill_instances (workspace_id, user_id, bill_id, due_date, status, amount)
    values (v_inst.workspace_id, (select auth.uid()), v_inst.bill_id, p_next_due_date, 'pending', null)
    on conflict do nothing;
  end if;

  return v_tx;
end;
$$;

revoke all on function public.pay_bill_instance(uuid, numeric, date, uuid, text, uuid, text, date) from public, anon;
grant execute on function public.pay_bill_instance(uuid, numeric, date, uuid, text, uuid, text, date) to authenticated, service_role;
