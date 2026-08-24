-- pgTAP: next_subscription_billing_date contra os vetores dourados
-- (src/lib/fixtures/billing-calendar-vectors.json — manter em sincronia).
begin;
select plan(13);

select is(public.next_subscription_billing_date('2026-01-15', 'weekly'),    '2026-01-22'::date, 'weekly 2026-01-15');
select is(public.next_subscription_billing_date('2026-12-28', 'weekly'),    '2027-01-04'::date, 'weekly year wrap');
select is(public.next_subscription_billing_date('2026-01-15', 'monthly'),   '2026-02-15'::date, 'monthly mid-month');
select is(public.next_subscription_billing_date('2026-01-31', 'monthly'),   '2026-02-28'::date, 'monthly month-end clamp');
select is(public.next_subscription_billing_date('2024-01-31', 'monthly'),   '2024-02-29'::date, 'monthly leap clamp');
select is(public.next_subscription_billing_date('2026-12-31', 'monthly'),   '2027-01-31'::date, 'monthly year wrap');
select is(public.next_subscription_billing_date('2026-08-31', 'monthly'),   '2026-09-30'::date, 'monthly 31->30 clamp');
select is(public.next_subscription_billing_date('2026-01-31', 'bimonthly'), '2026-03-31'::date, 'bimonthly');
select is(public.next_subscription_billing_date('2026-11-30', 'bimonthly'), '2027-01-30'::date, 'bimonthly year wrap');
select is(public.next_subscription_billing_date('2026-12-31', 'bimonthly'), '2027-02-28'::date, 'bimonthly feb clamp');
select is(public.next_subscription_billing_date('2026-02-28', 'yearly'),    '2027-02-28'::date, 'yearly');
select is(public.next_subscription_billing_date('2024-02-29', 'yearly'),    '2025-02-28'::date, 'yearly leap clamp');

-- app_today: dia-calendário em America/Sao_Paulo
select is(
    public.app_today(),
    (now() at time zone 'America/Sao_Paulo')::date,
    'app_today follows America/Sao_Paulo'
);

select * from finish();
rollback;
