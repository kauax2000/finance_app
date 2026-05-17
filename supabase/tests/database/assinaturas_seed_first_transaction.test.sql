-- pgTAP: seed trigger creates a transactions row when a subscription is inserted
begin;
select plan(6);

create temp table _pgtap_subscription_seed as
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
    'seed_tx_' || gen_random_uuid() || '@local.test',
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
    'pgtap_ws_' || substr(md5(random()::text), 1, 10),
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
    'pgtap seed subscription',
    42.50,
    'monthly',
    'BRL',
    current_date,
    current_date,
    'pix'
  from nw
  cross join nu
  where exists (select 1 from nm)
  returning id
)
select id from ins;

select ok(
  (
    select count(*) = 1::bigint
    from public.transactions t
    join _pgtap_subscription_seed s on s.id = t.subscription_id
  ),
  'AFTER INSERT seed creates exactly one transactions row'
);

select is(
  (
    select t.type::text
    from public.transactions t
    join _pgtap_subscription_seed s on s.id = t.subscription_id
  ),
  'expense',
  'subscription-seeded transaction is expense'
);

select is(
  (
    select t.payment_method::text
    from public.transactions t
    join _pgtap_subscription_seed s on s.id = t.subscription_id
  ),
  'pix',
  'seed copies payment_method into transactions'
);

select ok(
  (
    select (t.amount = 42.50)
    from public.transactions t
    join _pgtap_subscription_seed s on s.id = t.subscription_id
  ),
  'seed copies amount into transactions'
);

select ok(
  (
    select t.subscription_id is not null
      and t.subscription_id = s.id
    from public.transactions t
    join _pgtap_subscription_seed s on s.id = t.subscription_id
  ),
  'seed sets transactions.subscription_id to the new subscription'
);

select ok(
  (
    select
      (t.date at time zone 'utc')::date
      = coalesce(ws.next_billing_date, ws.start_date)
    from public.transactions t
    join _pgtap_subscription_seed s on s.id = t.subscription_id
    join public.workspace_subscriptions ws on ws.id = s.id
  ),
  'seed transaction UTC date matches subscription charge date'
);

select * from finish();
rollback;
