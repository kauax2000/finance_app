-- pgTAP: Fase 6C.8 — carteira compartilhada nasce com o dono, ou não nasce.
begin;
select plan(6);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-f500-000000000001', 'cw1@local.dev', '{"full_name":"Cria Um"}');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-f500-000000000001","role":"authenticated"}', true);

select isnt(
  (public.create_shared_workspace('Casa', 'home', '#2563EB')).id,
  null,
  'cria a carteira e devolve a linha'
);

reset role;
select is(
  (select count(*)::int from public.workspaces
   where created_by = '00000000-0000-4000-f500-000000000001' and type = 'shared'),
  1,
  'uma carteira compartilhada'
);

select is(
  (select m.role from public.workspace_members m
   join public.workspaces w on w.id = m.workspace_id
   where w.created_by = '00000000-0000-4000-f500-000000000001' and w.type = 'shared'
     and m.user_id = '00000000-0000-4000-f500-000000000001'),
  'owner',
  'quem cria é owner na mesma chamada'
);

set local role authenticated;
select throws_ok(
  $$select public.create_shared_workspace('Ruim', 'icone-que-nao-existe', '#000000')$$,
  '23514', null,
  'ícone fora da lista é recusado'
);

reset role;
select is(
  (select count(*)::int from public.workspaces
   where created_by = '00000000-0000-4000-f500-000000000001' and type = 'shared'),
  1,
  'e não sobra carteira pela metade'
);

select ok(
  not has_function_privilege('anon', 'public.create_shared_workspace(text, text, text)', 'execute'),
  'a chave anônima não executa'
);

select * from finish();
rollback;
