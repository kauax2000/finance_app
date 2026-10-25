-- Bloco 7A — Papéis (spec §12): o convidado (`guest`) e a RLS da casa.
--
-- Só acrescenta: os checks só crescem (`guest` entra, nada sai), as colunas
-- novas têm padrão e o convite sem `role` continua `member`. Até o 2.0
-- convidar alguém como `guest`, nenhuma política daqui muda nada para quem usa
-- o front de `main`: para dono e membro, `is_workspace_adult` vale o mesmo que
-- `is_workspace_member`.
--
-- O convidado lança despesa, vê e mexe só nas dele, lê categorias e cartões e
-- não vê orçamento, contas, faturas, assinaturas, parcelamentos nem os
-- insights da casa. Sem plano, nada disso se desliga: o `garantir_escrita` não
-- mexe em RLS.

-- 1. o papel ------------------------------------------------------------------
-- `not valid` + `validate`: o lock forte não espera a varredura da tabela.
alter table public.workspace_members drop constraint if exists workspace_members_role_check;
alter table public.workspace_members
  add constraint workspace_members_role_check
  check (role in ('owner', 'member', 'guest'))
  not valid;
alter table public.workspace_members validate constraint workspace_members_role_check;

-- Quem responde pelo convidado (o 7C cobra dele). Nulo para os adultos.
alter table public.workspace_members
  add column if not exists sponsor_user_id uuid references auth.users(id) on delete set null;

create index if not exists workspace_members_sponsor_user_id_idx
  on public.workspace_members (sponsor_user_id) where sponsor_user_id is not null;

-- 2. o convite escolhe o papel ------------------------------------------------
-- O link é sempre de membro: o convidado entra pelo e-mail, que é onde mora o
-- consentimento do responsável (LGPD, art. 14) quando ele é menor.
alter table public.workspace_invites
  add column if not exists menor boolean not null default false;
alter table public.workspace_invites
  add column if not exists consentimento_em timestamptz;

alter table public.workspace_invites drop constraint if exists workspace_invites_role_check;
alter table public.workspace_invites
  add constraint workspace_invites_role_check
  check (role in ('member', 'guest'))
  not valid;
alter table public.workspace_invites validate constraint workspace_invites_role_check;

alter table public.workspace_invites drop constraint if exists workspace_invites_guest_requer_email;
alter table public.workspace_invites
  add constraint workspace_invites_guest_requer_email
  check (role = 'member' or invited_email is not null)
  not valid;
alter table public.workspace_invites validate constraint workspace_invites_guest_requer_email;

alter table public.workspace_invites drop constraint if exists workspace_invites_menor_requer_consentimento;
alter table public.workspace_invites
  add constraint workspace_invites_menor_requer_consentimento
  check (not menor or (role = 'guest' and consentimento_em is not null))
  not valid;
alter table public.workspace_invites validate constraint workspace_invites_menor_requer_consentimento;

-- 3. o adulto -----------------------------------------------------------------
-- Dono ou membro. O `is_workspace_member` não muda: o convidado é membro, e
-- as políticas que ele pode usar (lançar, ler categorias e cartões) seguem
-- com ele. `anon` executa, como nos outros helpers, para a política devolver
-- vazio em vez de erro de permissão.
create or replace function public.is_workspace_adult(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'member')
  );
$$;

revoke all on function public.is_workspace_adult(uuid) from public;
grant execute on function public.is_workspace_adult(uuid) to anon, authenticated, service_role;

-- 4. transactions -------------------------------------------------------------
-- O adulto vê e mexe em tudo, como hoje. O convidado, só nas dele (o autor é
-- `user_id`, que o `preserve_row_author` não deixa trocar). O insert fica como
-- está: membro e `user_id = auth.uid()`.
drop policy if exists "Workspace members can view transactions" on public.transactions;
create policy "Workspace members can view transactions" on public.transactions
  for select
  using (
    public.is_workspace_adult(workspace_id)
    or (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id))
  );

drop policy if exists "Workspace members can update transactions" on public.transactions;
create policy "Workspace members can update transactions" on public.transactions
  for update
  using (
    public.is_workspace_adult(workspace_id)
    or (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id))
  );

drop policy if exists "Workspace members can delete transactions" on public.transactions;
create policy "Workspace members can delete transactions" on public.transactions
  for delete
  using (
    public.is_workspace_adult(workspace_id)
    or (user_id = (select auth.uid()) and public.is_workspace_member(workspace_id))
  );

