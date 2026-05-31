-- pgTAP: bimonthly subscription billing advances next_billing_date by 2 months
begin;
select plan(3);

create temp table _pgtap_bimonthly_sub as
with nu as (
  insert into auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user,
    is_anonymous
  ) values (
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'bimonthly_' || gen_random_uuid() || '@local.test',
    '',
    '{}',
    '{}',
    now(),
    now(),
    false,
    false
  )
  returning id
),
nw as (
  insert into public.workspaces (name, type, created_by)
  select
    'pgtap_bimonthly_' || substr(md5(random()::text), 1, 10),
    'personal',
    id
  from nu
  returning id
),
nm as (
  insert into public.workspace_members (workspace_id, user_id, role)
  select nw.id, nu.id, 'owner'::text
  from nw
  cross join nu
  returning workspace_id
),
ins as (
  insert into public.workspace_subscriptions (
    workspace_id,
    user_id,
    name,
    amount,
    billing_interval,
    currency,
    start_date,
    next_billing_date,
    payment_method
  )
  select
    nw.id,
    nu.id,
    'pgtap bimonthly subscription',
    120.00,
    'bimonthly',
    'BRL',
    current_date,
    current_date,
    'pix'
  from nw
  cross join nu
  where exists (select 1 from nm)
  returning id, next_billing_date as charge_date
)
select id, charge_date from ins;

select ok(
  (select count(*) = 1 from _pgtap_bimonthly_sub),
  'bimonthly billing_interval passes CHECK constraint on insert'
);

select lives_ok(
  'select public.run_subscription_billing()',
  'run_subscription_billing executes with bimonthly subscription'
);

select is(
  (
    select ws.next_billing_date
    from public.workspace_subscriptions ws
    join _pgtap_bimonthly_sub s on s.id = ws.id
  ),
  (
    select (s.charge_date + interval '2 months')::date
    from _pgtap_bimonthly_sub s
  ),
  'run_subscription_billing advances bimonthly next_billing_date by 2 months'
);

select * from finish();
rollback;
