-- Captura sem abrir o app (Bloco 3A): o token pessoal que o Atalho do iPhone e
-- a Edge `capture` usam, o apelido do cartão na Wallet, o plano da carteira
-- (stub), o lembrete das 20h dos itens "a conferir" e o dedupe dele.
-- Tudo aditivo: o front de `main` continua lendo e gravando como antes.

-- 1. tokens de captura --------------------------------------------------------
-- O token (`fac_` + 64 hex) nasce na RPC e volta uma vez só; a tabela guarda
-- o sha256. A Edge procura pelo hash, com a service role.
create table if not exists public.capture_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- a carteira padrão do token
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists idx_capture_tokens_user on public.capture_tokens (user_id);
create index if not exists idx_capture_tokens_workspace on public.capture_tokens (workspace_id);

alter table public.capture_tokens enable row level security;

-- Sem política de insert, update nem delete: só as RPCs abaixo e a service
-- role escrevem. O select de tabela que o Supabase concede por padrão abriria
-- todas as colunas (um revoke de coluna não o desfaz), então ele sai inteiro e
-- volta por coluna, sem o hash.
revoke all on public.capture_tokens from anon, authenticated;
grant select (id, user_id, workspace_id, name, created_at, last_used_at, revoked_at)
  on public.capture_tokens to authenticated;

drop policy if exists "Users can view own capture tokens" on public.capture_tokens;
create policy "Users can view own capture tokens"
  on public.capture_tokens for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.create_capture_token(
  p_workspace_id uuid,
  p_name text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_token text;
begin
  if v_uid is null or not public.is_workspace_member(p_workspace_id) then
    raise exception 'nao_membro';
  end if;

  -- Dois pedidos ao mesmo tempo não passam juntos do limite.
  perform pg_advisory_xact_lock(hashtext('capture_tokens:' || v_uid::text));

  if (
    select count(*) from public.capture_tokens
    where user_id = v_uid and revoked_at is null
  ) >= 10 then
    raise exception 'limite_tokens';
  end if;

  v_token := 'fac_' || encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.capture_tokens (user_id, workspace_id, name, token_hash)
  values (v_uid, p_workspace_id, btrim(p_name), encode(extensions.digest(v_token, 'sha256'), 'hex'));

  return v_token;
end;
$$;

revoke all on function public.create_capture_token(uuid, text) from public, anon;
grant execute on function public.create_capture_token(uuid, text) to authenticated;

create or replace function public.revoke_capture_token(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.capture_tokens
  set revoked_at = now()
  where id = p_id and user_id = auth.uid() and revoked_at is null;
end;
$$;

revoke all on function public.revoke_capture_token(uuid) from public, anon;
grant execute on function public.revoke_capture_token(uuid) to authenticated;

-- 2. plano da carteira (stub) -------------------------------------------------
-- Todas as carteiras são 'familia' até o Bloco 4 (spec §9).
create or replace function public.workspace_plan(p_workspace_id uuid)
returns text
language sql
stable
set search_path = ''
as $$
  select 'familia'::text;
$$;

revoke all on function public.workspace_plan(uuid) from public, anon;
grant execute on function public.workspace_plan(uuid) to authenticated, service_role;

-- 3. colunas novas ------------------------------------------------------------
-- O nome do cartão na Wallet do iPhone, aprendido em "A conferir".
alter table public.credit_cards
  add column if not exists wallet_alias text;

alter table public.credit_cards drop constraint if exists credit_cards_wallet_alias_check;
alter table public.credit_cards
  add constraint credit_cards_wallet_alias_check
  check (wallet_alias is null or char_length(wallet_alias) between 1 and 60);

-- O que a captura recebeu e não casou (`{ walletCard?, texto? }`).
alter table public.transactions
  add column if not exists capture_meta jsonb;

alter table public.workspace_member_notification_prefs
  add column if not exists notify_review boolean not null default true;

-- 4. lembrete das 20h ---------------------------------------------------------
-- Um aviso por pessoa, carteira e dia. Só a service role lê e grava.
create table if not exists public.review_reminder_dedupe (
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  sent_on date not null,
  primary key (user_id, workspace_id, sent_on)
);

create index if not exists idx_review_reminder_dedupe_workspace
  on public.review_reminder_dedupe (workspace_id);

alter table public.review_reminder_dedupe enable row level security;
revoke all on public.review_reminder_dedupe from anon, authenticated;

-- O aviso do lembrete é do tipo 'review' (o check só aumenta: o front antigo
-- mostra o tipo novo com o sino padrão).
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type = any (array['transaction', 'budget', 'system', 'promotion', 'credit_card', 'bill', 'review']));

-- 23h UTC = 20h em Brasília (hosted: extensão presente; local: no-op).
do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(j.jobid) from cron.job j
    where j.jobname = 'review-reminder-daily';
    perform cron.schedule(
      'review-reminder-daily', '0 23 * * *',
      $cmd$select public.invoke_edge_function('review-reminder')$cmd$
    );
  end if;
end;
$cron$;
