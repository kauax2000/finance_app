-- ============================================================================
-- PRÉ-CHECAGEM antes do `supabase db push` das 10 migrações pendentes.
-- 100% READ-ONLY. Cole no SQL Editor do Supabase (produção) e rode.
--
-- Mostra exatamente quantas linhas cada migração destrutiva vai apagar, e
-- quais dados violariam as constraints novas (que fariam o push FALHAR).
-- ============================================================================

-- ── 1. Quantas linhas serão APAGADAS ────────────────────────────────────────
select '130000 · cobranças de assinatura duplicadas (mesmo dia)' as verificacao,
       count(*)::bigint as linhas_apagadas
from (
  select row_number() over (
           partition by subscription_id, ((date at time zone 'UTC')::date)
           order by created_at asc, id asc
         ) as rn
  from public.transactions
  where subscription_id is not null
) x where rn > 1

union all
select '130000 · parcelas duplicadas (mesma sequência do plano)',
       count(*)
from (
  select row_number() over (
           partition by installment_plan_id, installment_sequence
           order by created_at asc, id asc
         ) as rn
  from public.transactions
  where installment_plan_id is not null and installment_sequence is not null
) x where rn > 1

union all
select '142000 · notificações member_expense_created duplicadas',
       count(*)
from (
  select row_number() over (
           partition by user_id, workspace_id, (metadata->>'transaction_id')
           order by created_at asc, id asc
         ) as rn
  from public.notifications
  where metadata->>'kind' = 'member_expense_created'
    and metadata->>'transaction_id' is not null
) x where rn > 1

union all
select '150000 · orçamentos duplicados (mantém o mais recente)',
       count(*)
from (
  select row_number() over (
           partition by workspace_id, category_id, period_start
           order by updated_at desc nulls last, created_at desc, id desc
         ) as rn
  from public.budgets
  where workspace_id is not null
) x where rn > 1

union all
select '151000 · transactions órfãs SEM workspace pessoal → APAGADAS',
       count(*)
from public.transactions t
where t.workspace_id is null
  and not exists (select 1 from public.workspaces w
                  where w.created_by = t.user_id and w.type = 'personal')

union all
select '151000 · categories órfãs SEM workspace pessoal → APAGADAS',
       count(*)
from public.categories c
where c.workspace_id is null
  and not exists (select 1 from public.workspaces w
                  where w.created_by = c.user_id and w.type = 'personal')

union all
select '151000 · budgets órfãos SEM workspace pessoal → APAGADOS',
       count(*)
from public.budgets b
where b.workspace_id is null
  and not exists (select 1 from public.workspaces w
                  where w.created_by = b.user_id and w.type = 'personal')

-- ── 2. Linhas RECUPERADAS (re-hospedadas, não apagadas) ────────────────────
union all
select '151000 · transactions órfãs → re-hospedadas no workspace pessoal',
       count(*)
from public.transactions t
where t.workspace_id is null
  and exists (select 1 from public.workspaces w
              where w.created_by = t.user_id and w.type = 'personal')

union all
select '151000 · categories órfãs → re-hospedadas',
       count(*)
from public.categories c
where c.workspace_id is null
  and exists (select 1 from public.workspaces w
              where w.created_by = c.user_id and w.type = 'personal')

-- ── 3. Dados que fariam o push FALHAR (não apagam, mas abortam) ────────────
union all
select '152000 · transactions com amount <= 0 (bloqueia o VALIDATE)',
       count(*)
from public.transactions where amount <= 0

union all
select '152000 · assinaturas com amount <= 0 (bloqueia o VALIDATE)',
       count(*)
from public.workspace_subscriptions where amount <= 0

union all
select '152000 · cartões com credit_limit <= 0 (bloqueia o VALIDATE)',
       count(*)
from public.credit_cards where credit_limit is not null and credit_limit <= 0

union all
select '152000 · bill_instances pagas sem paid_at (bloqueia o VALIDATE)',
       count(*)
from public.bill_instances where status = 'paid' and paid_at is null

union all
select '152000 · client_id repetido dentro do mesmo workspace',
       count(*)
from (
  select 1 from public.transactions
  where client_id is not null
  group by workspace_id, client_id having count(*) > 1
) x

order by 1;

-- ============================================================================
-- COMO LER
--   Tudo zero  → o push é puramente estrutural, nada é apagado. Pode aplicar.
--   Seção 1 >0 → confira as amostras abaixo antes de aplicar.
--   Seção 3 >0 → CORRIJA ANTES: o push aborta no VALIDATE CONSTRAINT
--                (transacional, então faz rollback — sem estrago, mas trava).
-- ============================================================================

-- ── Amostra das cobranças duplicadas (inspeção manual) ─────────────────────
-- select t.id, t.subscription_id, t.date, t.amount, t.description, t.created_at
-- from (
--   select *, row_number() over (
--            partition by subscription_id, ((date at time zone 'UTC')::date)
--            order by created_at asc, id asc) as rn
--   from public.transactions where subscription_id is not null
-- ) t
-- where t.rn > 1
-- order by t.subscription_id, t.date
-- limit 50;
