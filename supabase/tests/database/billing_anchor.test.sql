-- pgTAP: Fase 1b — cobrança ancorada no dia, primeira cobrança e fuso.
begin;
select plan(11);

-- ─── Regra de avanço ────────────────────────────────────────────────────────
select is(public.next_subscription_billing_date('2026-01-31', 'monthly'), '2026-02-28'::date,
  'sem âncora: regra antiga preservada (vetor dourado)');
select is(public.next_subscription_billing_date('2026-02-28', 'monthly', 31), '2026-03-31'::date,
  'âncora 31 volta a 31 depois de fevereiro');
select is(public.next_subscription_billing_date('2026-02-28', 'bimonthly', 31), '2026-04-30'::date,
  'bimestral com âncora 31 corta em abril');
select is(public.next_subscription_billing_date('2027-02-28', 'yearly', 29), '2028-02-29'::date,
  'anual com âncora 29 volta ao dia 29 no bissexto');

-- ─── Fixture ────────────────────────────────────────────────────────────────
create temp table _anc as
with nu as (
  insert into auth.users (id, aud, role, email, encrypted_password,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
  values (gen_random_uuid(), 'authenticated', 'authenticated',
    'anchor_' || gen_random_uuid() || '@local.test', '', '{}', '{}', now(), now(), false, false)
  returning id
),
nw as (
  insert into public.workspaces (name, type, created_by)
  select 'pgtap_anchor_' || substr(md5(random()::text), 1, 8), 'shared', id from nu
  returning id, created_by
),
nm as (
  insert into public.workspace_members (workspace_id, user_id, role)
  select id, created_by, 'owner' from nw
  returning workspace_id
)
select (select id from nw) as ws_id, (select created_by from nw) as user_id, (select count(*) from nm) as ok;

-- ─── Assinatura do dia 31 ───────────────────────────────────────────────────
insert into public.workspace_subscriptions (
  id, workspace_id, user_id, name, amount, billing_interval, currency, start_date, next_billing_date, is_active
)
select '00000000-0000-4000-e000-000000000001', ws_id, user_id, 'pgtap anchor sub', 10, 'monthly', 'BRL',
  '2025-01-31', '2025-01-31', true
from _anc;

select is(
  (select next_billing_date from public.workspace_subscriptions where id = '00000000-0000-4000-e000-000000000001'),
  '2025-02-28'::date,
  'primeira cobrança avança a próxima data junto com o cadastro'
);

select public.run_subscription_billing();

select ok(
  exists (select 1 from public.transactions
          where subscription_id = '00000000-0000-4000-e000-000000000001'
            and (date at time zone 'UTC')::date = '2025-03-31')
  and exists (select 1 from public.transactions
          where subscription_id = '00000000-0000-4000-e000-000000000001'
            and (date at time zone 'UTC')::date = '2025-05-31'),
  'assinatura do dia 31 cobra em 31/03 e 31/05 depois de fevereiro'
);

select ok(
  not exists (select 1 from public.transactions
              where subscription_id = '00000000-0000-4000-e000-000000000001'
                and (date at time zone 'UTC')::date = '2025-03-28'),
  'não cobra no dia 28 de março (regra antiga)'
);

-- Edição manual da próxima data redefine a âncora.
update public.workspace_subscriptions
set next_billing_date = '2030-01-15'
where id = '00000000-0000-4000-e000-000000000001';

select is(
  (select billing_anchor_day from public.workspace_subscriptions where id = '00000000-0000-4000-e000-000000000001'),
  15::smallint,
  'editar a próxima data move a âncora'
);

-- ─── Parcelamento do dia 31 ─────────────────────────────────────────────────
insert into public.workspace_installment_plans (
  id, workspace_id, user_id, description, total_installments, generated_count,
  installment_amount, final_installment_amount, next_billing_date, is_active
)
select '00000000-0000-4000-e000-000000000002', ws_id, user_id, 'pgtap anchor plan', 4, 0,
  25, 25, '2025-01-31', true
from _anc;

select public.run_installment_billing();

select is(
  array(select (date at time zone 'UTC')::date
        from public.transactions
        where installment_plan_id = '00000000-0000-4000-e000-000000000002'
        order by installment_sequence),
  array['2025-01-31', '2025-02-28', '2025-03-31', '2025-04-30']::date[],
  'parcelas do dia 31 seguem a âncora'
);

-- ─── Fuso e privilégios ─────────────────────────────────────────────────────
select ok(
  (select column_default from information_schema.columns
   where table_schema = 'public' and table_name = 'bill_notification_dedupe' and column_name = 'sent_on')
  ilike '%app_today%',
  'dedupe de lembrete usa o dia de Brasília'
);

select ok(
  not has_function_privilege('anon', 'public.rpc_fetch_bills_page_bundle(uuid)', 'execute'),
  'bundle de contas não é executável por anon'
);

select * from finish();
rollback;
