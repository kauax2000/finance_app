-- pgTAP: Fase 3.6 — pagar conta é atômico e não duplica.
begin;
select plan(8);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-f100-000000000001', 'pay1@local.dev', '{"full_name":"Pay Um"}'),
  ('00000000-0000-4000-f100-000000000002', 'pay2@local.dev', '{"full_name":"Pay Dois"}');

-- Conta e parcela pendente na carteira pessoal de pay1.
insert into public.bills (id, workspace_id, user_id, name, frequency, due_day_of_month, start_date)
select '00000000-0000-4000-f200-000000000001', w.id, w.created_by, 'Luz', 'monthly', 10, '2026-09-10'
from public.workspaces w
where w.created_by = '00000000-0000-4000-f100-000000000001' and w.type = 'personal';

insert into public.bill_instances (id, workspace_id, user_id, bill_id, due_date, status)
select '00000000-0000-4000-f300-000000000001'::uuid, b.workspace_id, b.user_id, b.id, '2026-09-10', 'pending'
from public.bills b where b.id = '00000000-0000-4000-f200-000000000001';

-- O id da categoria alheia é lido antes de trocar de papel: como pay1 a RLS a esconde.
create temp table _fx on commit drop as
  select id as other_category_id from public.categories
  where user_id = '00000000-0000-4000-f100-000000000002' limit 1;
grant select on _fx to authenticated;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-f100-000000000001","role":"authenticated"}', true);

-- Uma categoria de outra carteira faz a despesa falhar depois de a parcela
-- ter sido reivindicada: tudo tem de voltar.
select throws_ok(
  $$select public.pay_bill_instance(
      '00000000-0000-4000-f300-000000000001', 120, '2026-09-08',
      (select other_category_id from _fx),
      'pix', null, 'Luz', '2026-10-10')$$,
  '23503', null,
  'categoria de outra carteira é recusada'
);

reset role;
select is(
  (select status from public.bill_instances where id = '00000000-0000-4000-f300-000000000001'),
  'pending',
  'falha no meio não deixa a parcela paga'
);
set local role authenticated;

select isnt(
  public.pay_bill_instance(
    '00000000-0000-4000-f300-000000000001', 120, '2026-09-08', null,
    'pix', null, 'Luz', '2026-10-10'),
  null,
  'pagamento devolve o id da despesa'
);

reset role;
select is(
  (select (paid_at at time zone 'utc')::date from public.bill_instances
   where id = '00000000-0000-4000-f300-000000000001'),
  '2026-09-08'::date,
  'paid_at é a data escolhida, não a de hoje'
);

select is(
  (select count(*)::int from public.transactions t
   join public.bill_instances i on i.transaction_id = t.id
   where i.id = '00000000-0000-4000-f300-000000000001' and t.amount = 120),
  1,
  'parcela aponta para a despesa criada'
);

select is(
  (select count(*)::int from public.bill_instances
   where bill_id = '00000000-0000-4000-f200-000000000001' and due_date = '2026-10-10' and status = 'pending'),
  1,
  'a próxima parcela é aberta'
);

set local role authenticated;
select throws_ok(
  $$select public.pay_bill_instance(
      '00000000-0000-4000-f300-000000000001', 120, '2026-09-08', null,
      'pix', null, 'Luz', '2026-10-10')$$,
  'P0001', 'BILL_INSTANCE_NOT_PENDING',
  'segundo clique é recusado'
);

reset role;
select is(
  (select count(*)::int from public.transactions
   where user_id = '00000000-0000-4000-f100-000000000001' and description = 'Luz'),
  1,
  'e não cria outra despesa'
);

select * from finish();
rollback;
