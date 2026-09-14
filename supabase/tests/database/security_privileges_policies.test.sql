-- pgTAP: Fase 1a — privilégios de função, políticas e integridade.
begin;
select plan(18);

-- ─── Fixtures ───────────────────────────────────────────────────────────────
-- `handle_new_user` cria perfil, carteira pessoal e membro para cada usuário.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-a000-000000000001', 'qa1@local.dev', '{"full_name":"QA Um"}'),
  ('00000000-0000-4000-a000-000000000002', 'qa2@local.dev', '{"full_name":"QA Dois"}');

-- w1: criada por qa1, hoje só com qa2 como owner (qa1 foi removido).
-- w2: criada por qa1, ainda sem nenhum membro.
insert into public.workspaces (id, name, type, created_by) values
  ('00000000-0000-4000-b000-000000000001', 'QA compartilhada', 'shared', '00000000-0000-4000-a000-000000000001'),
  ('00000000-0000-4000-b000-000000000002', 'QA nova', 'shared', '00000000-0000-4000-a000-000000000001');
insert into public.workspace_members (workspace_id, user_id, role) values
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000002', 'owner');

-- ─── Privilégios de função ──────────────────────────────────────────────────
select ok(
  not bool_or(has_function_privilege(r, f, 'execute')),
  'funções só do servidor não são executáveis por anon nem authenticated'
)
from unnest(array['anon', 'authenticated']) as r,
     unnest(array[
       'public.run_installment_billing()',
       'public.run_subscription_billing()',
       'public.charge_workspace_installment_plan_step(uuid)'
     ]) as f;

select ok(
  not bool_or(has_function_privilege('anon', f, 'execute')),
  'RPCs do app logado não são executáveis por anon'
)
from unnest(array[
  'public.catch_up_recurring_billing()',
  'public.complete_workspace_categories_onboarding(uuid)',
  'public.create_workspace_installment_plan(uuid,uuid,text,text,uuid,integer,numeric,numeric,date)',
  'public.delete_workspace_installment_plan_cascade(uuid)',
  'public.delete_workspace(uuid)',
  'public.get_workspace_delete_impact(uuid)'
]) as f;

select ok(
  bool_and(has_function_privilege('authenticated', f, 'execute')),
  'RPCs do app logado seguem executáveis por authenticated'
)
from unnest(array[
  'public.catch_up_recurring_billing()',
  'public.complete_workspace_categories_onboarding(uuid)',
  'public.create_workspace_installment_plan(uuid,uuid,text,text,uuid,integer,numeric,numeric,date)',
  'public.delete_workspace_installment_plan_cascade(uuid)',
  'public.delete_workspace(uuid)',
  'public.get_workspace_delete_impact(uuid)'
]) as f;

select is(
  array(
    select p.proname::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and has_function_privilege('anon', p.oid, 'execute')
      and p.proname not in ('is_workspace_member', 'is_workspace_owner', 'workspace_role')
    order by 1
  ),
  '{}'::text[],
  'nenhuma security definer executável por anon fora das usadas nas políticas'
);

create function public.__qa_probe_default_privileges() returns int language sql as 'select 1';
select ok(
  not has_function_privilege('anon', 'public.__qa_probe_default_privileges()', 'execute')
  and not has_function_privilege('authenticated', 'public.__qa_probe_default_privileges()', 'execute'),
  'função nova nasce sem EXECUTE para anon e authenticated'
);

-- ─── Políticas ──────────────────────────────────────────────────────────────
select is(
  array(select cmd::text from pg_policies where schemaname = 'public' and tablename = 'user_sessions' order by 1),
  array['SELECT'],
  'user_sessions: só SELECT pela API'
);

select is(
  array(select cmd::text from pg_policies where schemaname = 'public' and tablename = 'user_activity_logs' order by 1),
  array['SELECT'],
  'user_activity_logs: só SELECT pela API'
);

-- ─── Membros ────────────────────────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-a000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000001","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.workspace_members (workspace_id, user_id, role)
    values ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000001', 'owner')$$,
  'criador se insere como owner na carteira ainda vazia'
);

select throws_ok(
  $$insert into public.workspace_members (workspace_id, user_id, role)
    values ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000001', 'owner')$$,
  '42501',
  null,
  'criador removido não se reinsere como owner'
);

select throws_ok(
  $$insert into public.transactions (workspace_id, user_id, type, amount, description)
    select w.id, '00000000-0000-4000-a000-000000000002', 'expense', 10, 'QA autor forjado'
    from public.workspaces w
    where w.created_by = '00000000-0000-4000-a000-000000000001' and w.type = 'personal'$$,
  '42501',
  null,
  'INSERT com user_id de outra pessoa é recusado'
);

reset role;

select throws_ok(
  $$delete from public.workspace_members
    where workspace_id = '00000000-0000-4000-b000-000000000001'
      and user_id = '00000000-0000-4000-a000-000000000002'$$,
  'P0001',
  'WORKSPACE_LAST_OWNER',
  'carteira não fica sem owner'
);

select throws_ok(
  $$update public.workspace_members
    set user_id = '00000000-0000-4000-a000-000000000001'
    where workspace_id = '00000000-0000-4000-b000-000000000001'$$,
  'P0001',
  'WORKSPACE_MEMBER_IMMUTABLE_KEYS',
  'chaves do membro são imutáveis'
);

select lives_ok(
  $$delete from public.workspaces where id = '00000000-0000-4000-b000-000000000001'$$,
  'excluir a carteira apaga o último owner em cascata'
);

-- ─── Autoria e integridade ──────────────────────────────────────────────────
insert into public.transactions (id, workspace_id, user_id, type, amount, description)
select '00000000-0000-4000-c000-000000000001', w.id, '00000000-0000-4000-a000-000000000001', 'expense', 10, 'QA autoria'
from public.workspaces w
where w.created_by = '00000000-0000-4000-a000-000000000001' and w.type = 'personal';

update public.transactions
set user_id = '00000000-0000-4000-a000-000000000002', amount = 20
where id = '00000000-0000-4000-c000-000000000001';

select is(
  (select user_id from public.transactions where id = '00000000-0000-4000-c000-000000000001'),
  '00000000-0000-4000-a000-000000000001'::uuid,
  'UPDATE preserva o autor original'
);

select ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.transactions'::regclass and tgname = 'set_transactions_updated_at'
  ),
  'transactions tem trigger de updated_at'
);

insert into public.categories (id, workspace_id, user_id, name, type)
select '00000000-0000-4000-d000-000000000002', w.id, '00000000-0000-4000-a000-000000000002', 'QA categoria de outra carteira', 'expense'
from public.workspaces w
where w.created_by = '00000000-0000-4000-a000-000000000002' and w.type = 'personal';

select throws_ok(
  $$insert into public.transactions (workspace_id, user_id, type, amount, description, category_id)
    select w.id, '00000000-0000-4000-a000-000000000001', 'expense', 10, 'QA cruzada', '00000000-0000-4000-d000-000000000002'
    from public.workspaces w
    where w.created_by = '00000000-0000-4000-a000-000000000001' and w.type = 'personal'$$,
  '23503',
  'CROSS_WORKSPACE_REFERENCE',
  'transação não aponta para categoria de outra carteira'
);

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'email', 'UPDATE'),
  'profiles.email não é editável pela API'
);

select ok(
  has_column_privilege('authenticated', 'public.profiles', 'full_name', 'UPDATE'),
  'profiles.full_name segue editável'
);

select * from finish();
rollback;
