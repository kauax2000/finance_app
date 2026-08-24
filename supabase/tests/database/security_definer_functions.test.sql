-- pgTAP: security hardening invariants (Fase 1)
begin;
select plan(7);

-- delete_workspace_installment_plan_cascade must fail CLOSED without auth
select throws_ok(
    'select public.delete_workspace_installment_plan_cascade(gen_random_uuid())',
    'Not authenticated',
    'cascade delete raises when auth.uid() is null (was fail-open)'
);

select ok(
    (select prosecdef from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'delete_workspace_installment_plan_cascade'),
    'cascade delete is SECURITY DEFINER'
);

select ok(
    exists (
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'delete_workspace_installment_plan_cascade'
          and exists (
              select 1 from unnest(coalesce(p.proconfig, '{}')) cfg
              where cfg like 'search_path=%'
          )
    ),
    'cascade delete has pinned search_path'
);

-- accept_workspace_invite: exists, definer, pinned search_path, service_role-only
select ok(
    to_regprocedure('public.accept_workspace_invite(text, uuid, text)') is not null,
    'accept_workspace_invite RPC exists'
);

select ok(
    (select prosecdef from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'accept_workspace_invite'),
    'accept_workspace_invite is SECURITY DEFINER'
);

select ok(
    not has_function_privilege(
        'authenticated',
        'public.accept_workspace_invite(text, uuid, text)',
        'execute'
    ),
    'accept_workspace_invite is NOT executable by authenticated (service_role only)'
);

-- cleanup_expired_sessions locked down (skips cleanly when absent pre-baseline)
select ok(
    to_regprocedure('public.cleanup_expired_sessions()') is null
    or not has_function_privilege(
        'anon', 'public.cleanup_expired_sessions()', 'execute'
    ),
    'cleanup_expired_sessions is not executable by anon'
);

select * from finish();
rollback;
