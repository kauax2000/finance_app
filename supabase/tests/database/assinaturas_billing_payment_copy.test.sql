-- pgTAP: ensure billing function copies payment fields (regression test)
begin;
select plan(2);

select ok(
    position('r.payment_method' in pg_get_functiondef('public.run_subscription_billing()'::regprocedure)) > 0,
    'run_subscription_billing copies payment_method from subscription'
);

select ok(
    position('r.payment_credit_card_id' in pg_get_functiondef('public.run_subscription_billing()'::regprocedure)) > 0,
    'run_subscription_billing copies payment_credit_card_id from subscription'
);

select * from finish();
rollback;

