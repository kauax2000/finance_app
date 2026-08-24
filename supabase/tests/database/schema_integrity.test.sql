-- pgTAP: integridade do schema (Fase 5)
begin;
select plan(10);

-- workspace_id NOT NULL nas tabelas financeiras core
select col_not_null('public', 'transactions', 'workspace_id', 'transactions.workspace_id NOT NULL');
select col_not_null('public', 'categories',   'workspace_id', 'categories.workspace_id NOT NULL');
select col_not_null('public', 'budgets',      'workspace_id', 'budgets.workspace_id NOT NULL');

-- FK de transactions para workspaces agora é CASCADE
select is(
    (select confdeltype from pg_constraint
     where conname = 'transactions_workspace_id_fkey'),
    'c',
    'transactions.workspace_id FK is ON DELETE CASCADE'
);

-- Unicidade de budgets por workspace/categoria/mês
select ok(
    exists (
        select 1 from pg_indexes
        where schemaname = 'public'
          and indexname = 'budgets_workspace_category_period_unique'
    ),
    'budgets unique per (workspace, category, period_start)'
);

select ok(
    not exists (
        select 1 from pg_indexes
        where schemaname = 'public'
          and indexname = 'idx_budgets_user_category_period'
    ),
    'legacy per-user budget unique index removed'
);

-- Checks de sanidade validados
select ok(
    (select convalidated from pg_constraint where conname = 'transactions_amount_positive'),
    'transactions.amount > 0 validated'
);

select throws_like(
    $sql$insert into public.bill_instances
      (workspace_id, user_id, bill_id, due_date, status, paid_at)
      values (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
              current_date, 'paid', null)$sql$,
    '%bill_instances_paid_requires_paid_at%',
    'paid bill instance without paid_at is rejected'
);

-- client_id por workspace (não mais global)
select ok(
    exists (
        select 1 from pg_constraint
        where conname = 'transactions_workspace_client_id_key'
    ),
    'transactions client_id unique per workspace'
);

select ok(
    not exists (
        select 1 from pg_constraint
        where conname = 'transactions_client_id_key'
    ),
    'global transactions client_id unique removed'
);

select * from finish();
rollback;
