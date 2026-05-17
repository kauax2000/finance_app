-- Fix stale workspace_subscriptions payment_method constraints.
--
-- Some environments already have `workspace_subscriptions_payment_method_check` created
-- with an outdated allowed list (e.g. missing 'credit_card'). The original migration only
-- adds the constraint if it doesn't exist, so it never gets corrected.
--
-- This migration drops and recreates the constraints with the current canonical set
-- used by the app (`src/lib/supabase.ts` TransactionPaymentMethod).

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'workspace_subscriptions_payment_method_check'
  ) then
    alter table public.workspace_subscriptions
      drop constraint workspace_subscriptions_payment_method_check;
  end if;
end $$;

alter table public.workspace_subscriptions
  add constraint workspace_subscriptions_payment_method_check
  check (
    payment_method is null
    or payment_method in ('pix', 'ted', 'debit_card', 'credit_card', 'cash', 'other')
  );

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'workspace_subscriptions_payment_card_matches'
  ) then
    alter table public.workspace_subscriptions
      drop constraint workspace_subscriptions_payment_card_matches;
  end if;
end $$;

alter table public.workspace_subscriptions
  add constraint workspace_subscriptions_payment_card_matches
  check (
    payment_credit_card_id is null or payment_method = 'credit_card'
  );

