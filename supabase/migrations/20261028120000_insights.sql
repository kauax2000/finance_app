-- Bloco 6B — Motor de insights (spec §11, "Motor de insights").
--
-- Só acrescenta: o front de `main` não lê nada daqui. O tipo de aviso
-- 'insight' entra no check sem tirar nenhum (o front antigo mostra o tipo
-- novo com o sino padrão). O cron `insights-daily` é criado aqui, mas a Edge
-- só sobe junto com o front 2.0 (os links dela não existem no antigo).

-- 1. os insights --------------------------------------------------------------
-- `user_id` nulo é da carteira (todos os membros veem); preenchido, é só da
-- pessoa. Um fato dá um insight só: a `dedupe_key` é única por carteira,
-- pessoa e tipo, e o descartado fica na tabela, então não volta.
create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null check (kind in ('fatura_fechou', 'relatorio_mes', 'recorrencia', 'gasto_atipico', 'preco_assinatura', 'duplicidade', 'parcelas_acabando', 'seguro_baixo', 'sazonal', 'a_conferir')),
  dedupe_key text not null,
  payload jsonb not null default '{}',
  status text not null default 'new' check (status in ('new', 'seen', 'dismissed', 'acted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists insights_dedupe_uidx
  on public.insights (workspace_id, coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), kind, dedupe_key);

create index if not exists insights_workspace_created_idx
  on public.insights (workspace_id, created_at desc);

create index if not exists insights_user_id_idx
  on public.insights (user_id) where user_id is not null;

drop trigger if exists set_insights_updated_at on public.insights;
create trigger set_insights_updated_at before update on public.insights
  for each row execute function public.set_updated_at();

-- 2. "não mostrar mais este tipo" ---------------------------------------------
-- Por pessoa, valendo em todas as carteiras dela. Num insight da carteira, quem
-- silenciou não o vê (o filtro é na leitura); o cron e o `registrar_insight`
-- não criam o insight pessoal de um tipo silenciado.
create table if not exists public.insights_silenciados (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('fatura_fechou', 'relatorio_mes', 'recorrencia', 'gasto_atipico', 'preco_assinatura', 'duplicidade', 'parcelas_acabando', 'seguro_baixo', 'sazonal', 'a_conferir')),
  criado_em timestamptz not null default now(),
  primary key (user_id, kind)
);

alter table public.insights_silenciados enable row level security;
revoke all on public.insights_silenciados from anon;

drop policy if exists insights_silenciados_select on public.insights_silenciados;
create policy insights_silenciados_select on public.insights_silenciados
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists insights_silenciados_insert on public.insights_silenciados;
create policy insights_silenciados_insert on public.insights_silenciados
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists insights_silenciados_delete on public.insights_silenciados;
create policy insights_silenciados_delete on public.insights_silenciados
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- A leitura segue as regras de cima. Ninguém escreve direto: só as RPCs abaixo
-- (e a service role do cron).
alter table public.insights enable row level security;
revoke all on public.insights from anon;
revoke insert, update, delete, truncate on public.insights from authenticated;

drop policy if exists insights_select on public.insights;
create policy insights_select on public.insights
  for select to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and (user_id is null or user_id = (select auth.uid()))
    and not exists (
      select 1 from public.insights_silenciados s
      where s.user_id = (select auth.uid())
        and s.kind = insights.kind
    )
  );

-- 3. o teto de push -----------------------------------------------------------
-- 3 por pessoa e semana (segunda a domingo, Brasília), somando todas as
-- carteiras dela. O resto chega só no app. Só a service role lê e grava.
create table if not exists public.insights_push_semana (
  user_id uuid not null references auth.users(id) on delete cascade,
  semana date not null,
  enviados integer not null default 0,
  primary key (user_id, semana)
);

alter table public.insights_push_semana enable row level security;
revoke all on public.insights_push_semana from anon, authenticated;