-- 5. categories e credit_cards: o convidado lê, o adulto escreve --------------
-- O `select` (membro) fica como está.
drop policy if exists "Workspace members can insert categories" on public.categories;
create policy "Workspace members can insert categories" on public.categories
  for insert
  with check (public.is_workspace_adult(workspace_id) and user_id = (select auth.uid()));

drop policy if exists "Workspace members can update categories" on public.categories;
create policy "Workspace members can update categories" on public.categories
  for update
  using (public.is_workspace_adult(workspace_id));

drop policy if exists "Workspace members can delete categories" on public.categories;
create policy "Workspace members can delete categories" on public.categories
  for delete
  using (public.is_workspace_adult(workspace_id));

drop policy if exists "Workspace members can insert credit cards" on public.credit_cards;
create policy "Workspace members can insert credit cards" on public.credit_cards
  for insert
  with check (public.is_workspace_adult(workspace_id) and user_id = (select auth.uid()));

drop policy if exists "Workspace members can update credit cards" on public.credit_cards;
create policy "Workspace members can update credit cards" on public.credit_cards
  for update
  using (public.is_workspace_adult(workspace_id));

drop policy if exists "Workspace members can delete credit cards" on public.credit_cards;
create policy "Workspace members can delete credit cards" on public.credit_cards
  for delete
  using (public.is_workspace_adult(workspace_id));

-- 6. as tabelas da casa: só o adulto ------------------------------------------
-- Orçamento, contas, assinaturas, parcelamentos e as faturas. O insert mantém
-- o autor de cada uma (`user_id` ou `created_by`).
drop policy if exists "Workspace members can view budgets" on public.budgets;
create policy "Workspace members can view budgets" on public.budgets
  for select
  using (public.is_workspace_adult(workspace_id));
drop policy if exists "Workspace members can insert budgets" on public.budgets;
create policy "Workspace members can insert budgets" on public.budgets
  for insert
  with check (public.is_workspace_adult(workspace_id) and user_id = (select auth.uid()));
drop policy if exists "Workspace members can update budgets" on public.budgets;
create policy "Workspace members can update budgets" on public.budgets
  for update
  using (public.is_workspace_adult(workspace_id));
drop policy if exists "Workspace members can delete budgets" on public.budgets;
create policy "Workspace members can delete budgets" on public.budgets
  for delete
  using (public.is_workspace_adult(workspace_id));

drop policy if exists "Workspace members can view bills" on public.bills;
create policy "Workspace members can view bills" on public.bills
  for select
  using (public.is_workspace_adult(workspace_id));
drop policy if exists "Workspace members can insert bills" on public.bills;
create policy "Workspace members can insert bills" on public.bills
  for insert
  with check (public.is_workspace_adult(workspace_id) and user_id = (select auth.uid()));
drop policy if exists "Workspace members can update bills" on public.bills;
create policy "Workspace members can update bills" on public.bills
  for update
  using (public.is_workspace_adult(workspace_id));
drop policy if exists "Workspace members can delete bills" on public.bills;
create policy "Workspace members can delete bills" on public.bills
  for delete
  using (public.is_workspace_adult(workspace_id));

drop policy if exists "Workspace members can view bill_instances" on public.bill_instances;
create policy "Workspace members can view bill_instances" on public.bill_instances
  for select
  using (public.is_workspace_adult(workspace_id));
drop policy if exists "Workspace members can insert bill_instances" on public.bill_instances;
create policy "Workspace members can insert bill_instances" on public.bill_instances
  for insert
  with check (public.is_workspace_adult(workspace_id) and user_id = (select auth.uid()));
drop policy if exists "Workspace members can update bill_instances" on public.bill_instances;
create policy "Workspace members can update bill_instances" on public.bill_instances
  for update
  using (public.is_workspace_adult(workspace_id));
drop policy if exists "Workspace members can delete bill_instances" on public.bill_instances;
create policy "Workspace members can delete bill_instances" on public.bill_instances
  for delete
  using (public.is_workspace_adult(workspace_id));

drop policy if exists "Workspace members can view workspace_subscriptions" on public.workspace_subscriptions;
create policy "Workspace members can view workspace_subscriptions" on public.workspace_subscriptions
  for select
  using (public.is_workspace_adult(workspace_id));
