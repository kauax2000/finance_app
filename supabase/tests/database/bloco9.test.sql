-- pgTAP: Bloco 9 (20261102120000_bloco9.sql) — o titular que sai, o
-- ex-convidado, a captura sem plano duplicado e a só leitura completa.
-- Roda no projeto de teste antes de publicar; não roda na CI.
-- As fixtures entram sem sessão (`auth.uid()` nulo): os gatilhos de autor e
-- de titular deixam a service role passar. Depois do primeiro `set_config`,
-- os claims seguem valendo até o fim da transação.
begin;
select plan(12);

-- a1 dono, b2 e c3 membros, g4 convidado; o5 dono antigo de outra carteira.
insert into auth.users (id, email, created_at) values
  ('00000000-0000-4000-e900-000000000001', 'b9-a@local.test', now()),
  ('00000000-0000-4000-e900-000000000002', 'b9-b@local.test', now()),
  ('00000000-0000-4000-e900-000000000003', 'b9-c@local.test', now()),
  ('00000000-0000-4000-e900-000000000004', 'b9-g@local.test', now()),
  ('00000000-0000-4000-e900-000000000005', 'b9-o@local.test', now() - interval '60 days');

insert into public.workspaces (id, name, type, created_by) values
  ('00000000-0000-4000-e901-000000000001', 'Casa B9', 'shared', '00000000-0000-4000-e900-000000000001'),
  ('00000000-0000-4000-e901-000000000002', 'Leitura B9', 'shared', '00000000-0000-4000-e900-000000000005');

insert into public.workspace_members (workspace_id, user_id, role, sponsor_user_id) values
  ('00000000-0000-4000-e901-000000000001', '00000000-0000-4000-e900-000000000001', 'owner', null),
  ('00000000-0000-4000-e901-000000000001', '00000000-0000-4000-e900-000000000002', 'member', null),
  ('00000000-0000-4000-e901-000000000001', '00000000-0000-4000-e900-000000000003', 'member', null),
  ('00000000-0000-4000-e901-000000000001', '00000000-0000-4000-e900-000000000004', 'guest', '00000000-0000-4000-e900-000000000001'),
  ('00000000-0000-4000-e901-000000000002', '00000000-0000-4000-e900-000000000005', 'owner', null),
  ('00000000-0000-4000-e901-000000000002', '00000000-0000-4000-e900-000000000002', 'member', null)
on conflict (workspace_id, user_id) do nothing;

insert into public.credit_cards (id, workspace_id, user_id, name, last_four, closing_day, due_day, holder_user_id) values
  ('00000000-0000-4000-e902-000000000001', '00000000-0000-4000-e901-000000000001', '00000000-0000-4000-e900-000000000001', 'Cartão B', '1111', 5, 25, '00000000-0000-4000-e900-000000000002'),
  ('00000000-0000-4000-e902-000000000002', '00000000-0000-4000-e901-000000000001', '00000000-0000-4000-e900-000000000001', 'Cartão C', '2222', 5, 25, '00000000-0000-4000-e900-000000000003');

insert into public.workspace_invites (workspace_id, invited_email, role, token_hash, status, expires_at, created_by, usage_count, max_uses) values
  ('00000000-0000-4000-e901-000000000001', null, 'member', 'pgtap_b9_link', 'pending', now() + interval '7 days', '00000000-0000-4000-e900-000000000001', 0, null),
  ('00000000-0000-4000-e901-000000000001', 'b9-g@local.test', 'member', 'pgtap_b9_email', 'pending', now() + interval '7 days', '00000000-0000-4000-e900-000000000001', 0, 1);

