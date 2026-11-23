-- pgTAP: o histórico do lançamento inteligente agrega a carteira em 24 meses.
begin;
select plan(5);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-f400-000000000001', 'hist1@local.dev', '{"full_name":"Hist Um"}'),
  ('00000000-0000-4000-f400-000000000002', 'hist2@local.dev', '{"full_name":"Hist Dois"}'),
  ('00000000-0000-4000-f400-000000000003', 'hist3@local.dev', '{"full_name":"Hist Tres"}');

-- A carteira pessoal de hist1; hist2 lança nela como convidado.
create temp table _ws on commit drop as
  select w.id from public.workspaces w
  where w.created_by = '00000000-0000-4000-f400-000000000001' and w.type = 'personal';
grant select on _ws to authenticated;

insert into public.transactions (workspace_id, user_id, type, amount, description, date)
select (select id from _ws), u, 'expense', 10, d, now() - make_interval(months => m)
from (values
  ('00000000-0000-4000-f400-000000000001'::uuid, 'Mercado', 1),
  ('00000000-0000-4000-f400-000000000001'::uuid, 'Mercado', 2),
  ('00000000-0000-4000-f400-000000000001'::uuid, 'Mercado', 3),
  ('00000000-0000-4000-f400-000000000001'::uuid, 'Antigo', 30),
  ('00000000-0000-4000-f400-000000000002'::uuid, 'Do convidado', 1)
) as v(u, d, m);

select is(
  (select n from public.historico_da_frase((select id from _ws)) where description = 'Mercado'),
  3,
  'agrega a mesma descrição em n'
);

select is(
  (select count(*)::int from public.historico_da_frase((select id from _ws)) where description = 'Antigo'),
  0,
  'o que passou de 24 meses fica de fora'
);

select is(
  (select array_agg(description) from public.historico_da_frase((select id from _ws), '00000000-0000-4000-f400-000000000002')),
  array['Do convidado'],
  'com p_user_id, só as linhas da pessoa'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-f400-000000000001","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.historico_da_frase((select id from _ws))),
  2,
  'o dono da carteira vê o histórico dela'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-f400-000000000003","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.historico_da_frase((select id from _ws))),
  0,
  'quem é de outra carteira não vê nada (RLS)'
);

reset role;
select * from finish();
rollback;