drop policy if exists "Workspace members can insert workspace_subscriptions" on public.workspace_subscriptions;
create policy "Workspace members can insert workspace_subscriptions" on public.workspace_subscriptions
  for insert
  with check (public.is_workspace_adult(workspace_id) and user_id = (select auth.uid()));
drop policy if exists "Workspace members can update workspace_subscriptions" on public.workspace_subscriptions;
create policy "Workspace members can update workspace_subscriptions" on public.workspace_subscriptions
  for update
  using (public.is_workspace_adult(workspace_id));
drop policy if exists "Workspace members can delete workspace_subscriptions" on public.workspace_subscriptions;
create policy "Workspace members can delete workspace_subscriptions" on public.workspace_subscriptions
  for delete
  using (public.is_workspace_adult(workspace_id));

-- A compra parcelada do convidado nasce pela RPC (definer): o plano fica
-- invisível a ele, e as parcelas são transações dele.
drop policy if exists "Workspace members can view workspace_installment_plans" on public.workspace_installment_plans;
create policy "Workspace members can view workspace_installment_plans" on public.workspace_installment_plans
  for select
  using (public.is_workspace_adult(workspace_id));
drop policy if exists "Workspace members can insert workspace_installment_plans" on public.workspace_installment_plans;
create policy "Workspace members can insert workspace_installment_plans" on public.workspace_installment_plans
  for insert
  with check (public.is_workspace_adult(workspace_id) and user_id = (select auth.uid()));
drop policy if exists "Workspace members can update workspace_installment_plans" on public.workspace_installment_plans;
create policy "Workspace members can update workspace_installment_plans" on public.workspace_installment_plans
  for update
  using (public.is_workspace_adult(workspace_id));
drop policy if exists "Workspace members can delete workspace_installment_plans" on public.workspace_installment_plans;
create policy "Workspace members can delete workspace_installment_plans" on public.workspace_installment_plans
  for delete
  using (public.is_workspace_adult(workspace_id));

drop policy if exists "Workspace members can view credit_card_invoice_payments" on public.credit_card_invoice_payments;
create policy "Workspace members can view credit_card_invoice_payments" on public.credit_card_invoice_payments
  for select
  using (public.is_workspace_adult(workspace_id));
drop policy if exists "Workspace members can insert credit_card_invoice_payments" on public.credit_card_invoice_payments;
create policy "Workspace members can insert credit_card_invoice_payments" on public.credit_card_invoice_payments
  for insert
  with check (public.is_workspace_adult(workspace_id) and created_by = (select auth.uid()));
drop policy if exists "Workspace members can update credit_card_invoice_payments" on public.credit_card_invoice_payments;
create policy "Workspace members can update credit_card_invoice_payments" on public.credit_card_invoice_payments
  for update
  using (public.is_workspace_adult(workspace_id));
drop policy if exists "Workspace members can delete credit_card_invoice_payments" on public.credit_card_invoice_payments;
create policy "Workspace members can delete credit_card_invoice_payments" on public.credit_card_invoice_payments
  for delete
  using (public.is_workspace_adult(workspace_id));

drop policy if exists "Workspace members can view credit_card_category_spend_alerts" on public.credit_card_category_spend_alerts;
create policy "Workspace members can view credit_card_category_spend_alerts" on public.credit_card_category_spend_alerts
  for select
  using (public.is_workspace_adult(workspace_id));
drop policy if exists "Workspace members can insert credit_card_category_spend_alerts" on public.credit_card_category_spend_alerts;
create policy "Workspace members can insert credit_card_category_spend_alerts" on public.credit_card_category_spend_alerts
  for insert
  with check (public.is_workspace_adult(workspace_id) and created_by = (select auth.uid()));
drop policy if exists "Workspace members can update credit_card_category_spend_alerts" on public.credit_card_category_spend_alerts;
create policy "Workspace members can update credit_card_category_spend_alerts" on public.credit_card_category_spend_alerts
  for update
  using (public.is_workspace_adult(workspace_id));
drop policy if exists "Workspace members can delete credit_card_category_spend_alerts" on public.credit_card_category_spend_alerts;
create policy "Workspace members can delete credit_card_category_spend_alerts" on public.credit_card_category_spend_alerts
  for delete
  using (public.is_workspace_adult(workspace_id));

drop policy if exists "Workspace members can view credit_card_statement_totals" on public.credit_card_statement_totals;
create policy "Workspace members can view credit_card_statement_totals" on public.credit_card_statement_totals
  for select
  using (public.is_workspace_adult(workspace_id));
