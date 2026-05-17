-- Backfill first scheduled transaction rows for subscriptions that have no matching
-- `transactions` row for their first charge date (next_billing_date / start_date).
--
-- Safe to run multiple times: skips any subscription that already has a row for that
-- UTC calendar date (same convention as seed_subscription_first_transaction + run_subscription_billing).

insert into public.transactions (
  user_id,
  workspace_id,
  wallet_id,
  category_id,
  type,
  amount,
  description,
  date,
  is_recurring,
  recurring_interval,
  subscription_id,
  payment_method,
  payment_credit_card_id
)
select
  ws.user_id,
  ws.workspace_id,
  ws.wallet_id,
  ws.category_id,
  'expense',
  ws.amount,
  ws.name,
  (
    to_char(coalesce(ws.next_billing_date, ws.start_date), 'YYYY-MM-DD')
    || 'T12:00:00Z'
  )::timestamptz,
  false,
  null,
  ws.id,
  ws.payment_method,
  ws.payment_credit_card_id
from public.workspace_subscriptions ws
where coalesce(ws.next_billing_date, ws.start_date) is not null
  and not exists (
    select 1
    from public.transactions t
    where t.subscription_id = ws.id
      and (t.date at time zone 'UTC')::date
        = coalesce(ws.next_billing_date, ws.start_date)
  );