-- Reivindica um envio: soma 1 só abaixo de 3, num comando só (dois envios ao
-- mesmo tempo esperam pela chave). `false` = sem push, só no app.
create or replace function public.reivindicar_push_de_insight(p_user_id uuid, p_semana date)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.insights_push_semana as s (user_id, semana, enviados)
  values (p_user_id, p_semana, 1)
  on conflict (user_id, semana) do update
    set enviados = s.enviados + 1
    where s.enviados < 3;
  return found;
end;
$$;

revoke all on function public.reivindicar_push_de_insight(uuid, date) from public, anon, authenticated;
grant execute on function public.reivindicar_push_de_insight(uuid, date) to service_role;

-- 4. marcar -------------------------------------------------------------------
-- Visto, descartado ou usado, por quem vê o insight pelas regras da RLS. O
-- usado não volta atrás, e o descartado não volta a visto. Usar duas vezes é
-- `INSIGHT_JA_USADO`: o `update` espera o outro e relê o status, então dois
-- toques ao mesmo tempo não criam duas vezes (as RPCs `virar_*` marcam primeiro).
-- O status de um insight da carteira é um só para todos os membros.
create or replace function public.marcar_insight(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if p_status is null or p_status not in ('seen', 'dismissed', 'acted') then
    raise exception 'INSIGHT_STATUS_INVALIDO' using errcode = '22023';
  end if;

  perform 1
  from public.insights i
  where i.id = p_id
    and public.is_workspace_member(i.workspace_id)
    and (i.user_id is null or i.user_id = v_uid)
    and not exists (
      select 1 from public.insights_silenciados s
      where s.user_id = v_uid
        and s.kind = i.kind
    );

  if not found then
    raise exception 'INSIGHT_NAO_ENCONTRADO' using errcode = 'P0002';
  end if;

  update public.insights
  set status = p_status
  where id = p_id
    and status <> 'acted'
    and not (status = 'dismissed' and p_status = 'seen');

  if not found and p_status = 'acted' then
    raise exception 'INSIGHT_JA_USADO' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.marcar_insight(uuid, text) from public, anon;
grant execute on function public.marcar_insight(uuid, text) to authenticated;

-- 5. o insight que o cliente produz -------------------------------------------
-- Só o seguro baixo, calculado ao abrir o Painel. É da pessoa que o calculou.
-- Repetido ou silenciado, não cria nada e devolve nulo.
create or replace function public.registrar_insight(p_workspace_id uuid, p_kind text, p_dedupe_key text, p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null or not public.is_workspace_member(p_workspace_id) then
    raise exception 'not a workspace member' using errcode = '42501';
  end if;

  if p_kind is distinct from 'seguro_baixo' then
    raise exception 'INSIGHT_TIPO_NAO_PERMITIDO' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.insights_silenciados s
    where s.user_id = v_uid
      and s.kind = p_kind
  ) then
    return null;
  end if;

  insert into public.insights (workspace_id, user_id, kind, dedupe_key, payload)
  values (p_workspace_id, v_uid, p_kind, p_dedupe_key, coalesce(p_payload, '{}'::jsonb))
  on conflict do nothing
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.registrar_insight(uuid, text, text, jsonb) from public, anon;
grant execute on function public.registrar_insight(uuid, text, text, jsonb) to authenticated;

-- 6. "Criar com 1 toque, ligando os lançamentos passados" ---------------------
-- `security invoker`: valem a RLS de quem toca (membro da carteira, autor =
-- auth.uid()), o `garantir_escrita` do plano e as travas de mesma carteira. O
-- insight é marcado `acted` primeiro: quem chega depois cai em
-- `INSIGHT_JA_USADO`, e uma falha no meio desfaz a marca junto.
-- Os lançamentos são os de `payload.lancamentos`, da carteira do insight,
-- despesas e ainda soltos (sem assinatura e sem instância de conta).

-- A assinatura mensal cobra no próximo `p_dia` depois de hoje (o dia que o mês
-- não tem vira o último dele). `start_date` = `next_billing_date`: o
-- `seed_subscription_first_transaction` lança a primeira cobrança nessa data
-- futura, como faz quando a tela cria uma assinatura com data adiante, e não
-- repete um mês que os lançamentos passados já cobrem. A âncora é o `p_dia`,
-- para o fevereiro encurtado não puxar os meses seguintes.
create or replace function public.virar_assinatura(p_insight_id uuid, p_nome text, p_valor numeric, p_dia smallint, p_payment_method text, p_card_id uuid, p_category_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_ins public.insights%rowtype;
  v_hoje date := public.app_today();
  v_mes date := date_trunc('month', public.app_today())::date;
  v_next date;
  v_sub uuid;
begin
  if p_dia is null or p_dia not between 1 and 31 then
    raise exception 'INSIGHT_DIA_INVALIDO' using errcode = '22023';
  end if;
  if p_valor is null or p_valor <= 0 then
    raise exception 'INSIGHT_VALOR_INVALIDO' using errcode = '22023';
  end if;

  select * into v_ins from public.insights where id = p_insight_id;
  if not found then
    raise exception 'INSIGHT_NAO_ENCONTRADO' using errcode = 'P0002';
  end if;

  perform public.marcar_insight(p_insight_id, 'acted');

  v_next := v_mes + (least(p_dia::int, extract(day from (v_mes + interval '1 month - 1 day'))::int) - 1);
  if v_next <= v_hoje then
    v_mes := (v_mes + interval '1 month')::date;
    v_next := v_mes + (least(p_dia::int, extract(day from (v_mes + interval '1 month - 1 day'))::int) - 1);
  end if;

  insert into public.workspace_subscriptions (
    workspace_id, user_id, name, amount, billing_interval, start_date, next_billing_date,
    billing_anchor_day, category_id, payment_method, payment_credit_card_id, kind, is_active
  ) values (
    v_ins.workspace_id, (select auth.uid()), p_nome, p_valor, 'monthly', v_next, v_next,
    p_dia, p_category_id, p_payment_method,
    case when p_payment_method = 'credit_card' then p_card_id end,
    'expense', true
  )
  returning id into v_sub;

  update public.transactions t
  set subscription_id = v_sub
  where t.id in (
      select e::uuid from jsonb_array_elements_text(coalesce(v_ins.payload -> 'lancamentos', '[]'::jsonb)) e
    )
    and t.workspace_id = v_ins.workspace_id
    and t.type = 'expense'
    and t.subscription_id is null
    and not exists (select 1 from public.bill_instances i where i.transaction_id = t.id);

  return v_sub;
end;
$$;

revoke all on function public.virar_assinatura(uuid, text, numeric, smallint, text, uuid, uuid) from public, anon;
grant execute on function public.virar_assinatura(uuid, text, numeric, smallint, text, uuid, uuid) to authenticated;

-- A conta mensal com uma instância paga por lançamento (a data do lançamento,
-- os dados do pagamento dele) e a próxima pendente em `p_next_due_date`, que o
-- cliente calcula pela recorrência do 6A (como no pagar, pular e ligar). Os
-- lançamentos são travados (`for update`) antes da conferência, como no
-- `ligar_pagamento_da_conta`. O `media_da_conta` só roda no update: por isso o
-- estimado nasce aqui pela mesma conta dele (a média das 3 últimas), e sem
-- lançamento vem do payload (`valorMedio` da recorrência, `valor` do sazonal).
create or replace function public.virar_conta(p_insight_id uuid, p_nome text, p_dia smallint, p_valor_variavel boolean, p_category_id uuid, p_next_due_date date)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_ins public.insights%rowtype;
  v_pedidos uuid[];
  v_ids uuid[];
  v_bill uuid;
begin
  select * into v_ins from public.insights where id = p_insight_id;
  if not found then
    raise exception 'INSIGHT_NAO_ENCONTRADO' using errcode = 'P0002';
  end if;

  perform public.marcar_insight(p_insight_id, 'acted');

  select coalesce(array_agg(e::uuid), '{}')
  into v_pedidos
  from jsonb_array_elements_text(coalesce(v_ins.payload -> 'lancamentos', '[]'::jsonb)) e;

  perform 1 from public.transactions t where t.id = any(v_pedidos) for update;

  select coalesce(array_agg(t.id), '{}')
  into v_ids
  from public.transactions t
  where t.id = any(v_pedidos)
    and t.workspace_id = v_ins.workspace_id
    and t.type = 'expense'
    and t.subscription_id is null
    and not exists (select 1 from public.bill_instances i where i.transaction_id = t.id);

  insert into public.bills (
    workspace_id, user_id, name, category_id, frequency, due_day_of_month,
    amount_estimated, start_date, default_payment_method, valor_variavel
  ) values (
    v_ins.workspace_id, (select auth.uid()), p_nome, p_category_id, 'monthly', p_dia,
    coalesce(
      (select round(avg(u.amount), 2) from (
        select t.amount from public.transactions t
        where t.id = any(v_ids)
        order by t.date desc
        limit 3
      ) u),
      (v_ins.payload ->> 'valorMedio')::numeric,
      (v_ins.payload ->> 'valor')::numeric
    ),
    coalesce(
      (select min((t.date at time zone 'UTC')::date) from public.transactions t where t.id = any(v_ids)),
      p_next_due_date,
      public.app_today()
    ),
    nullif(v_ins.payload ->> 'payment_method', 'credit_card'),
    coalesce(p_valor_variavel, false)
  )
  returning id into v_bill;

  insert into public.bill_instances (
    workspace_id, user_id, bill_id, due_date, status, amount,
    paid_at, paid_amount, payment_method, payment_credit_card_id, transaction_id
  )
  select
    v_ins.workspace_id, (select auth.uid()), v_bill, (t.date at time zone 'UTC')::date,
    'paid', t.amount, t.date, t.amount, t.payment_method, t.payment_credit_card_id, t.id
  from public.transactions t
  where t.id = any(v_ids)
  on conflict do nothing;

  if p_next_due_date is not null then
    insert into public.bill_instances (workspace_id, user_id, bill_id, due_date, status, amount)
    values (v_ins.workspace_id, (select auth.uid()), v_bill, p_next_due_date, 'pending', null)
    on conflict do nothing;
  end if;

  return v_bill;
end;
$$;

revoke all on function public.virar_conta(uuid, text, smallint, boolean, uuid, date) from public, anon;
grant execute on function public.virar_conta(uuid, text, smallint, boolean, uuid, date) to authenticated;

-- 7. o aviso ------------------------------------------------------------------
-- O check só aumenta. `not valid` + `validate`: o lock forte não espera a
-- varredura da tabela.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type = any (array['transaction', 'budget', 'system', 'promotion', 'credit_card', 'bill', 'review', 'insight']))
  not valid;
alter table public.notifications validate constraint notifications_type_check;

alter table public.workspace_member_notification_prefs
  add column if not exists notify_insights boolean not null default true;

-- 8. o cron -------------------------------------------------------------------
-- 13h UTC = 10h em Brasília (hosted: extensão presente; local: no-op). O
-- `invoke_edge_function` é assíncrono (pg_net): até a Edge subir, a chamada
-- só deixa um 404 em `net._http_response`, e o job do cron não falha.
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(j.jobid) from cron.job j
    where j.jobname = 'insights-daily';
    perform cron.schedule(
      'insights-daily', '0 13 * * *',
      $cmd$select public.invoke_edge_function('insights-daily')$cmd$
    );
  end if;
end;
$cron$;
