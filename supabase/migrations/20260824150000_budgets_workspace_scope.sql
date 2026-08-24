-- Budgets passam a ser workspace-scoped (decisão de produto, Fase 5).
--
-- O schema era ambíguo: unique por (user_id, category_id, period_start) mas
-- SELECT policy workspace-wide, e o RPC bundle filtrava por auth.uid()
-- enquanto o caminho legado não — membros de um workspace compartilhado viam
-- orçamentos diferentes dependendo do caminho de leitura.
--
-- Agora: UM orçamento por categoria/mês por workspace, visível e editável por
-- todos os membros; `user_id` vira autoria (quem criou/editou por último).

-- 1. Merge de duplicatas (vários membros com budget para a mesma
--    categoria/mês): mantém o mais recentemente atualizado.
do $$
declare
  v_dupes int;
begin
  with ranked as (
    select id,
           row_number() over (
             partition by workspace_id, category_id, period_start
             order by updated_at desc nulls last, created_at desc, id desc
           ) as rn
    from public.budgets
    where workspace_id is not null
  )
  delete from public.budgets b
  using ranked
  where b.id = ranked.id and ranked.rn > 1;
  get diagnostics v_dupes = row_count;
  if v_dupes > 0 then
    raise notice 'budgets_workspace_scope: merged % duplicate budget row(s)', v_dupes;
  end if;
end;
$$;

-- 2. Unicidade por workspace — fase EXPAND.
--    O índice legado por usuário é MANTIDO de propósito: o cliente ainda em
--    produção faz `upsert(onConflict: "user_id,category_id,period_start")` e
--    quebraria ("no unique constraint matching") se ele sumisse aqui.
--    A remoção é a fase CONTRACT, na migração 20260824180000, que só deve ser
--    aplicada DEPOIS do deploy do cliente novo.
create unique index if not exists budgets_workspace_category_period_unique
  on public.budgets (workspace_id, category_id, period_start);

-- 3. RPC bundle: remover o filtro por auth.uid() no budget (mesma semântica
--    do caminho legado — o orçamento é do workspace).
CREATE OR REPLACE FUNCTION public.rpc_fetch_category_detail_bundle(p_workspace_id uuid, p_category_id uuid, p_year_month text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
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
$function$


