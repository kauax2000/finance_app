-- Estorno no cartão (receita com `payment_method = 'credit_card'` e cartão)
-- abate a fatura do ciclo em que cai. O pacote da página de contas só
-- devolvia as despesas de cartão, e a fatura projetada lá
-- (`projectVirtualCreditCardBills`) ficava sem o abatimento.
--
-- O corpo é o de 20261015120000_bills_bundle_recent_cc.sql, só com o filtro
-- de `cc_transactions` trocado de `t.type = 'expense'` para receita e
-- despesa.
--
-- Idempotente: pode rodar pelo editor SQL e depois pelo `db push`.

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
  -- A fatura projetada só olha do fechamento retrasado ao próximo (~62 dias).
  v_cc_since date := (public.app_today() - interval '100 days')::date;
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
    and t.type in ('expense','income')
    and t.payment_method = 'credit_card'
    and (t.date >= v_cc_since or t.installment_plan_id is not null);

  select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
  into v_plans
  from public.workspace_installment_plans p
  where p.workspace_id = p_workspace_id;

  select coalesce(jsonb_agg(to_jsonb(ip)), '[]'::jsonb)
  into v_inv
  from public.credit_card_invoice_payments ip
  where ip.workspace_id = p_workspace_id
    and ip.statement_close_date >= v_cc_since;

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
