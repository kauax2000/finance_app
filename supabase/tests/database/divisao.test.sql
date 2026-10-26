-- pgTAP: Bloco 7C — quem pagou, partes, acerto e saldo (20261031130000_divisao.sql).
-- Roda no staging antes de publicar; não roda na CI.
-- Supõe a cobrança sem `billing_settings.enforced_since`, como os outros
-- testes: depois do primeiro `set_config`, os claims seguem valendo mesmo com
-- `reset role`, e o `garantir_escrita` consulta o plano da carteira.
begin;
select plan(32);

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

select throws_ok(
  $$select public.definir_partes('00000000-0000-4000-d400-000000000001', '[
      {"user_id":"nao-e-um-uuid","amount":"abc"}
    ]'::jsonb)$$,
  '22023', 'PARTES_INVALIDAS',
  'partes malformadas saem como PARTES_INVALIDAS, e não como o 22P02 do cast'
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

set local role authenticated;
select public.definir_partes('00000000-0000-4000-d400-000000000001', null);
reset role;

select is(
  (select array_agg(amount order by user_id) from public.transaction_shares
   where transaction_id = '00000000-0000-4000-d400-000000000001'),
  array[33.34, 33.33, 33.33]::numeric[],
  'definir_partes com nulo volta ao automático'
);

-- 4. os pesos do plano ---------------------------------------------------------
insert into public.workspace_installment_plans (
  id, workspace_id, user_id, total_installments, installment_amount, final_installment_amount, next_billing_date
) values (
  '00000000-0000-4000-d500-000000000001', '00000000-0000-4000-d300-000000000001',
  '00000000-0000-4000-d200-000000000001', 3, 10, 10, public.app_today() + 30
);

-- Duas parcelas: a 5 automática, a 6 à mão.
insert into public.transactions (id, user_id, workspace_id, type, amount, description, payment_method, installment_plan_id, installment_sequence) values
  ('00000000-0000-4000-d400-000000000005', '00000000-0000-4000-d200-000000000001', '00000000-0000-4000-d300-000000000001', 'expense', 10, 'Sofá 1/3', 'pix', '00000000-0000-4000-d500-000000000001', 1),
  ('00000000-0000-4000-d400-000000000006', '00000000-0000-4000-d200-000000000001', '00000000-0000-4000-d300-000000000001', 'expense', 10, 'Sofá 2/3', 'pix', '00000000-0000-4000-d500-000000000001', 2);

set local role authenticated;
select public.definir_partes('00000000-0000-4000-d400-000000000006', '[
    {"user_id":"00000000-0000-4000-d200-000000000001","amount":5},
    {"user_id":"00000000-0000-4000-d200-000000000002","amount":5}
  ]'::jsonb);
reset role;

update public.workspace_installment_plans
set split_weights = '[{"user_id":"00000000-0000-4000-d200-000000000001","weight":1}]'::jsonb
where id = '00000000-0000-4000-d500-000000000001';

select results_eq(
  $$select user_id, amount from public.transaction_shares where transaction_id = '00000000-0000-4000-d400-000000000005'$$,
  $$values ('00000000-0000-4000-d200-000000000001'::uuid, 10.00::numeric)$$,
  'mudar os pesos do plano refaz as partes automáticas da parcela'
);

select is(
  (select array_agg(amount order by user_id) from public.transaction_shares
   where transaction_id = '00000000-0000-4000-d400-000000000006'),
  array[5.00, 5.00]::numeric[],
  'a regeração pula a linha à mão'
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

select throws_ok(
  $$update public.workspace_installment_plans
    set split_weights = '[
      {"user_id":"00000000-0000-4000-d200-000000000001","weight":1},
      {"user_id":"00000000-0000-4000-d200-000000000002"}
    ]'::jsonb
    where id = '00000000-0000-4000-d500-000000000001'$$,
  '22023', 'PESOS_INVALIDOS',
  'um peso sem a chave weight é recusado'
);

-- 5. Ruling 10: o update cru que liga a marca e muda o valor numa frase só -----
-- Sem a regra, as partes de R$ 60,00 ficariam congeladas numa despesa de R$ 90,00.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d200-000000000003","role":"authenticated"}', true);
update public.transactions set shares_manual = true, amount = 90 where id = '00000000-0000-4000-d400-000000000004';
reset role;

select is(
  (select sum(amount) from public.transaction_shares where transaction_id = '00000000-0000-4000-d400-000000000004'),
  90.00::numeric,
  'shares_manual = true, amount = 90 numa frase só: as partes refazem e fecham o valor novo'
);

select is(
  (select shares_manual from public.transactions where id = '00000000-0000-4000-d400-000000000004'),
  false,
  'o update cru que muda o valor não deixa a marca de à mão'
);

-- 6. trocar o modo não duplica nem apaga ----------------------------------------
update public.workspaces set split_mode = 'pooled' where id = '00000000-0000-4000-d300-000000000001';
update public.workspaces set split_mode = 'split' where id = '00000000-0000-4000-d300-000000000001';
update public.workspaces set split_mode = 'pooled' where id = '00000000-0000-4000-d300-000000000001';
update public.workspaces set split_mode = 'split' where id = '00000000-0000-4000-d300-000000000001';
update public.transactions set amount = 100 where id = '00000000-0000-4000-d400-000000000001';

select is(
  (select count(*)::int from public.transaction_shares where transaction_id = '00000000-0000-4000-d400-000000000001'),
  3,
  'pooled, split, pooled, split: as partes não duplicam'
);

select is(
  (select split_since from public.workspaces where id = '00000000-0000-4000-d300-000000000001'),
  public.app_today(),
  'o split_since fica o do primeiro split'
);

insert into public.transactions (id, user_id, workspace_id, type, amount, description, payment_method, date) values
  ('00000000-0000-4000-d400-000000000007', '00000000-0000-4000-d200-000000000001', '00000000-0000-4000-d300-000000000001', 'expense', 40, 'Antiga', 'pix', now() - interval '10 days');

select is(
  (select count(*)::int from public.transaction_shares where transaction_id = '00000000-0000-4000-d400-000000000007'),
  0,
  'a despesa de antes do split_since não ganha parte'
);

-- 6b. a linha à mão que vai para antes do split_since --------------------------
update public.transactions set date = now() - interval '10 days' where id = '00000000-0000-4000-d400-000000000006';

select is(
  (select count(*)::int from public.transaction_shares where transaction_id = '00000000-0000-4000-d400-000000000006'),
  0,
  'a linha à mão que vai para antes do split_since perde as partes'
);

select is(
  (select shares_manual from public.transactions where id = '00000000-0000-4000-d400-000000000006'),
  false,
  'e volta ao automático'
);

-- 6c. I1: a parcela com paid_by nulo (a de antes da migração) ------------------
-- Só dá para fazer a linha antiga com o gatilho desligado. Os pesos do plano
-- refazem as partes sem nenhum update em `transactions`, e o paid_by fica nulo.
alter table public.transactions disable trigger definir_quem_pagou;
update public.transactions set paid_by = null where id = '00000000-0000-4000-d400-000000000005';
alter table public.transactions enable trigger definir_quem_pagou;

update public.workspace_installment_plans
set split_weights = '[{"user_id":"00000000-0000-4000-d200-000000000001","weight":1},{"user_id":"00000000-0000-4000-d200-000000000002","weight":1}]'::jsonb
where id = '00000000-0000-4000-d500-000000000001';

select is(
  (select paid_by from public.transactions where id = '00000000-0000-4000-d400-000000000005'),
  null::uuid,
  'a parcela segue com paid_by nulo depois de os pesos do plano mudarem'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d200-000000000001","role":"authenticated"}', true);
select is(
  (select sum(saldo) from public.saldos_da_carteira('00000000-0000-4000-d300-000000000001')),
  0::numeric,
  'Σ saldo = 0 com paid_by nulo: quem pagou é o autor'
);
reset role;

-- 7. o saldo fecha, mesmo depois de alguém sair --------------------------------
insert into public.settlements (workspace_id, from_user, to_user, amount, created_by)
values ('00000000-0000-4000-d300-000000000001', '00000000-0000-4000-d200-000000000003', '00000000-0000-4000-d200-000000000001', 10, '00000000-0000-4000-d200-000000000001');

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

-- Ruling 8: o acerto com quem saiu fecha o saldo dele.
select lives_ok(
  $$insert into public.settlements (workspace_id, from_user, to_user, amount)
    values ('00000000-0000-4000-d300-000000000001', '00000000-0000-4000-d200-000000000003', '00000000-0000-4000-d200-000000000001', 5)$$,
  'o acerto com quem saiu é aceito'
);

select throws_ok(
  $$insert into public.settlements (workspace_id, from_user, to_user, amount)
    values ('00000000-0000-4000-d300-000000000001', '00000000-0000-4000-d200-000000000003', '00000000-0000-4000-d200-000000000002', 5)$$,
  '42501',
  null,
  'quem grava não é uma das partes: o acerto é recusado'
);

-- 8. os pesos da carteira são do dono, e só de adultos -------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d200-000000000002","role":"authenticated"}', true);
select throws_ok(
  $$insert into public.workspace_split_weights (workspace_id, user_id, weight)
    values ('00000000-0000-4000-d300-000000000001', '00000000-0000-4000-d200-000000000002', 3)$$,
  '42501',
  null,
  'peso escrito por quem não é dono é recusado'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d200-000000000001","role":"authenticated"}', true);
select throws_ok(
  $$insert into public.workspace_split_weights (workspace_id, user_id, weight)
    values ('00000000-0000-4000-d300-000000000001', '00000000-0000-4000-d200-000000000004', 2)$$,
  '42501',
  null,
  'peso de quem não é adulto é recusado, mesmo pelo dono'
);

reset role;
select * from finish();
rollback;
