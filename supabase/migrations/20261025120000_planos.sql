-- Planos (Bloco 4): o direito de uso, o teste de 14 dias calculado, o "só
-- leitura" no banco, a origem `recurring` dos lançamentos dos crons e o cron
-- diário do teste.
-- Tudo aditivo e desligado: com `billing_settings.enforced_since` nulo,
-- `plano_do_usuario` e `workspace_plan` devolvem 'familia' antes de ler
-- qualquer outra coisa, o gatilho de escrita nunca barra e o cron do teste não
-- acha ninguém. O front de `main` não muda de comportamento.

-- 1. tabelas ------------------------------------------------------------------
-- Só a service role (as Edges) lê e grava: RLS ligada, nenhuma política e o
-- grant padrão do Supabase retirado.

-- Uma linha só. `enforced_since` é o lançamento: nulo, ninguém é barrado.
create table if not exists public.billing_settings (
  id boolean primary key default true check (id),
  enforced_since timestamptz
);

insert into public.billing_settings (id) values (true)
  on conflict (id) do nothing;

alter table public.billing_settings enable row level security;
revoke all on public.billing_settings from anon, authenticated;

-- Uma linha por pessoa. O teste (`trialing`) é calculado, não gravado; cancelar
-- é `active` com `cancel_at_period_end`. O vitalício é `manual`, `active`, com
-- `current_period_end` nulo.
create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  provider text not null check (provider in ('asaas', 'manual', 'apple', 'google')),
  provider_ref text,
  plan text not null default 'familia' check (plan = 'familia'),
  "interval" text not null default 'year' check ("interval" = 'year'),
  status text not null check (status in ('pending', 'active', 'past_due', 'expired')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  price_cents integer,
  founder boolean not null default false,
  grace_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.billing_subscriptions enable row level security;
revoke all on public.billing_subscriptions from anon, authenticated;

-- Um aviso de plano por pessoa, tipo e referência (o dedupe do cron).
create table if not exists public.billing_avisos (
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  referencia text not null,
  enviado_em timestamptz not null default now(),
  primary key (user_id, tipo, referencia)
);

alter table public.billing_avisos enable row level security;
revoke all on public.billing_avisos from anon, authenticated;

-- A jornada de 4 passos (`/comecar`). A política de `update` da própria linha
-- já cobre a escrita.
alter table public.user_settings
  add column if not exists jornada_concluida_em timestamptz;

-- 2. direito de uso -----------------------------------------------------------
-- Assinatura ativa no período (ou vitalícia), ou em atraso dentro da carência.
create or replace function public.tem_plano_proprio(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.billing_subscriptions b
    where b.user_id = p_user_id
      and (
        (b.status = 'active' and (b.current_period_end is null or b.current_period_end > now()))
        or (b.status = 'past_due' and b.grace_until > now())
      )
  );
$$;

revoke all on function public.tem_plano_proprio(uuid) from public, anon, authenticated;
grant execute on function public.tem_plano_proprio(uuid) to service_role;

-- Coberta por quem assina: a pessoa está entre as 5 primeiras pessoas
-- distintas (fora o assinante), por `min(joined_at)`, das carteiras em que o
-- assinante é `owner`. Não é transitiva: só o plano próprio do assinante conta.
create or replace function public.tem_cobertura(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from (
      select distinct dono.user_id as assinante
      from public.workspace_members eu
      join public.workspace_members dono
        on dono.workspace_id = eu.workspace_id
       and dono.role = 'owner'
       and dono.user_id <> p_user_id
      where eu.user_id = p_user_id
    ) a
    where public.tem_plano_proprio(a.assinante)
      and p_user_id in (
        select m.user_id
        from public.workspace_members d
        join public.workspace_members m
          on m.workspace_id = d.workspace_id
         and m.user_id <> d.user_id
        where d.user_id = a.assinante
          and d.role = 'owner'
        group by m.user_id
        order by min(m.joined_at), m.user_id
        limit 5
      )
  );
$$;

revoke all on function public.tem_cobertura(uuid) from public, anon, authenticated;
grant execute on function public.tem_cobertura(uuid) to service_role;

-- 'familia' ou 'leitura'. O atalho do `enforced_since` nulo vem antes de
-- qualquer outra leitura.
create or replace function public.plano_do_usuario(p_user_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_enforced_since timestamptz;
begin
  select s.enforced_since into v_enforced_since from public.billing_settings s where s.id;
  if v_enforced_since is null then
    return 'familia';
  end if;

  if public.tem_plano_proprio(p_user_id) then
    return 'familia';
  end if;

  if exists (
    select 1
    from auth.users u
    where u.id = p_user_id
      and greatest(u.created_at, v_enforced_since) + interval '14 days' > now()
  ) then
    return 'familia';
  end if;

  if public.tem_cobertura(p_user_id) then
    return 'familia';
  end if;

  return 'leitura';
end;
$$;

revoke all on function public.plano_do_usuario(uuid) from public, anon, authenticated;
grant execute on function public.plano_do_usuario(uuid) to service_role;

-- Substitui o stub do Bloco 3A: mesma assinatura, mesmos grants. A carteira
-- segue o plano de quem é dono dela.
create or replace function public.workspace_plan(p_workspace_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_enforced_since timestamptz;
begin
  select s.enforced_since into v_enforced_since from public.billing_settings s where s.id;
  if v_enforced_since is null then
    return 'familia';
  end if;

  if exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.role = 'owner'
      and public.plano_do_usuario(wm.user_id) = 'familia'
  ) then
    return 'familia';
  end if;

  return 'leitura';
end;
$$;

revoke all on function public.workspace_plan(uuid) from public, anon;
grant execute on function public.workspace_plan(uuid) to authenticated, service_role;

-- 3. só leitura ---------------------------------------------------------------
-- Barra a escrita da pessoa, nunca a dos crons nem a da service role
-- (`auth.uid()` nulo): parcelas e assinaturas já contratadas continuam sendo
-- lançadas, e o `delete-user` continua apagando.
-- ponytail: avalia o plano por linha; uma importação grande paga N leituras
-- (baratas e só depois do lançamento). Se pesar, um gatilho por comando.
create or replace function public.garantir_escrita()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if public.workspace_plan(coalesce(new.workspace_id, old.workspace_id)) = 'leitura' then
    raise exception 'workspace_somente_leitura' using errcode = 'P0001';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists garantir_escrita on public.transactions;
create trigger garantir_escrita before insert or update or delete on public.transactions
  for each row execute function public.garantir_escrita();

drop trigger if exists garantir_escrita on public.workspace_installment_plans;
create trigger garantir_escrita before insert on public.workspace_installment_plans
  for each row execute function public.garantir_escrita();

drop trigger if exists garantir_escrita on public.attachments;
create trigger garantir_escrita before insert on public.attachments
  for each row execute function public.garantir_escrita();

-- 4. origem dos crons ---------------------------------------------------------
-- O lançamento de assinatura ou parcela feito sem pessoa (o cron) é
-- `recurring`, sem reescrever as funções dos crons. A captura grava a própria
-- origem depois, por `criar_plano_parcelado`.
create or replace function public.origem_do_cron()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null
     and new.source = 'app'
     and (new.subscription_id is not null or new.installment_plan_id is not null) then
    new.source := 'recurring';
  end if;
  return new;
end;
$$;

drop trigger if exists origem_do_cron on public.transactions;
create trigger origem_do_cron before insert on public.transactions
  for each row execute function public.origem_do_cron();

-- 5. o plano da pessoa logada -------------------------------------------------
create or replace function public.meu_plano()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_enforced_since timestamptz;
  v_assinatura public.billing_subscriptions%rowtype;
  v_proprio boolean;
  v_teste_ate timestamptz;
  v_plano text;
  v_origem text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select s.enforced_since into v_enforced_since from public.billing_settings s where s.id;
  select * into v_assinatura from public.billing_subscriptions b where b.user_id = v_uid;
  v_proprio := public.tem_plano_proprio(v_uid);
  v_plano := public.plano_do_usuario(v_uid);

  -- Sem lançamento não há teste a contar.
  if v_enforced_since is not null then
    select greatest(u.created_at, v_enforced_since) + interval '14 days'
      into v_teste_ate
      from auth.users u
      where u.id = v_uid;
  end if;

  v_origem := case
    when v_enforced_since is null then 'livre'
    when v_proprio and v_assinatura.current_period_end is null then 'vitalicio'
    when v_proprio then 'assinatura'
    when v_teste_ate > now() then 'teste'
    when v_plano = 'familia' then 'convite'
    else 'nenhuma'
  end;

  return jsonb_build_object(
    'plano', v_plano,
    'origem', v_origem,
    'status', v_assinatura.status,
    'teste_ate', v_teste_ate,
    'periodo_ate', v_assinatura.current_period_end,
    'cancelar_no_fim', coalesce(v_assinatura.cancel_at_period_end, false),
    'preco_centavos', v_assinatura.price_cents,
    'fundador', coalesce(v_assinatura.founder, false)
  );
end;
$$;

revoke all on function public.meu_plano() from public, anon;
grant execute on function public.meu_plano() to authenticated;

-- 6. o cron do teste ----------------------------------------------------------
-- Quem está entre o 12º e o 14º dia do teste, sem plano próprio nem cobertura,
-- com o que o app fez por ela desde o início do teste nas carteiras de que é
-- dona. Vazio com `enforced_since` nulo. Sem carteira pessoal, a pessoa fica de
-- fora: o aviso não teria onde ser entregue.
create or replace function public.avisos_de_teste_pendentes()
returns table (
  user_id uuid,
  email text,
  workspace_id uuid,
  fim_do_teste timestamptz,
  relatorio jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with config as (
    select s.enforced_since
    from public.billing_settings s
    where s.enforced_since is not null
  ),
  candidatos as (
    select u.id, u.email::text as email, greatest(u.created_at, config.enforced_since) as inicio
    from auth.users u
    cross join config
    where greatest(u.created_at, config.enforced_since) + interval '12 days' <= now()
      and now() < greatest(u.created_at, config.enforced_since) + interval '14 days'
  )
  select
    c.id,
    c.email,
    pessoal.id,
    c.inicio + interval '14 days',
    jsonb_build_object(
      'lancados_sozinho', (
        select count(*)
        from public.transactions t
        join public.workspace_members wm
          on wm.workspace_id = t.workspace_id and wm.user_id = c.id and wm.role = 'owner'
        where t.source <> 'app' and t.created_at >= c.inicio
      ),
      'a_conferir', (
        select count(*)
        from public.transactions t
        join public.workspace_members wm
          on wm.workspace_id = t.workspace_id and wm.user_id = c.id and wm.role = 'owner'
        where t.needs_review and t.created_at >= c.inicio
      ),
      'avisos', (
        select count(*)
        from public.notifications n
        where n.user_id = c.id and n.created_at >= c.inicio
      )
    )
  from candidatos c
  join lateral (
    select w.id
    from public.workspaces w
    where w.type = 'personal' and w.created_by = c.id
    order by w.created_at
    limit 1
  ) pessoal on true
  where not public.tem_plano_proprio(c.id)
    and not public.tem_cobertura(c.id);
$$;

revoke all on function public.avisos_de_teste_pendentes() from public, anon, authenticated;
grant execute on function public.avisos_de_teste_pendentes() to service_role;

-- O lançamento: liga a cobrança uma vez só.
create or replace function public.billing_lancar()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.billing_settings
  set enforced_since = now()
  where enforced_since is null;
$$;

revoke all on function public.billing_lancar() from public, anon, authenticated;
grant execute on function public.billing_lancar() to service_role;

-- 12h UTC = 9h em Brasília (hosted: extensão presente; local: no-op).
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(j.jobid) from cron.job j
    where j.jobname = 'billing-daily';
    perform cron.schedule(
      'billing-daily', '0 12 * * *',
      $cmd$select public.invoke_edge_function('billing-daily')$cmd$
    );
  end if;
end;
$cron$;
