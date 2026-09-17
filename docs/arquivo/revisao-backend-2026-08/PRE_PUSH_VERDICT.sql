-- ============================================================================
-- VEREDITO ÚNICO — read-only. Cole INTEIRO no SQL Editor e rode.
-- Retorna SEMPRE exatamente 1 linha (sem ambiguidade de "0 rows").
-- ============================================================================
with c as (
  select
    -- transações que a migração 130000 apagaria (assinatura duplicada)
    (select count(*) from (
       select row_number() over (
                partition by subscription_id, ((date at time zone 'UTC')::date)
                order by created_at asc, id asc) as rn
       from public.transactions where subscription_id is not null
     ) x where rn > 1)::bigint as tx_assinatura_dup,

    -- transações que a migração 130000 apagaria (parcela duplicada)
    (select count(*) from (
       select row_number() over (
                partition by installment_plan_id, installment_sequence
                order by created_at asc, id asc) as rn
       from public.transactions
       where installment_plan_id is not null and installment_sequence is not null
     ) x where rn > 1)::bigint as tx_parcela_dup,

    -- transações que a migração 151000 apagaria (órfã sem workspace pessoal)
    (select count(*) from public.transactions t
      where t.workspace_id is null
        and not exists (select 1 from public.workspaces w
                        where w.created_by = t.user_id and w.type = 'personal')
    )::bigint as tx_orfa_apagada,

    -- órfãs no total (as demais seriam apenas re-hospedadas, não apagadas)
    (select count(*) from public.transactions where workspace_id is null)::bigint
      as tx_orfa_total,

    -- não-transações que também seriam apagadas
    (select count(*) from (
       select row_number() over (
                partition by user_id, workspace_id, (metadata->>'transaction_id')
                order by created_at asc, id asc) as rn
       from public.notifications
       where metadata->>'kind' = 'member_expense_created'
         and metadata->>'transaction_id' is not null
     ) x where rn > 1)::bigint as notificacao_dup,

    (select count(*) from (
       select row_number() over (
                partition by workspace_id, category_id, period_start
                order by updated_at desc nulls last, created_at desc, id desc) as rn
       from public.budgets where workspace_id is not null
     ) x where rn > 1)::bigint as orcamento_dup,

    -- dados que fariam o push FALHAR (não apagam, mas abortam a migração)
    (select count(*) from public.transactions where amount <= 0)::bigint
      as bloqueio_tx_amount,
    (select count(*) from public.workspace_subscriptions where amount <= 0)::bigint
      as bloqueio_sub_amount,
    (select count(*) from public.bill_instances
      where status = 'paid' and paid_at is null)::bigint as bloqueio_paid_at
)
select
  tx_assinatura_dup,
  tx_parcela_dup,
  tx_orfa_apagada,
  tx_orfa_total,
  notificacao_dup,
  orcamento_dup,
  bloqueio_tx_amount,
  bloqueio_sub_amount,
  bloqueio_paid_at,
  case
    when tx_assinatura_dup + tx_parcela_dup + tx_orfa_apagada = 0
      then 'SEGURO: nenhuma transacao sera apagada'
    else 'ATENCAO: ' || (tx_assinatura_dup + tx_parcela_dup + tx_orfa_apagada)
         || ' transacoes seriam apagadas'
  end as veredito_transacoes,
  case
    when bloqueio_tx_amount + bloqueio_sub_amount + bloqueio_paid_at = 0
      then 'OK: nenhuma constraint bloqueia o push'
    else 'ATENCAO: dados violam as constraints novas - push abortaria'
  end as veredito_bloqueios
from c;
