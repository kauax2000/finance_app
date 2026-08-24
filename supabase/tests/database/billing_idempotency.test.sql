-- pgTAP: recurring-billing idempotency (unique arbiter + ON CONFLICT guards)
begin;
select plan(6);

-- Fixture: user + personal workspace + monthly subscription due in the past.
create temp table _bill_fix as
with nu as (
  insert into auth.users (id, aud, role, email, encrypted_password,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
  values (gen_random_uuid(), 'authenticated', 'authenticated',
    'billing_idem_' || gen_random_uuid() || '@local.test', '', '{}', '{}', now(), now(), false, false)
  returning id
),
nw as (
  insert into public.workspaces (name, type, created_by)
  select 'pgtap_bill_ws_' || substr(md5(random()::text), 1, 8), 'personal', id from nu
  returning id, created_by
),
nm as (
  insert into public.workspace_members (workspace_id, user_id, role)
  select id, created_by, 'owner' from nw
  on conflict do nothing
  returning workspace_id
),
sub as (
  insert into public.workspace_subscriptions (
    workspace_id, user_id, name, amount, billing_interval, currency,
    start_date, next_billing_date, is_active
  )
  select nw.id, nw.created_by, 'pgtap-idem-sub', 42.90, 'monthly', 'BRL',
    (current_date - interval '40 days')::date,
    (current_date - interval '10 days')::date,
    true
  from nw
  returning id, workspace_id, user_id, next_billing_date
)
select
  (select id from sub) as sub_id,
  (select workspace_id from sub) as workspace_id,
  (select user_id from sub) as user_id,
  (select next_billing_date from sub) as due_date;

-- The seed trigger charges coalesce(next_billing_date, start_date) on insert.
select is(
  (select count(*)::int from public.transactions
   where subscription_id = (select sub_id from _bill_fix)),
  1,
  'seed trigger created exactly one charge'
);

-- Unique arbiter blocks a direct duplicate for the same UTC day.
select throws_like(
  format(
    $sql$insert into public.transactions
      (user_id, workspace_id, type, amount, description, date, subscription_id)
      values ('%s', '%s', 'expense', 42.90, 'dup',
        ((to_char((select due_date from _bill_fix), 'YYYY-MM-DD') || 'T12:00:00Z')::timestamptz),
        '%s')$sql$,
    (select user_id from _bill_fix),
    (select workspace_id from _bill_fix),
    (select sub_id from _bill_fix)
  ),
  '%transactions_subscription_charge_unique%',
  'duplicate subscription charge for the same day violates the unique index'
);

-- run_subscription_billing charges the due date once and advances.
select ok(
  (select public.run_subscription_billing()) >= 0,
  'run_subscription_billing executes'
);

select is(
  (select count(*)::int from public.transactions
   where subscription_id = (select sub_id from _bill_fix)
     and (date at time zone 'UTC')::date = (select due_date from _bill_fix)),
  1,
  'exactly one charge exists for the due date after the billing run'
);

-- Rewind next_billing_date to the already-charged day and re-run: the
-- ON CONFLICT arbiter absorbs it (no duplicate, no error).
update public.workspace_subscriptions
set next_billing_date = (select due_date from _bill_fix)
where id = (select sub_id from _bill_fix);

select lives_ok(
  'select public.run_subscription_billing()',
  're-running billing over an already-charged date does not error'
);

select is(
  (select count(*)::int from public.transactions
   where subscription_id = (select sub_id from _bill_fix)
     and (date at time zone 'UTC')::date = (select due_date from _bill_fix)),
  1,
  'still exactly one charge for that date (ON CONFLICT DO NOTHING)'
);

select * from finish();
rollback;
