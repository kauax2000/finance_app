-- pgTAP: Bloco 7C — quem pagou, partes, acerto e saldo (20261031130000_divisao.sql).
-- Roda no staging antes de publicar; não roda na CI.
begin;
select plan(16);

-- 1. o algoritmo (Foco de revisão 1) -------------------------------------------
select is(
  (select d.centavos from public.dividir_em_partes(10000, '[
      {"user_id":"00000000-0000-4000-d100-000000000001","weight":1},
      {"user_id":"00000000-0000-4000-d100-000000000002","weight":1},
      {"user_id":"00000000-0000-4000-d100-000000000003","weight":1}
    ]'::jsonb, '00000000-0000-4000-d100-000000000002') d
   where d.user_id = '00000000-0000-4000-d100-000000000002'),
  3334::bigint,
  'R$ 100,00 em três: o centavo que sobra vai para quem pagou'
);

select is(
  (select sum(d.centavos)::bigint from public.dividir_em_partes(10000, '[
      {"user_id":"00000000-0000-4000-d100-000000000001","weight":1},
      {"user_id":"00000000-0000-4000-d100-000000000002","weight":1},
      {"user_id":"00000000-0000-4000-d100-000000000003","weight":1}
    ]'::jsonb, '00000000-0000-4000-d100-000000000002') d),
  10000::bigint,
  'R$ 100,00 em três: a soma fecha'
);

select is(
  (select array_agg(d.centavos order by d.user_id) from public.dividir_em_partes(1000, '[
      {"user_id":"00000000-0000-4000-d100-000000000001","weight":2},
      {"user_id":"00000000-0000-4000-d100-000000000002","weight":1}
    ]'::jsonb, '00000000-0000-4000-d100-000000000002') d),
  array[666, 334]::bigint[],
  'pesos 2 e 1 em R$ 10,00, quem pagou tem peso 1: 6,66 e 3,34'
);

select is(
  (select array_agg(d.centavos order by d.user_id) from public.dividir_em_partes(1000, '[
      {"user_id":"00000000-0000-4000-d100-000000000001","weight":2},
      {"user_id":"00000000-0000-4000-d100-000000000002","weight":1}
    ]'::jsonb, '00000000-0000-4000-d100-000000000001') d),
  array[667, 333]::bigint[],
  'pesos 2 e 1 em R$ 10,00, quem pagou tem peso 2: 6,67 e 3,33'
);

-- 2. a carteira dividida -------------------------------------------------------
-- a1 dono, b2 e c3 membros, g4 convidado de a1.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-d200-000000000001', 'div-a@local.dev', '{"full_name":"Div A"}'),
  ('00000000-0000-4000-d200-000000000002', 'div-b@local.dev', '{"full_name":"Div B"}'),
  ('00000000-0000-4000-d200-000000000003', 'div-c@local.dev', '{"full_name":"Div C"}'),
  ('00000000-0000-4000-d200-000000000004', 'div-g@local.dev', '{"full_name":"Div G"}');

insert into public.workspaces (id, name, type, created_by, split_mode)
values ('00000000-0000-4000-d300-000000000001', 'Casal', 'shared', '00000000-0000-4000-d200-000000000001', 'split');

insert into public.workspace_members (workspace_id, user_id, role, sponsor_user_id) values
  ('00000000-0000-4000-d300-000000000001', '00000000-0000-4000-d200-000000000001', 'owner', null),
  ('00000000-0000-4000-d300-000000000001', '00000000-0000-4000-d200-000000000002', 'member', null),
  ('00000000-0000-4000-d300-000000000001', '00000000-0000-4000-d200-000000000003', 'member', null),
  ('00000000-0000-4000-d300-000000000001', '00000000-0000-4000-d200-000000000004', 'guest', '00000000-0000-4000-d200-000000000001');

-- Sem `paid_by`, como o `main` manda: o banco o preenche e divide.
insert into public.transactions (id, user_id, workspace_id, type, amount, description, payment_method) values
  ('00000000-0000-4000-d400-000000000001', '00000000-0000-4000-d200-000000000001', '00000000-0000-4000-d300-000000000001', 'expense', 100, 'Mercado', 'pix'),
  ('00000000-0000-4000-d400-000000000002', '00000000-0000-4000-d200-000000000004', '00000000-0000-4000-d300-000000000001', 'expense', 30, 'Lanche', 'pix'),
  ('00000000-0000-4000-d400-000000000004', '00000000-0000-4000-d200-000000000003', '00000000-0000-4000-d300-000000000001', 'expense', 60, 'Gás', 'pix');

insert into public.transactions (id, user_id, workspace_id, type, amount, description, payment_method, is_private) values
  ('00000000-0000-4000-d400-000000000003', '00000000-0000-4000-d200-000000000002', '00000000-0000-4000-d300-000000000001', 'expense', 50, 'Presente', 'pix', true);

select is(
  (select sum(amount) from public.transaction_shares where transaction_id = '00000000-0000-4000-d400-000000000001'),
  100.00::numeric,
  'a despesa de R$ 100,00 em três adultos fecha'
);

select is(
  (select amount from public.transaction_shares
   where transaction_id = '00000000-0000-4000-d400-000000000001' and user_id = '00000000-0000-4000-d200-000000000001'),
  33.34::numeric,
  'o centavo que sobra fica com quem pagou'
);

select is(
  (select paid_by from public.transactions where id = '00000000-0000-4000-d400-000000000002'),
  '00000000-0000-4000-d200-000000000001'::uuid,
  'a despesa do convidado é paga pelo sponsor_user_id'
);

select is(
  (select count(*)::int from public.transaction_shares where user_id = '00000000-0000-4000-d200-000000000004'),
  0,
  'o convidado não tem parte nenhuma'
);

select results_eq(
  $$select user_id, amount from public.transaction_shares where transaction_id = '00000000-0000-4000-d400-000000000003'$$,
  $$values ('00000000-0000-4000-d200-000000000002'::uuid, 50.00::numeric)$$,
  'a privada (is_private) tem uma parte só, inteira do autor'
);

select is(
  (select paid_by from public.transactions where id = '00000000-0000-4000-d400-000000000003'),
  '00000000-0000-4000-d200-000000000002'::uuid,
  'quem pagou a privada é o autor'
);

-- 3. as partes à mão -----------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d200-000000000001","role":"authenticated"}', true);

select throws_ok(
  $$select public.definir_partes('00000000-0000-4000-d400-000000000001', '[
      {"user_id":"00000000-0000-4000-d200-000000000001","amount":50},
      {"user_id":"00000000-0000-4000-d200-000000000002","amount":40}
    ]'::jsonb)$$,
  'P0001', 'PARTES_NAO_FECHAM',
  'partes que não somam o valor são recusadas'
);

select public.definir_partes('00000000-0000-4000-d400-000000000001', '[
    {"user_id":"00000000-0000-4000-d200-000000000001","amount":60},
    {"user_id":"00000000-0000-4000-d200-000000000002","amount":40}
  ]'::jsonb);

reset role;
select is(
  (select array_agg(amount order by user_id) from public.transaction_shares
   where transaction_id = '00000000-0000-4000-d400-000000000001'),
  array[60.00, 40.00]::numeric[],
  'as partes à mão que fecham substituem as automáticas'
);

-- 4. os pesos do plano ---------------------------------------------------------
insert into public.workspace_installment_plans (
  id, workspace_id, user_id, total_installments, installment_amount, final_installment_amount, next_billing_date
) values (
  '00000000-0000-4000-d500-000000000001', '00000000-0000-4000-d300-000000000001',
  '00000000-0000-4000-d200-000000000001', 3, 10, 10, public.app_today() + 30
);

select throws_ok(
  $$update public.workspace_installment_plans
    set split_weights = '[
      {"user_id":"00000000-0000-4000-d200-000000000001","weight":1},
      {"user_id":"00000000-0000-4000-d200-000000000001","weight":2}
    ]'::jsonb
    where id = '00000000-0000-4000-d500-000000000001'$$,
  '22023', 'PESOS_INVALIDOS',
  'pesos do plano com pessoa repetida são recusados'
);

-- 5. o saldo fecha, mesmo depois de alguém sair --------------------------------
insert into public.settlements (workspace_id, from_user, to_user, amount, created_by)
values ('00000000-0000-4000-d300-000000000001', '00000000-0000-4000-d200-000000000003',
        '00000000-0000-4000-d200-000000000001', 10, '00000000-0000-4000-d200-000000000001');

delete from public.workspace_members
where workspace_id = '00000000-0000-4000-d300-000000000001'
  and user_id = '00000000-0000-4000-d200-000000000003';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d200-000000000001","role":"authenticated"}', true);

select is(
  (select sum(saldo) from public.saldos_da_carteira('00000000-0000-4000-d300-000000000001')),
  0::numeric,
  'Σ saldo = 0 depois de um membro sair'
);

select is(
  (select saiu from public.saldos_da_carteira('00000000-0000-4000-d300-000000000001')
   where user_id = '00000000-0000-4000-d200-000000000003'),
  true,
  'quem saiu continua no saldo, com saiu'
);

select is(
  (select count(*)::int from public.saldos_da_carteira('00000000-0000-4000-d300-000000000001')
   where user_id = '00000000-0000-4000-d200-000000000004'),
  0,
  'o convidado não entra no saldo'
);

reset role;
select * from finish();
rollback;
