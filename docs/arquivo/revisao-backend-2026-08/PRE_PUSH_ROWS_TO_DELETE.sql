-- ============================================================================
-- INSPEÇÃO: quais transações exatamente seriam apagadas.
-- 100% READ-ONLY. Rode cada bloco separadamente no SQL Editor (produção).
--
-- Cada linha mostra a ação (MANTIDA / >>> APAGADA) para você comparar lado a
-- lado dentro do mesmo grupo de duplicatas antes de aplicar as migrações.
-- ============================================================================


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ BLOCO 1 — migração 130000: cobranças de ASSINATURA duplicadas no mesmo dia║
-- ╚══════════════════════════════════════════════════════════════════════════╝
with ranked as (
  select
    t.id,
    t.subscription_id,
    t.date,
    t.amount,
    t.description,
    t.created_at,
    t.workspace_id,
    s.name as assinatura,
    row_number() over (
      partition by t.subscription_id, ((t.date at time zone 'UTC')::date)
      order by t.created_at asc, t.id asc
    ) as rn,
    count(*) over (
      partition by t.subscription_id, ((t.date at time zone 'UTC')::date)
    ) as no_grupo,
    min(t.amount) over (
      partition by t.subscription_id, ((t.date at time zone 'UTC')::date)
    ) as menor,
    max(t.amount) over (
      partition by t.subscription_id, ((t.date at time zone 'UTC')::date)
    ) as maior
  from public.transactions t
  left join public.workspace_subscriptions s on s.id = t.subscription_id
  where t.subscription_id is not null
)
select
  case when rn = 1 then 'MANTIDA' else '>>> APAGADA' end as acao,
  assinatura,
  (date at time zone 'UTC')::date as dia_cobranca,
  amount,
  description,
  created_at,
  id,
  workspace_id,
  case
    when menor <> maior then '*** ATENCAO: valores DIFERENTES no grupo - inspecionar ***'
    else ''
  end as alerta
from ranked
where no_grupo > 1
order by assinatura, dia_cobranca, rn;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ BLOCO 2 — migração 130000: PARCELAS duplicadas (mesma sequência do plano) ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
with ranked as (
  select
    t.id,
    t.installment_plan_id,
    t.installment_sequence,
    t.date,
    t.amount,
    t.description,
    t.created_at,
    t.workspace_id,
    p.description as plano,
    p.total_installments,
    row_number() over (
      partition by t.installment_plan_id, t.installment_sequence
      order by t.created_at asc, t.id asc
    ) as rn,
    count(*) over (
      partition by t.installment_plan_id, t.installment_sequence
    ) as no_grupo,
    min(t.amount) over (
      partition by t.installment_plan_id, t.installment_sequence
    ) as menor,
    max(t.amount) over (
      partition by t.installment_plan_id, t.installment_sequence
    ) as maior
  from public.transactions t
  left join public.workspace_installment_plans p on p.id = t.installment_plan_id
  where t.installment_plan_id is not null
    and t.installment_sequence is not null
)
select
  case when rn = 1 then 'MANTIDA' else '>>> APAGADA' end as acao,
  plano,
  installment_sequence || '/' || total_installments as parcela,
  (date at time zone 'UTC')::date as dia_cobranca,
  amount,
  description,
  created_at,
  id,
  case
    when menor <> maior then '*** ATENCAO: valores DIFERENTES no grupo - inspecionar ***'
    else ''
  end as alerta
from ranked
where no_grupo > 1
order by plano, installment_sequence, rn;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ BLOCO 3 — migração 151000: transações ÓRFÃS (sem workspace_id)           ║
-- ║ Só some quem NÃO tem workspace pessoal do dono para onde voltar.         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
select
  case
    when exists (
      select 1 from public.workspaces w
      where w.created_by = t.user_id and w.type = 'personal'
    ) then 'RE-HOSPEDADA (recuperada)'
    else '>>> APAGADA (dono sem workspace pessoal)'
  end as acao,
  t.date,
  t.type,
  t.amount,
  t.description,
  u.email as dono,
  t.user_id,
  t.created_at,
  t.id
from public.transactions t
left join auth.users u on u.id = t.user_id
where t.workspace_id is null
order by acao, t.date desc;


-- ============================================================================
-- COMO INTERPRETAR
--
--  Nenhuma linha retornada nos 3 blocos
--    → nada é apagado. O push é puramente estrutural.
--
--  Linhas com "*** ATENCAO: valores DIFERENTES ***"
--    → PARE e me avise. Duas cobranças da mesma assinatura no mesmo dia com
--      valores distintos podem ser lançamentos legítimos (ex.: ajuste manual),
--      não duplicata de billing. Nesse caso ajustamos o critério antes.
--
--  Linhas "MANTIDA"/">>> APAGADA" com mesmo valor e mesma descrição
--    → duplicata clássica da corrida de billing. Seguro apagar.
--
--  Bloco 3 com ">>> APAGADA"
--    → dados de contas já excluídas; hoje já estão invisíveis no app
--      (o RLS filtra workspace_id nulo). Verifique o email do dono.
-- ============================================================================