drop policy if exists "Workspace members can insert credit_card_statement_totals" on public.credit_card_statement_totals;
create policy "Workspace members can insert credit_card_statement_totals" on public.credit_card_statement_totals
  for insert
  with check (public.is_workspace_adult(workspace_id) and created_by = (select auth.uid()));
drop policy if exists "Workspace members can update credit_card_statement_totals" on public.credit_card_statement_totals;
create policy "Workspace members can update credit_card_statement_totals" on public.credit_card_statement_totals
  for update
  using (public.is_workspace_adult(workspace_id));
drop policy if exists "Workspace members can delete credit_card_statement_totals" on public.credit_card_statement_totals;
create policy "Workspace members can delete credit_card_statement_totals" on public.credit_card_statement_totals
  for delete
  using (public.is_workspace_adult(workspace_id));

-- 7. anexos: o adulto, ou quem anexou -----------------------------------------
-- O insert (membro e `created_by = auth.uid()`) fica como está.
drop policy if exists "Workspace members can view attachments" on public.attachments;
create policy "Workspace members can view attachments" on public.attachments
  for select
  using (
    public.is_workspace_adult(workspace_id)
    or (created_by = (select auth.uid()) and public.is_workspace_member(workspace_id))
  );

drop policy if exists "Workspace members can delete attachments" on public.attachments;
create policy "Workspace members can delete attachments" on public.attachments
  for delete
  using (
    public.is_workspace_adult(workspace_id)
    or (created_by = (select auth.uid()) and public.is_workspace_member(workspace_id))
  );

-- No storage, a pasta é a carteira: o adulto dela, ou o dono do objeto (quem
-- subiu), ainda membro. O upload (membro da pasta) fica como está. Guardado
-- como em 20261022130000: alguns ambientes negam ao papel da migração as
-- políticas de storage.objects.
do $$
begin
  drop policy if exists "Workspace members can view attachments" on storage.objects;
  create policy "Workspace members can view attachments" on storage.objects
    for select to authenticated
    using (bucket_id = 'attachments' and case when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_workspace_adult(((storage.foldername(name))[1])::uuid)
        or (owner_id = (select auth.uid())::text and public.is_workspace_member(((storage.foldername(name))[1])::uuid))
      else false end);

  drop policy if exists "Workspace members can delete attachments" on storage.objects;
  create policy "Workspace members can delete attachments" on storage.objects
    for delete to authenticated
    using (bucket_id = 'attachments' and case when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_workspace_adult(((storage.foldername(name))[1])::uuid)
        or (owner_id = (select auth.uid())::text and public.is_workspace_member(((storage.foldername(name))[1])::uuid))
      else false end);
exception
  when insufficient_privilege then
    raise notice 'papeis: sem privilégio para as políticas de storage.objects; aplique pelo SQL editor do Dashboard.';
end;
$$;

-- 8. insights: os da casa só para o adulto ------------------------------------
-- O convidado vê só os dele (`user_id` = ele). O adulto, como hoje: os da
-- carteira e os dele.
drop policy if exists insights_select on public.insights;
create policy insights_select on public.insights
  for select to authenticated
  using (
    public.is_workspace_member(workspace_id)
    and (
      user_id = (select auth.uid())
      or (user_id is null and public.is_workspace_adult(workspace_id))
    )
    and not exists (
      select 1 from public.insights_silenciados s
      where s.user_id = (select auth.uid())
        and s.kind = insights.kind
    )
  );

-- O marcar segue a mesma regra da leitura: o convidado marca os dele, e não o
-- da carteira, que não vê.
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
    and (
      i.user_id = v_uid
      or (i.user_id is null and public.is_workspace_adult(i.workspace_id))
    )
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

-- O seguro baixo é a conta da casa: só o adulto o calcula e registra.
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
  if v_uid is null or not public.is_workspace_adult(p_workspace_id) then
    raise exception 'not a workspace member' using errcode = '42501';
  end if;

  if p_kind is distinct from 'seguro_baixo' then
    raise exception 'INSIGHT_TIPO_NAO_PERMITIDO' using errcode = '22023';
  end if;

  if length(p_dedupe_key) > 100 or pg_column_size(p_payload) > 8192 then
    raise exception 'INSIGHT_GRANDE_DEMAIS' using errcode = '22023';
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