-- 1. a captura sem plano duplicado (#23) ----------------------------------------
create temp table _b9_planos (id uuid);
insert into _b9_planos
select public.criar_plano_parcelado(
  '00000000-0000-4000-e900-000000000001', '00000000-0000-4000-e901-000000000001', null,
  'Geladeira', 'pix', null, 3, 100, 100, current_date, 'shortcut', true,
  '00000000-0000-4000-e903-000000000001', '{"canal":"atalho"}'::jsonb);
insert into _b9_planos
select public.criar_plano_parcelado(
  '00000000-0000-4000-e900-000000000001', '00000000-0000-4000-e901-000000000001', null,
  'Geladeira', 'pix', null, 3, 100, 100, current_date, 'shortcut', true,
  '00000000-0000-4000-e903-000000000001', '{"canal":"atalho"}'::jsonb);

select is(
  (select count(distinct id)::int from _b9_planos),
  1,
  'dois criar_plano_parcelado com o mesmo client_id dão o mesmo plano'
);

select is(
  (select count(*)::int from public.workspace_installment_plans
   where workspace_id = '00000000-0000-4000-e901-000000000001' and description = 'Geladeira'),
  1,
  'só um plano nasce'
);

select is(
  (select capture_meta from public.transactions
   where client_id = '00000000-0000-4000-e903-000000000001'),
  '{"canal":"atalho"}'::jsonb,
  'a 1ª parcela leva a chave e a capture_meta por dentro'
);

-- 2. o titular que sai (#66) ----------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e900-000000000001","role":"authenticated"}', true);

update public.workspace_members set role = 'guest', sponsor_user_id = '00000000-0000-4000-e900-000000000001'
where workspace_id = '00000000-0000-4000-e901-000000000001' and user_id = '00000000-0000-4000-e900-000000000002';

select is(
  (select holder_user_id from public.credit_cards where id = '00000000-0000-4000-e902-000000000001'),
  null::uuid,
  'o titular rebaixado a convidado deixa de ser titular'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e900-000000000003","role":"authenticated"}', true);

delete from public.workspace_members
where workspace_id = '00000000-0000-4000-e901-000000000001' and user_id = '00000000-0000-4000-e900-000000000003';

select is(
  (select holder_user_id from public.credit_cards where id = '00000000-0000-4000-e902-000000000002'),
  null::uuid,
  'o titular que sai deixa de ser titular'
);

-- 3. o ex-convidado (#60) -------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e900-000000000001","role":"authenticated"}', true);

delete from public.workspace_members
where workspace_id = '00000000-0000-4000-e901-000000000001' and user_id = '00000000-0000-4000-e900-000000000004';

select ok(
  exists (select 1 from public.workspace_ex_convidados
          where workspace_id = '00000000-0000-4000-e901-000000000001' and user_id = '00000000-0000-4000-e900-000000000004'),
  'quem sai como convidado fica lembrado'
);

select is(
  public.accept_workspace_invite('pgtap_b9_link', '00000000-0000-4000-e900-000000000004', 'b9-g@local.test')->>'status',
  'ex_convidado',
  'o link recusa o ex-convidado'
);

select is(
  public.accept_workspace_invite('pgtap_b9_email', '00000000-0000-4000-e900-000000000004', 'b9-g@local.test')->>'status',
  'accepted',
  'o convite por e-mail aceita o ex-convidado'
);

select ok(
  not exists (select 1 from public.workspace_ex_convidados
              where workspace_id = '00000000-0000-4000-e901-000000000001' and user_id = '00000000-0000-4000-e900-000000000004'),
  'o aceite apaga a lembrança'
);

-- 4. a só leitura completa (#79) ------------------------------------------------
-- o5 passou do teste de 14 dias e não paga: a carteira dele é só leitura.
update public.billing_settings set enforced_since = now() - interval '30 days' where id;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-e900-000000000005","role":"authenticated"}', true);

select throws_ok(
  $$insert into public.projects (workspace_id, name) values ('00000000-0000-4000-e901-000000000002', 'Reforma')$$,
  'P0001', 'workspace_somente_leitura',
  'a só leitura barra o projeto'
);

select throws_ok(
  $$insert into public.workspace_split_weights (workspace_id, user_id, weight)
    values ('00000000-0000-4000-e901-000000000002', '00000000-0000-4000-e900-000000000002', 2)$$,
  'P0001', 'workspace_somente_leitura',
  'a só leitura barra o peso'
);

select throws_ok(
  $$insert into public.workspace_member_limits (workspace_id, user_id, amount)
    values ('00000000-0000-4000-e901-000000000002', '00000000-0000-4000-e900-000000000002', 500)$$,
  'P0001', 'workspace_somente_leitura',
  'a só leitura barra o limite'
);

select * from finish();
rollback;
