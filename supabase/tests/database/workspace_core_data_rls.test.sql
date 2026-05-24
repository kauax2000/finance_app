-- pgTAP: workspace-scoped RLS on core financial tables (shared wallet members)
begin;
select plan(8);

select ok(
    exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'transactions'
          and policyname = 'Workspace members can view transactions'
    ),
    'RLS select policy on transactions (workspace members)'
);

select ok(
    exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'categories'
          and policyname = 'Workspace members can view categories'
    ),
    'RLS select policy on categories (workspace members)'
);

select ok(
    not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'transactions'
          and policyname = 'Users can view own transactions'
    ),
    'legacy user_id-only transactions SELECT policy removed'
);

select ok(
    not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'categories'
          and policyname = 'Users can view own categories'
    ),
    'legacy user_id-only categories SELECT policy removed'
);

select ok(
    exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'transaction_splits'
          and policyname = 'Workspace members can view splits'
    ),
    'RLS select policy on transaction_splits (workspace members)'
);

select ok(
    exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'budgets'
          and policyname = 'Workspace members can view budgets'
    ),
    'RLS select policy on budgets (workspace members)'
);

select has_function(
    'public',
    'is_workspace_member',
    array['uuid'],
    'public.is_workspace_member(uuid) exists'
);

select ok(
    exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'transactions'
          and policyname = 'Workspace members can insert transactions'
    ),
    'RLS insert policy on transactions (workspace members)'
);

select * from finish();
rollback;
