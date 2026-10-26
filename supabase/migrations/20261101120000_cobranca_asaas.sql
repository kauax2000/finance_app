-- Cobrança pelo Asaas (Bloco 8): as colunas da cobrança parcelada na linha da
-- pessoa, a idempotência do webhook, o registro dos parcelamentos e as redefinições de `tem_plano_proprio`
-- (a renovação que espera a confirmação) e de `meu_plano` (os campos da tela).
-- Tudo aditivo: com `billing_settings.enforced_since` nulo, nada muda para o
-- front de `main`. A lista de gatilhos `garantir_escrita` não é tocada.

-- 1. a linha da pessoa ganha o Asaas -------------------------------------------
-- Continua só da service role (RLS ligada, nenhuma política, revoke do Bloco 4).
-- O cliente lê só por `meu_plano()`: o token do cartão, o cliente do Asaas e o
-- IP nunca saem por ela. O CPF não é guardado.
alter table public.billing_subscriptions
  add column if not exists reembolsavel_ate timestamptz,
  add column if not exists asaas_customer_id text,
  add column if not exists card_token text,
  add column if not exists card_last4 text,
  add column if not exists card_brand text,
  add column if not exists ultimo_ip text,
  add column if not exists checkout_ref text,
  add column if not exists checkout_url text,
  add column if not exists checkout_criado_em timestamptz,
  add column if not exists nfse_para text;

-- 2. idempotência do webhook ----------------------------------------------------
-- Um evento do Asaas por `id`: o repetido não é aplicado de novo.
create table if not exists public.billing_events (
  id text primary key,
  tipo text not null,
  recebido_em timestamptz not null default now()
);

alter table public.billing_events enable row level security;
revoke all on public.billing_events from anon, authenticated;

-- 2b. o registro dos parcelamentos (Ruling 9) -----------------------------------
-- Cada parcelamento que nós criamos (o checkout, a renovação do cron) entra aqui
-- ao nascer. O webhook decide por ele: um já ativado é evento mensal; um nunca
-- ativado com a linha já paga no período é cobrança em dobro e é estornado; um
-- desconhecido não ativa nada. `estorno_status` 'pendente' é o estorno que o
-- `billing-daily` tenta de novo (Ruling 10). Só da service role.
create table if not exists public.billing_parcelamentos (
  installment text primary key,
  subscription_id uuid not null references public.billing_subscriptions(id) on delete cascade,
  criado_em timestamptz not null default now(),
  ativado_em timestamptz,
  estorno_status text check (estorno_status in ('pendente', 'feito')),
  estorno_tentado_em timestamptz
);

alter table public.billing_parcelamentos enable row level security;
revoke all on public.billing_parcelamentos from anon, authenticated;

-- 3. direito de uso -------------------------------------------------------------
-- A renovação começa dois dias antes do fim (fim − 2 dias, Ruling 20); aceita e
-- ainda não confirmada, ela grava `grace_until`. A ativa conta também pela
-- `grace_until`, para quem paga em dia não cair em "só leitura" no aniversário.
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
        (b.status = 'active' and (b.current_period_end is null or b.current_period_end > now() or b.grace_until > now()))
        or (b.status = 'past_due' and b.grace_until > now())
      )
  );
$$;

revoke all on function public.tem_plano_proprio(uuid) from public, anon, authenticated;
grant execute on function public.tem_plano_proprio(uuid) to service_role;

-- 4. o plano da pessoa logada ---------------------------------------------------
-- Os campos do Bloco 4 e mais: o final do cartão, o prazo do arrependimento, a
-- carência ("Atualize o cartão até DD/MM") e o link de pagamento em aberto, só
-- enquanto a cobrança espera e o link tem menos de um dia.
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
    'fundador', coalesce(v_assinatura.founder, false),
    'cartao_final', v_assinatura.card_last4,
    'reembolsavel_ate', v_assinatura.reembolsavel_ate,
    'carencia_ate', v_assinatura.grace_until,
    'checkout_url', case
      when v_assinatura.status in ('pending', 'past_due')
        and v_assinatura.checkout_criado_em > now() - interval '1 day'
        then v_assinatura.checkout_url
    end
  );
end;
$$;

revoke all on function public.meu_plano() from public, anon;
grant execute on function public.meu_plano() to authenticated;
