-- pgTAP: Fase 2 — excluir a conta apaga tudo numa transação, e os guardas
-- continuam barrando fora da cascata.
begin;
select plan(7);

-- `handle_new_user` cria perfil, carteira pessoal, membro e categorias.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-c000-000000000001', 'del1@local.dev', '{"full_name":"Del Um"}'),
  ('00000000-0000-4000-c000-000000000002', 'del2@local.dev', '{"full_name":"Del Dois"}');

-- Carteira compartilhada criada por del1, com del2 dentro e um lançamento de del2.
insert into public.workspaces (id, name, type, created_by) values
  ('00000000-0000-4000-d000-000000000001', 'Del compartilhada', 'shared',
   '00000000-0000-4000-c000-000000000001');
insert into public.workspace_members (workspace_id, user_id, role) values
  ('00000000-0000-4000-d000-000000000001', '00000000-0000-4000-c000-000000000001', 'owner'),
  ('00000000-0000-4000-d000-000000000001', '00000000-0000-4000-c000-000000000002', 'member');
insert into public.transactions (user_id, workspace_id, type, amount, description, date) values
  ('00000000-0000-4000-c000-000000000002', '00000000-0000-4000-d000-000000000001',
   'expense', 10, 'lançamento de del2', now());

select throws_ok(
  $$delete from public.workspaces
    where created_by = '00000000-0000-4000-c000-000000000002' and type = 'personal'$$,
  'P0001', 'WORKSPACE_PERSONAL_IMMUTABLE',
  'carteira pessoal de quem existe continua impossível de apagar'
);

select throws_ok(
  $$delete from public.workspace_members
    where workspace_id = '00000000-0000-4000-d000-000000000001'
      and user_id = '00000000-0000-4000-c000-000000000001'$$,
  'P0001', 'WORKSPACE_LAST_OWNER',
  'último dono continua impossível de remover'
);

select lives_ok(
  $$delete from auth.users where id = '00000000-0000-4000-c000-000000000001'$$,
  'excluir a conta conclui'
);

select is(
  (select count(*)::int from public.workspaces
   where created_by = '00000000-0000-4000-c000-000000000001'),
  0,
  'carteiras criadas pela pessoa somem, pessoal e compartilhada'
);

select is(
  (select count(*)::int from public.transactions
   where workspace_id = '00000000-0000-4000-d000-000000000001'),
  0,
  'lançamentos de outros membros na carteira compartilhada somem junto'
);

select is(
  (select count(*)::int from public.profiles where id = '00000000-0000-4000-c000-000000000001')
  + (select count(*)::int from public.categories where user_id = '00000000-0000-4000-c000-000000000001')
  + (select count(*)::int from public.workspace_members where user_id = '00000000-0000-4000-c000-000000000001'),
  0,
  'nenhuma linha órfã da pessoa'
);

select is(
  (select count(*)::int from public.workspaces
   where created_by = '00000000-0000-4000-c000-000000000002' and type = 'personal'),
  1,
  'a carteira pessoal do outro membro fica'
);

select * from finish();
rollback;
