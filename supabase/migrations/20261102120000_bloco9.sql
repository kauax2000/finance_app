-- Bloco 9 — correções antes do lançamento (Decisões 2, 3, 4, 5, 6 e 12a).
--
-- Só acrescenta: o front de `main` continua no ar e usa este banco. A única
-- coisa que cai é a assinatura antiga do `criar_plano_parcelado`, que só a
-- service role chama; o `create_workspace_installment_plan` do `main` a chama
-- por posição e cai na nova pelos `default`s.
--
-- Ordem de publicação: a Edge `workspace-invites-accept` com o `ex_convidado`
-- sobe ANTES desta migração (sem ela, o status novo cai no `default` e vira
-- 500). A `capture` nova sobe DEPOIS (ela manda `p_client_id`, que a função
-- antiga não conhece).

-- 1. o titular que sai (#66, Decisão 2) ---------------------------------------
-- Quem sai da carteira, ou vira convidado, deixa de ser titular dos cartões
-- dela: o cartão volta a ser "da casa". O `conferir_titular` passa: quem tira
-- ou rebaixa é o dono, quem sai limpa o próprio e a service role não tem
-- sessão. Pula a cascata (a carteira apagada, a conta excluída: o
-- `holder_user_id` já é `on delete set null`). `security definer`: o cartão é
-- gravado sem depender da RLS de quem sai.
create or replace function public.soltar_titular_que_sai()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;
  if tg_op = 'UPDATE' and new.role in ('owner', 'member') then
    return null;
  end if;
  if not exists (select 1 from public.workspaces w where w.id = old.workspace_id) then
    return null;
  end if;

  update public.credit_cards
  set holder_user_id = null
  where workspace_id = old.workspace_id
    and holder_user_id = old.user_id;
  return null;
end;
$$;

revoke all on function public.soltar_titular_que_sai() from public, anon, authenticated;

-- O `when` não lê `new`: um gatilho de DELETE não pode. O papel novo é
-- conferido no corpo.
drop trigger if exists soltar_titular_que_sai on public.workspace_members;
create trigger soltar_titular_que_sai
  after delete or update of role on public.workspace_members
  for each row
  when (old.role in ('owner', 'member'))
  execute function public.soltar_titular_que_sai();

-- 2. o anexo de outro (#57, Decisão 3) ----------------------------------------
-- O corpo de 20261022130000, mais o dono do objeto: quem não é adulto só cria
-- a linha de um objeto que ele mesmo subiu (senão reivindicaria um objeto
-- órfão da carteira e passaria a lê-lo). A captura e a service role não têm
-- `auth.uid()` e passam; o adulto lê a carteira inteira de qualquer jeito.
create or replace function public.attachments_enforce_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usado bigint;
  v_tamanho bigint;
  v_dono text;
begin
  -- O tamanho que conta é o do objeto no bucket, nunca o que o cliente mandou.
  -- O check de `size_bytes` roda depois deste trigger, já sobre o valor real.
  select (o.metadata->>'size')::bigint, o.owner_id into v_tamanho, v_dono
  from storage.objects o
  where o.bucket_id = 'attachments' and o.name = new.path;

  if v_tamanho is null then
    raise exception 'anexo_sem_objeto';
  end if;

  if auth.uid() is not null
     and not public.is_workspace_adult(new.workspace_id)
     and v_dono is distinct from auth.uid()::text then
    raise exception 'anexo_de_outro' using errcode = '42501';
  end if;
  new.size_bytes := v_tamanho;

  -- Dois envios ao mesmo tempo não passam juntos da cota.
  perform pg_advisory_xact_lock(hashtext('attachments_quota:' || new.workspace_id::text));

  select coalesce(sum(size_bytes), 0) into v_usado
  from public.attachments
  where workspace_id = new.workspace_id;

  if v_usado + new.size_bytes > 26214400 then
    raise exception 'cota_anexos_excedida'
      using detail = format('carteira %s: %s bytes em uso', new.workspace_id, v_usado);
  end if;
  return new;
end;
$$;

revoke all on function public.attachments_enforce_quota() from public, anon, authenticated;

-- 3. o ex-convidado (#60, Decisão 4) ------------------------------------------
-- Quem saiu (ou foi tirado) como convidado não volta como membro por um link:
-- o link é aberto a quem tiver a URL, e o convidado a tinha visto. Um convite
-- por e-mail é a escolha do dono e passa. Ninguém do cliente lê nem grava.
create table if not exists public.workspace_ex_convidados (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  saiu_em timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table public.workspace_ex_convidados enable row level security;
revoke all on public.workspace_ex_convidados from anon, authenticated;

-- Pula a cascata: com a carteira ou a conta sendo apagadas, a linha nasceria
-- presa a um pai que está saindo.
create or replace function public.lembrar_ex_convidado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1
     or not exists (select 1 from public.workspaces w where w.id = old.workspace_id) then
    return null;
  end if;

  insert into public.workspace_ex_convidados (workspace_id, user_id)
  values (old.workspace_id, old.user_id)
  on conflict (workspace_id, user_id) do update set saiu_em = now();
  return null;
end;
$$;

revoke all on function public.lembrar_ex_convidado() from public, anon, authenticated;

drop trigger if exists lembrar_ex_convidado on public.workspace_members;
create trigger lembrar_ex_convidado
  after delete on public.workspace_members
  for each row
  when (old.role = 'guest')
  execute function public.lembrar_ex_convidado();

-- O corpo de 20261029120000, com a recusa do link ao ex-convidado e a
-- lembrança apagada quando ele entra (pelo e-mail).
create or replace function public.accept_workspace_invite(
  p_token_hash text,
  p_user_id uuid,
  p_user_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.workspace_invites%rowtype;
  v_email text := lower(coalesce(trim(p_user_email), ''));
  v_next_usage integer;
  v_exhausted boolean;
begin
  if p_user_id is null then
    return jsonb_build_object('status', 'invalid_user');
  end if;
  if v_email = '' then
    return jsonb_build_object('status', 'invalid_user');
  end if;

  select * into v_invite
  from public.workspace_invites
  where token_hash = p_token_hash
  for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  -- Idempotente: clicar de novo depois de entrar não é erro.
  if exists (
    select 1 from public.workspace_members
    where workspace_id = v_invite.workspace_id and user_id = p_user_id
  ) then
    return jsonb_build_object(
      'status', 'already_member',
      'workspace_id', v_invite.workspace_id
    );
  end if;

  if v_invite.status <> 'pending' then
    return jsonb_build_object('status', 'not_pending', 'workspace_id', v_invite.workspace_id);
  end if;

  if v_invite.expires_at < now() then
    update public.workspace_invites set status = 'expired' where id = v_invite.id;
    return jsonb_build_object('status', 'expired', 'workspace_id', v_invite.workspace_id);
  end if;

  -- Depois de revogado/expirado, para o link responder o estado real.
  -- O link não tem e-mail: o ex-convidado volta só por um convite por e-mail.
  if v_invite.invited_email is null and exists (
    select 1 from public.workspace_ex_convidados x
    where x.workspace_id = v_invite.workspace_id and x.user_id = p_user_id
  ) then
    return jsonb_build_object('status', 'ex_convidado', 'workspace_id', v_invite.workspace_id);
  end if;

  if v_invite.invited_email is not null
     and lower(trim(v_invite.invited_email)) <> v_email then
    return jsonb_build_object('status', 'email_mismatch');
  end if;

  -- Reivindica antes de entrar: com a linha travada, o (max_uses + 1)-ésimo
  -- aceite simultâneo é recusado.
  if v_invite.max_uses is not null and v_invite.usage_count >= v_invite.max_uses then
    return jsonb_build_object('status', 'exhausted', 'workspace_id', v_invite.workspace_id);
  end if;

  v_next_usage := v_invite.usage_count + 1;
  v_exhausted := v_invite.max_uses is not null and v_next_usage >= v_invite.max_uses;

  update public.workspace_invites
  set usage_count = v_next_usage,
      status = case when v_exhausted then 'accepted' else status end,
      accepted_at = case when v_exhausted then now() else accepted_at end
  where id = v_invite.id;

  insert into public.workspace_members (workspace_id, user_id, role, sponsor_user_id)
  values (v_invite.workspace_id, p_user_id, v_invite.role,
    case when v_invite.role = 'guest' then v_invite.created_by end)
  on conflict (workspace_id, user_id) do nothing;

  delete from public.workspace_ex_convidados
  where workspace_id = v_invite.workspace_id and user_id = p_user_id;

  return jsonb_build_object(
    'status', 'accepted',
    'workspace_id', v_invite.workspace_id,
    'invite_id', v_invite.id,
    'created_by', v_invite.created_by
  );
end;
$$;

revoke all on function public.accept_workspace_invite(text, uuid, text) from public, anon, authenticated;
grant execute on function public.accept_workspace_invite(text, uuid, text) to service_role;

-- 4. a captura sem plano duplicado (#23, Decisão 5) ---------------------------
-- O corpo de 20261024120000, com a chave do reenvio: dois pedidos com o mesmo
-- `client_id` esperam um pelo outro na trava, e o segundo devolve o plano do
-- primeiro. A chave e a `capture_meta` vão na 1ª parcela aqui dentro, e não
-- num update à parte (o 2º esbarrava na chave única e ficava com outro plano).
-- Sem `p_client_id` (o app), nada muda.
drop function if exists public.criar_plano_parcelado(uuid, uuid, uuid, text, text, uuid, integer, numeric, numeric, date, text, boolean);

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
  p_needs_review boolean default false,
  p_client_id uuid default null,
  p_capture_meta jsonb default null
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

  if p_client_id is not null then
    perform pg_advisory_xact_lock(hashtext('plano:' || p_client_id::text));

    -- Em qualquer carteira da pessoa: entre dois reenvios o destino pode ter
    -- mudado (#95), e o plano que já existe vale.
    select t.installment_plan_id into v_plan_id
    from public.transactions t
    join public.workspace_members m on m.workspace_id = t.workspace_id and m.user_id = p_user_id
    where t.client_id = p_client_id
      and t.installment_plan_id is not null
    limit 1;

    if v_plan_id is not null then
      return v_plan_id;
    end if;
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

  -- O caminho padrão (o app) não escreve nada a mais. Um `p_source` nulo é o app.
  if coalesce(p_source, 'app') <> 'app' or p_needs_review then
    update public.transactions
    set source = coalesce(p_source, 'app'), needs_review = p_needs_review
    where installment_plan_id = v_plan_id;
  end if;

  if p_client_id is not null or p_capture_meta is not null then
    update public.transactions
    set client_id = p_client_id, capture_meta = p_capture_meta
    where id = (
      select t.id from public.transactions t
      where t.installment_plan_id = v_plan_id
      order by t.date, t.id
      limit 1
    );
  end if;

  return v_plan_id;
end;
$$;

revoke all on function public.criar_plano_parcelado(uuid, uuid, uuid, text, text, uuid, integer, numeric, numeric, date, text, boolean, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.criar_plano_parcelado(uuid, uuid, uuid, text, text, uuid, integer, numeric, numeric, date, text, boolean, uuid, jsonb) to service_role;

-- 5. a só leitura completa (#79, Decisão 6) -----------------------------------
-- O `garantir_escrita` de 20261025120000, sem mudar. A cascata da saída de um
-- membro (o limite dele) e a exclusão de conta passam pela profundidade e pela
-- sessão nula. Arquivar um projeto é update, e também para.
drop trigger if exists garantir_escrita on public.projects;
create trigger garantir_escrita before insert or update on public.projects
  for each row execute function public.garantir_escrita();

drop trigger if exists garantir_escrita on public.workspace_split_weights;
create trigger garantir_escrita before insert or update or delete on public.workspace_split_weights
  for each row execute function public.garantir_escrita();

drop trigger if exists garantir_escrita on public.workspace_member_limits;
create trigger garantir_escrita before insert or update or delete on public.workspace_member_limits
  for each row execute function public.garantir_escrita();

-- 6. o aviso de cobrança pendente (#87, Decisão 12a) --------------------------
-- O aviso de texto fixo fica pendente até a entrega dar certo, e o cron o
-- reenvia. O `false` padrão é o aviso de hoje, já entregue.
alter table public.billing_avisos
  add column if not exists pendente boolean not null default false;

-- O reenvio desiste depois de 7 tentativas sem sucesso (#97): o registro fica,
-- e a chave continua barrando o aviso repetido.
alter table public.billing_avisos
  add column if not exists tentativas integer not null default 0;
