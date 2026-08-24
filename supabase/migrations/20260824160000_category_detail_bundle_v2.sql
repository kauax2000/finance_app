-- Bundle de detalhe de categoria v2 (Fase 6, D5).
--
-- A v1 devolvia agregados de mês-calendário (`workspace_month_rows`,
-- `prev_category_rows`) que o cliente NÃO podia usar: a atribuição de mês de
-- despesa no cartão é por fechamento de fatura e exigia bounds com padding e
-- payment_method/payment_credit_card_id — então o cliente rodava o RPC e
-- ainda fazia 3 REST queries extras (5 round-trips no total, incluindo uma
-- varredura workspace-wide) e descartava parte do payload.
--
-- A v2 devolve exatamente o que a atribuição precisa, em UM round-trip:
--   * txs_padded: transações da categoria em [padStart, padEnd] com embeds;
--   * workspace_padded_rows: linhas do workspace no mesmo intervalo com
--     campos de pagamento (para os KPIs de mês do workspace);
--   * series_rows: 12 meses com campos de pagamento;
--   * credit_cards: {id, closing_day} (lookup de fechamento);
--   * category/budget/installment_plans/subscriptions como antes.

create or replace function public.rpc_fetch_category_detail_bundle(
  p_workspace_id uuid,
  p_category_id uuid,
  p_year_month text
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_period_start date;
  v_pad_start date;
  v_pad_end date;
  v_range_start date;
  v_series_start date;
  v_cat jsonb;
  v_budget jsonb;
  v_tx_padded jsonb;
  v_series jsonb;
  v_ws_padded jsonb;
  v_plans jsonb;
  v_subs jsonb;
  v_cards jsonb;
  v_ym date;
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
  -- Padding ±1 mês: atribuição por fechamento de fatura puxa compras do mês
  -- calendário anterior/seguinte para dentro/fora do mês de despesa.
  v_pad_start := (v_period_start - interval '1 month')::date;
  v_pad_end := (v_period_start + interval '2 months - 1 day')::date;
  v_range_start := (v_period_start - interval '11 months')::date;
  v_series_start := least(v_range_start, v_pad_start);

  select to_jsonb(c) into v_cat
  from public.categories c
  where c.workspace_id = p_workspace_id and c.id = p_category_id;

  select to_jsonb(b) into v_budget
  from public.budgets b
  where b.workspace_id = p_workspace_id
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
  into v_tx_padded
  from public.transactions t
  left join public.categories cat on cat.id = t.category_id
  left join public.workspace_subscriptions ws on ws.id = t.subscription_id
  left join public.workspace_installment_plans ip on ip.id = t.installment_plan_id
  where t.workspace_id = p_workspace_id
    and t.category_id = p_category_id
    and t.date >= (to_char(v_pad_start, 'YYYY-MM-DD') || 'T00:00:00.000Z')::timestamptz
    and t.date <= (to_char(v_pad_end, 'YYYY-MM-DD') || 'T23:59:59.999Z')::timestamptz;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', t.date,
        'amount', t.amount,
        'type', t.type,
        'category_id', t.category_id,
        'payment_method', t.payment_method,
        'payment_credit_card_id', t.payment_credit_card_id
      )
      order by t.date
    ),
    '[]'::jsonb
  )
  into v_series
  from public.transactions t
  where t.workspace_id = p_workspace_id
    and t.category_id = p_category_id
    and t.date >= (to_char(v_series_start, 'YYYY-MM-DD') || 'T00:00:00.000Z')::timestamptz
    and t.date <= (to_char(v_pad_end, 'YYYY-MM-DD') || 'T23:59:59.999Z')::timestamptz;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', t.date,
        'amount', t.amount,
        'type', t.type,
        'payment_method', t.payment_method,
        'payment_credit_card_id', t.payment_credit_card_id
      )
    ),
    '[]'::jsonb
  )
  into v_ws_padded
  from public.transactions t
  where t.workspace_id = p_workspace_id
    and t.date >= (to_char(v_pad_start, 'YYYY-MM-DD') || 'T00:00:00.000Z')::timestamptz
    and t.date <= (to_char(v_pad_end, 'YYYY-MM-DD') || 'T23:59:59.999Z')::timestamptz;

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

  select coalesce(
    jsonb_agg(jsonb_build_object('id', cc.id, 'closing_day', cc.closing_day)),
    '[]'::jsonb
  )
  into v_cards
  from public.credit_cards cc
  where cc.workspace_id = p_workspace_id;

  return jsonb_build_object(
    'v', 2,
    'category', v_cat,
    'budget', v_budget,
    'txs_padded', coalesce(v_tx_padded, '[]'::jsonb),
    'series_rows', coalesce(v_series, '[]'::jsonb),
    'workspace_padded_rows', coalesce(v_ws_padded, '[]'::jsonb),
    'installment_plans', coalesce(v_plans, '[]'::jsonb),
    'subscriptions', coalesce(v_subs, '[]'::jsonb),
    'credit_cards', coalesce(v_cards, '[]'::jsonb)
  );
end;
$$;

revoke all on function public.rpc_fetch_category_detail_bundle(uuid, uuid, text) from public;
grant execute on function public.rpc_fetch_category_detail_bundle(uuid, uuid, text) to authenticated;
