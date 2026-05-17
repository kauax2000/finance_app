-- pgTAP: billing job is callable and returns a non-negative integer (plan §4 smoke)
begin;
select plan(2);

select lives_ok(
    'select public.run_subscription_billing()',
    'run_subscription_billing executes without error'
);

select ok(
    (select public.run_subscription_billing()) >= 0,
    'run_subscription_billing returns non-negative count'
);

select * from finish();
rollback;
