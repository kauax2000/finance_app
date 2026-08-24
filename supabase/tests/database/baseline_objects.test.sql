-- pgTAP: the baseline migration builds every core object from scratch
begin;
select plan(24);

-- Core tables (previously scattered across loose SQL files)
select has_table('public', 'profiles',                            'profiles exists');
select has_table('public', 'categories',                          'categories exists');
select has_table('public', 'transactions',                        'transactions exists');
select has_table('public', 'transaction_splits',                  'transaction_splits exists');
select has_table('public', 'budgets',                             'budgets exists');
select has_table('public', 'workspaces',                          'workspaces exists');
select has_table('public', 'workspace_members',                   'workspace_members exists');
select has_table('public', 'workspace_invites',                   'workspace_invites exists');
select has_table('public', 'workspace_member_notification_prefs', 'notification prefs exists');
select has_table('public', 'notifications',                       'notifications exists');
select has_table('public', 'user_settings',                       'user_settings exists');
select has_table('public', 'user_sessions',                       'user_sessions exists');
select has_table('public', 'user_activity_logs',                  'user_activity_logs exists');
select has_table('public', 'workspace_subscriptions',             'workspace_subscriptions exists');
select has_table('public', 'workspace_installment_plans',         'workspace_installment_plans exists');
select has_table('public', 'bills',                               'bills exists');
select has_table('public', 'credit_cards',                        'credit_cards exists');

-- RLS enabled on the financial core
select ok(
    (select bool_and(relrowsecurity) from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname in ('transactions','categories','budgets','workspaces','workspace_members')),
    'RLS enabled on core tables'
);

-- Helper functions + business RPCs
select ok(to_regprocedure('public.is_workspace_member(uuid)') is not null, 'is_workspace_member exists');
select ok(to_regprocedure('public.delete_workspace(uuid)') is not null, 'delete_workspace exists');
select ok(to_regprocedure('public.run_subscription_billing()') is not null, 'run_subscription_billing exists');
select ok(to_regprocedure('public.catch_up_recurring_billing()') is not null, 'catch_up_recurring_billing exists');

-- Triggers that lived only in loose files
select ok(
    exists (
        select 1 from pg_trigger t
        join pg_class c on c.oid = t.tgrelid
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'auth' and c.relname = 'users'
          and t.tgname = 'on_auth_user_created'
    ),
    'on_auth_user_created trigger on auth.users'
);

select ok(
    exists (
        select 1 from pg_trigger t
        join pg_class c on c.oid = t.tgrelid
        where c.relname = 'workspaces' and t.tgname ilike '%before_delete%'
    ),
    'workspaces before-delete guard trigger'
);

select * from finish();
rollback;
