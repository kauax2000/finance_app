-- pgTAP: ensure the charging function copies payment fields (regression test)
-- A partir da Fase 4, a cobrança vive em charge_subscription_cycle;
-- run_subscription_billing e catch_up_recurring_billing são wrappers.
begin;
select plan(3);

select ok(
    position('r.payment_method' in pg_get_functiondef('public.charge_subscription_cycle(uuid)'::regprocedure)) > 0,
    'charge_subscription_cycle copies payment_method from subscription'
);

select ok(
    position('r.payment_credit_card_id' in pg_get_functiondef('public.charge_subscription_cycle(uuid)'::regprocedure)) > 0,
    'charge_subscription_cycle copies payment_credit_card_id from subscription'
);

select ok(
    position('charge_subscription_cycle' in pg_get_functiondef('public.run_subscription_billing()'::regprocedure)) > 0,
    'run_subscription_billing delegates to charge_subscription_cycle'
);

select * from finish();
rollback;
