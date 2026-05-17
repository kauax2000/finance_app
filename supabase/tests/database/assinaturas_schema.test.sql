-- pgTAP: schema objects for Assinaturas (plan §6–7 static checks)
begin;
select plan(16);

select has_table('public', 'workspace_subscriptions', 'workspace_subscriptions table exists');

select has_column(
    'public',
    'workspace_subscriptions',
    'next_billing_date',
    'workspace_subscriptions.next_billing_date exists'
);

select has_column(
    'public',
    'workspace_subscriptions',
    'payment_method',
    'workspace_subscriptions.payment_method exists'
);

select has_column(
    'public',
    'workspace_subscriptions',
    'payment_credit_card_id',
    'workspace_subscriptions.payment_credit_card_id exists'
);

select has_column(
    'public',
    'transactions',
    'subscription_id',
    'transactions.subscription_id exists'
);

select has_function(
    'public',
    'run_subscription_billing',
    array[]::text[],
    'public.run_subscription_billing() exists'
);

select has_function(
    'public',
    'seed_subscription_first_transaction',
    array[]::text[],
    'public.seed_subscription_first_transaction() exists'
);

select ok(
    exists (
        select 1
        from pg_trigger tg
        join pg_class c on c.oid = tg.tgrelid
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = 'workspace_subscriptions'
          and tg.tgname = 'seed_workspace_subscription_first_transaction'
          and not tg.tgisinternal
    ),
    'AFTER INSERT trigger seed_workspace_subscription_first_transaction exists'
);

select ok(
    exists(
        select 1
        from pg_constraint
        where conname = 'transactions_subscription_id_fkey'
    ),
    'FK transactions_subscription_id_fkey exists'
);

select ok(
    exists(
        select 1
        from pg_constraint
        where conname = 'transactions_subscription_expense_only'
    ),
    'CHECK transactions_subscription_expense_only exists'
);

select ok(
    exists(
        select 1
        from pg_constraint
        where conname = 'transactions_subscription_installment_exclusive'
    ),
    'CHECK transactions_subscription_installment_exclusive exists'
);

select ok(
    exists(
        select 1
        from pg_constraint
        where conname = 'workspace_subscriptions_payment_method_check'
    ),
    'CHECK workspace_subscriptions_payment_method_check exists'
);

select ok(
    exists(
        select 1
        from pg_constraint
        where conname = 'workspace_subscriptions_payment_card_matches'
    ),
    'CHECK workspace_subscriptions_payment_card_matches exists'
);

select ok(
    exists(
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'workspace_subscriptions'
          and policyname = 'Workspace members can view workspace_subscriptions'
    ),
    'RLS select policy on workspace_subscriptions exists'
);

select ok(
    exists(
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'workspace_subscriptions'
          and policyname = 'Workspace members can insert workspace_subscriptions'
    ),
    'RLS insert policy on workspace_subscriptions exists'
);

select ok(
    exists(
        select 1
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'run_subscription_billing'
          and p.prosecdef = true
    ),
    'run_subscription_billing is SECURITY DEFINER'
);

select * from finish();
rollback;