-- 9. membros ------------------------------------------------------------------
-- O convidado também sai da carteira.
drop policy if exists "Members can leave workspace" on public.workspace_members;
create policy "Members can leave workspace" on public.workspace_members
  for delete
  using (user_id = (select auth.uid()) and public.workspace_role(workspace_id) in ('member', 'guest'));

-- O dono troca o papel, mas ninguém vira dono por `update` direto.
drop policy if exists "Owners can update member roles" on public.workspace_members;
create policy "Owners can update member roles" on public.workspace_members
  for update
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id) and role in ('member', 'guest'));

-- Trocar o papel. Só o dono chama; nunca na linha de um dono nem na própria.
-- O convidado ganha quem chamou como responsável, se ainda não tiver; o
-- membro perde o responsável. A troca fica no histórico de quem trocou.
create or replace function public.trocar_papel(p_workspace_id uuid, p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_anterior text;
begin
  if v_uid is null or not public.is_workspace_owner(p_workspace_id) then
    raise exception 'not a workspace owner' using errcode = '42501';
  end if;

  if p_role is null or p_role not in ('member', 'guest') then
    raise exception 'PAPEL_INVALIDO' using errcode = '22023';
  end if;

  if p_user_id = v_uid then
    raise exception 'PAPEL_PROPRIO' using errcode = '22023';
  end if;

  select m.role into v_anterior
  from public.workspace_members m
  where m.workspace_id = p_workspace_id
    and m.user_id = p_user_id
  for update;

  if not found then
    raise exception 'MEMBRO_NAO_ENCONTRADO' using errcode = 'P0002';
  end if;

  if v_anterior = 'owner' then
    raise exception 'PAPEL_DONO' using errcode = '22023';
  end if;

  update public.workspace_members m
  set role = p_role,
      sponsor_user_id = case when p_role = 'guest' then coalesce(m.sponsor_user_id, v_uid) end
  where m.workspace_id = p_workspace_id
    and m.user_id = p_user_id;

  if v_anterior is distinct from p_role then
    insert into public.user_activity_logs (user_id, type, description, metadata, status)
    values (
      v_uid,
      'family_role_changed',
      case when p_role = 'guest' then 'Papel trocado para convidado' else 'Papel trocado para membro' end,
      jsonb_build_object(
        'workspace_id', p_workspace_id,
        'member_user_id', p_user_id,
        'from', v_anterior,
        'to', p_role
      ),
      'success'
    );
  end if;
end;
$$;

revoke all on function public.trocar_papel(uuid, uuid, text) from public, anon;
grant execute on function public.trocar_papel(uuid, uuid, text) to authenticated;

-- 10. o aceite grava o papel do convite ---------------------------------------
-- O corpo de 20260824121000, com `v_invite.role` no lugar do `'member'` fixo
-- e o responsável do convidado (quem criou o convite).
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

-- 11. as RPCs da casa conferem adulto -----------------------------------------
-- As `security invoker` (pagar, pular e ligar conta; `virar_*`; os bundles de
-- Contas, Categoria e Assinaturas) não mudam: a RLS acima já barra o
-- convidado, e os bundles devolvem vazio para ele. As mensagens de erro ficam
-- as de hoje, que o front de `main` traduz.

create or replace function public.complete_workspace_categories_onboarding(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not public.is_workspace_adult(p_workspace_id) then
    raise exception 'not a workspace member';
  end if;

  update public.workspaces
  set
    categories_onboarding_completed_at = now(),
    updated_at = now()
  where id = p_workspace_id;
end;
$$;

-- Apagar um parcelamento apaga as parcelas de todos: é da casa.
create or replace function public.delete_workspace_installment_plan_cascade(p_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_workspace_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select workspace_id into v_workspace_id
  from public.workspace_installment_plans
  where id = p_plan_id;

  if not found then
    return;
  end if;

  if not public.is_workspace_adult(v_workspace_id) then
    raise exception 'Forbidden';
  end if;

  delete from public.transactions
  where installment_plan_id = p_plan_id;

  delete from public.workspace_installment_plans
  where id = p_plan_id;
end;
$$;

create or replace function public.garantir_orcamentos_do_mes(p_workspace_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_workspace_adult(p_workspace_id) then
    raise exception 'not a workspace member' using errcode = '42501';
  end if;

  return public.copiar_orcamentos_do_mes(date_trunc('month', public.app_today())::date, p_workspace_id);
end;
$$;
