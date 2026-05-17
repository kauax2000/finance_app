-- If installment plans ran before subscription billing, `subscription_id` may not have existed yet
-- and `transactions_subscription_installment_exclusive` was skipped. Add it when both columns exist.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'subscription_id'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'installment_plan_id'
  ) then
    if not exists (
      select 1 from pg_constraint where conname = 'transactions_subscription_installment_exclusive'
    ) then
      alter table public.transactions
        add constraint transactions_subscription_installment_exclusive
        check (
          subscription_id is null or installment_plan_id is null
        );
    end if;
  end if;
end $$;
