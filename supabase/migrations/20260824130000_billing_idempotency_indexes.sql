-- Hard idempotency backstop for recurring billing (double-charge protection).
--
-- Three writers can generate the same subscription charge concurrently:
-- pg_cron / edge `run_subscription_billing`, the dashboard-triggered
-- `catch_up_recurring_billing`, and the `seed_subscription_first_transaction`
-- trigger. Their only guard was a read-then-insert `NOT EXISTS` on
-- (subscription_id, UTC day) with no unique index behind it — two concurrent
-- transactions both pass the check and both insert.
--
-- These unique partial indexes make duplicates impossible at the DB level.
-- The billing functions switch to `ON CONFLICT DO NOTHING` in the follow-up
-- migration (20260824131000).

-- Cleanup first: a unique index build fails if history already holds
-- duplicates. Keep the earliest row of each (subscription_id, UTC day) /
-- (plan, sequence) group; report what was removed.
do $$
declare
  v_sub_dupes int;
  v_inst_dupes int;
begin
  with ranked as (
    select id,
           row_number() over (
             partition by subscription_id, ((date at time zone 'UTC')::date)
             order by created_at asc, id asc
           ) as rn
    from public.transactions
    where subscription_id is not null
  )
  delete from public.transactions t
  using ranked
  where t.id = ranked.id and ranked.rn > 1;
  get diagnostics v_sub_dupes = row_count;

  with ranked as (
    select id,
           row_number() over (
             partition by installment_plan_id, installment_sequence
             order by created_at asc, id asc
           ) as rn
    from public.transactions
    where installment_plan_id is not null
      and installment_sequence is not null
  )
  delete from public.transactions t
  using ranked
  where t.id = ranked.id and ranked.rn > 1;
  get diagnostics v_inst_dupes = row_count;

  if v_sub_dupes > 0 or v_inst_dupes > 0 then
    raise notice 'billing_idempotency_indexes: removed % duplicate subscription charge(s), % duplicate installment charge(s)',
      v_sub_dupes, v_inst_dupes;
  end if;
end;
$$;

-- One charge per subscription per UTC calendar day (matches the functions'
-- `(date at time zone 'UTC')::date` guard expression exactly, so it can be
-- used as an ON CONFLICT arbiter).
create unique index if not exists transactions_subscription_charge_unique
  on public.transactions (subscription_id, ((date at time zone 'UTC')::date))
  where subscription_id is not null;

-- One row per installment sequence of a plan. Sequence is the true identity
-- of a parcel; the plan-row FOR UPDATE in charge_workspace_installment_plan_step
-- already serializes writers — this is the backstop.
create unique index if not exists transactions_installment_seq_unique
  on public.transactions (installment_plan_id, installment_sequence)
  where installment_plan_id is not null and installment_sequence is not null;
