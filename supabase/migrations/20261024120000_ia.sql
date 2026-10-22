-- IA grátis na captura e na fatura (Bloco 3B): a cota diária por pessoa, o
-- cache das respostas, a contagem de eventos por provedor e o parcelamento
-- interno que a Edge `capture` chama em nome de alguém.
-- Tudo aditivo: o front de `main` continua chamando
-- `create_workspace_installment_plan` com a mesma assinatura e os mesmos erros.

-- 1. tabelas da IA ------------------------------------------------------------
-- Só a service role (as Edges) lê e grava: RLS ligada, nenhuma política e o
-- grant padrão do Supabase retirado.

-- Chamadas de IA por pessoa e dia (o dia de São Paulo, escolhido pela Edge).
create table if not exists public.ia_uso (
  user_id uuid not null references auth.users(id) on delete cascade,
  dia date not null,
  chamadas integer not null default 0,
  primary key (user_id, dia)
);

alter table public.ia_uso enable row level security;
revoke all on public.ia_uso from anon, authenticated;

-- A resposta já validada, pela chave sha256 de `tarefa:entrada redigida`.
create table if not exists public.ia_cache (
  chave text primary key,
  tarefa text not null,
  resultado jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.ia_cache enable row level security;
revoke all on public.ia_cache from anon, authenticated;

-- Quantas chamadas cada provedor e modelo atendeu, por status. Sem pessoa.
create table if not exists public.ia_eventos (
  dia date not null,
  provedor text not null,
  modelo text not null,
  status text not null,
  total integer not null default 0,
  primary key (dia, provedor, modelo, status)
);

alter table public.ia_eventos enable row level security;
revoke all on public.ia_eventos from anon, authenticated;

-- 2. cota ---------------------------------------------------------------------
-- Um upsert só: a linha soma 1 enquanto está abaixo do limite. Esgotada, o
-- `where` do `do update` não deixa a linha mudar e nada volta. Dois pedidos ao
-- mesmo tempo esperam um pelo outro na linha, sem passar juntos do limite.
create or replace function public.consumir_cota_ia(
  p_user_id uuid,
  p_dia date,
  p_limite integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_chamadas integer;
begin
  -- A primeira chamada do dia entra pelo insert, que não lê o limite.
  if p_limite is null or p_limite < 1 then
    return false;
  end if;

  insert into public.ia_uso as u (user_id, dia, chamadas)
  values (p_user_id, p_dia, 1)
  on conflict (user_id, dia) do update
    set chamadas = u.chamadas + 1
    where u.chamadas < p_limite
  returning chamadas into v_chamadas;

  return v_chamadas is not null;
end;
$$;

revoke all on function public.consumir_cota_ia(uuid, date, integer) from public, anon, authenticated;
grant execute on function public.consumir_cota_ia(uuid, date, integer) to service_role;

-- 3. eventos ------------------------------------------------------------------
create or replace function public.registrar_evento_ia(
  p_dia date,
  p_provedor text,
  p_modelo text,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.ia_eventos as e (dia, provedor, modelo, status, total)
  values (p_dia, p_provedor, p_modelo, p_status, 1)
  on conflict (dia, provedor, modelo, status) do update
    set total = e.total + 1;
end;
$$;

revoke all on function public.registrar_evento_ia(date, text, text, text) from public, anon, authenticated;
grant execute on function public.registrar_evento_ia(date, text, text, text) to service_role;

-- 4. parcelamento interno -----------------------------------------------------
-- O corpo de `create_workspace_installment_plan` (baseline), com a pessoa
-- passada por quem chama em vez de `auth.uid()`: a Edge `capture` age com a
-- service role em nome do dono do token. Por isso a checagem de membro lê
-- `workspace_members` direto (`is_workspace_member` lê `auth.uid()`).
-- `charge_workspace_installment_plan_step` cria as parcelas vencidas até hoje
-- com a origem padrão; a origem e a revisão da captura são gravadas logo depois.
create or replace function public.criar_plano_parcelado(
  p_user_id uuid,
  p_workspace_id uuid,
  p_category_id uuid,
  p_description text,
  p_payment_method text,
  p_payment_credit_card_id uuid,
  p_total_installments integer,
  p_installment_amount numeric,
  p_final_installment_amount numeric,
  p_next_billing_date date,
  p_source text default 'app',
  p_needs_review boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan_id uuid;
  v_step smallint;
begin
  if not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = p_user_id
  ) then
    raise exception 'Forbidden';
  end if;

  if p_total_installments is null or p_total_installments < 2 then
    raise exception 'Invalid total_installments';
  end if;

  insert into public.workspace_installment_plans (
    workspace_id,
    user_id,
    category_id,
    description,
    payment_method,
    payment_credit_card_id,
    total_installments,
    generated_count,
    installment_amount,
    final_installment_amount,
    next_billing_date,
    is_active
  ) values (
    p_workspace_id,
    p_user_id,
    p_category_id,
    nullif(trim(coalesce(p_description, '')), ''),
    p_payment_method,
    p_payment_credit_card_id,
    p_total_installments,
    0,
    p_installment_amount,
    p_final_installment_amount,
    p_next_billing_date,
    true
  )
  returning id into v_plan_id;

  loop
    v_step := public.charge_workspace_installment_plan_step(v_plan_id);
    exit when v_step = 0;
  end loop;

  -- O caminho padrão (o app) não escreve nada a mais.
  if p_source <> 'app' or p_needs_review then
    update public.transactions
    set source = p_source, needs_review = p_needs_review
    where installment_plan_id = v_plan_id;
  end if;

  return v_plan_id;
end;
$$;

revoke all on function public.criar_plano_parcelado(uuid, uuid, uuid, text, text, uuid, integer, numeric, numeric, date, text, boolean) from public, anon, authenticated;
grant execute on function public.criar_plano_parcelado(uuid, uuid, uuid, text, text, uuid, integer, numeric, numeric, date, text, boolean) to service_role;

-- A função do app: mesma assinatura, mesmos erros, mesmo grant (o
-- `create or replace` preserva o da migração 20260915100000). Ela chama a
-- interna como dona (`security definer`), então o grant só da service role
-- não a barra.
create or replace function public.create_workspace_installment_plan(
  p_workspace_id uuid,
  p_category_id uuid,
  p_description text,
  p_payment_method text,
  p_payment_credit_card_id uuid,
  p_total_installments integer,
  p_installment_amount numeric,
  p_final_installment_amount numeric,
  p_next_billing_date date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'Forbidden';
  end if;

  return public.criar_plano_parcelado(
    v_uid,
    p_workspace_id,
    p_category_id,
    p_description,
    p_payment_method,
    p_payment_credit_card_id,
    p_total_installments,
    p_installment_amount,
    p_final_installment_amount,
    p_next_billing_date
  );
end;
$$;

-- 5. limpeza do cache ---------------------------------------------------------
-- Domingo, 7h30 UTC (hosted: extensão presente; local: no-op).
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(j.jobid) from cron.job j
    where j.jobname = 'ia-cache-limpeza';
    perform cron.schedule(
      'ia-cache-limpeza', '30 7 * * 0',
      $cmd$delete from public.ia_cache where created_at < now() - interval '30 days'$cmd$
    );
  end if;
end;
$cron$;
