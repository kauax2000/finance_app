-- pgTAP: billing unificado — catch-up multi-ciclo no caminho do cron
-- (antes, run_subscription_billing avançava só 1 ciclo por execução)
begin;
select plan(4);

create temp table _uni_fix as
with nu as (
  insert into auth.users (id, aud, role, email, encrypted_password,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
  values (gen_random_uuid(), 'authenticated', 'authenticated',
    'unified_bill_' || gen_random_uuid() || '@local.test', '', '{}', '{}', now(), now(), false, false)
  returning id
),
nw as (
  insert into public.workspaces (name, type, created_by)
  select 'pgtap_uni_ws_' || substr(md5(random()::text), 1, 8), 'personal', id from nu
  returning id, created_by
),
nm as (
  insert into public.workspace_members (workspace_id, user_id, role)
  select id, created_by, 'owner' from nw
  on conflict do nothing
  returning workspace_id
),
sub as (
  -- Assinatura mensal atrasada 3 ciclos (o seed trigger cobra o 1º).
  insert into public.workspace_subscriptions (
    workspace_id, user_id, name, amount, billing_interval, currency,
    start_date, next_billing_date, is_active
  )
  select nw.id, nw.created_by, 'pgtap-uni-sub', 19.90, 'monthly', 'BRL',
    (public.app_today() - interval '100 days')::date,
    (public.app_today() - interval '70 days')::date,
    true
  from nw
  returning id
)
select (select id from sub) as sub_id;

-- Seed trigger cobrou o primeiro ciclo
select is(
  (select count(*)::int from public.transactions
   where subscription_id = (select sub_id from _uni_fix)),
  1,
  'seed trigger charged the first overdue cycle'
);

-- O caminho do cron agora faz catch-up completo (ciclos -70, -40, -10 dias)
select ok(
  (select public.run_subscription_billing()) >= 2,
  'run_subscription_billing catches up multiple overdue cycles in one run'
);

select is(
  (select count(*)::int from public.transactions
   where subscription_id = (select sub_id from _uni_fix)),
  3,
  'all overdue cycles charged exactly once'
);

select ok(
  (select next_billing_date from public.workspace_subscriptions
   where id = (select sub_id from _uni_fix)) > public.app_today(),
  'next_billing_date advanced past today'
);

select * from finish();
rollback;
