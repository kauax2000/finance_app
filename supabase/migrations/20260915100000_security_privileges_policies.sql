-- Revisão geral · Fase 1a: privilégios de função, políticas e integridade.
--
-- O que os testes no Supabase local provaram antes desta migração:
-- - `run_subscription_billing`, `run_installment_billing` e
--   `charge_workspace_installment_plan_step` respondiam HTTP 200 só com a chave
--   anônima: o baseline dá `GRANT ALL ... TO anon`, e as migrações seguintes só
--   revogavam de `public`, o que não remove um grant explícito;
-- - `user_sessions` aceitava UPDATE/DELETE do dono, então uma sessão revogada
--   podia se reativar pelo PostgREST;
-- - o criador de uma carteira podia se reinserir como owner a qualquer momento;
-- - `transactions` não tinha trigger de `updated_at`.

-- ─── 1. Funções só do servidor ──────────────────────────────────────────────
-- Chamadas pela edge `run-recurring-billing` (service role) ou por outras
-- funções `security definer`. Nenhuma tela chama.
revoke all on function public.run_installment_billing() from public, anon, authenticated;
revoke all on function public.run_subscription_billing() from public, anon, authenticated;
revoke all on function public.charge_workspace_installment_plan_step(uuid) from public, anon, authenticated;
grant execute on function public.run_installment_billing() to service_role;
grant execute on function public.run_subscription_billing() to service_role;
grant execute on function public.charge_workspace_installment_plan_step(uuid) to service_role;

-- Funções de trigger: o EXECUTE é checado ao criar o trigger, não ao disparar,
-- então tirar o acesso dos papéis da API não muda o comportamento.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.seed_subscription_first_transaction() from public, anon, authenticated;
revoke all on function public.workspaces_before_delete_guard_and_cleanup() from public, anon, authenticated;
revoke all on function public.ensure_workspace_member_notification_prefs() from public, anon, authenticated;
revoke all on function public.set_credit_card_category_spend_alert_workspace() from public, anon, authenticated;

-- ─── 2. RPCs do app logado: fora do `anon` ──────────────────────────────────
-- `is_workspace_member`, `is_workspace_owner` e `workspace_role` ficam como
-- estão: são lidas dentro das políticas de RLS de todas as tabelas.
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.catch_up_recurring_billing()',
    'public.complete_workspace_categories_onboarding(uuid)',
    'public.create_workspace_installment_plan(uuid,uuid,text,text,uuid,integer,numeric,numeric,date)',
    'public.delete_workspace_installment_plan_cascade(uuid)',
    'public.delete_workspace(uuid)',
    'public.get_workspace_delete_impact(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end
$$;

-- ─── 3. Função nova não nasce executável pela API ───────────────────────────
-- Toda RPC criada daqui em diante precisa de `grant execute ... to authenticated`
-- explícito na própria migração.
--
-- O EXECUTE para PUBLIC é o padrão **global** do Postgres para funções, e uma
-- regra `in schema` só soma a esse padrão — não tira. Medido: com a revogação
-- escrita por schema, uma função criada depois ainda nascia com `=X/postgres`.
-- Por isso a primeira instrução é global.
alter default privileges for role postgres
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated;

-- ─── 4. Sessões e auditoria: escrita só pelas edge functions ────────────────
drop policy if exists "Users can insert own sessions" on public.user_sessions;
drop policy if exists "Users can update own sessions" on public.user_sessions;
drop policy if exists "Users can delete own sessions" on public.user_sessions;

drop policy if exists "Users can insert own activities" on public.user_activity_logs;
drop policy if exists "Users can delete own activities" on public.user_activity_logs;

-- ─── 5. Membros: o criador só se insere na carteira vazia ───────────────────
-- A contagem precisa ser `security definer`: dentro da política, uma subconsulta
-- em `workspace_members` só enxergaria as linhas que o próprio usuário pode ler
-- — e quem foi removido não lê nenhuma, então a guarda nunca dispararia.
create or replace function public.workspace_has_members(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members m where m.workspace_id = p_workspace_id
  );
$$;

revoke all on function public.workspace_has_members(uuid) from public, anon;
grant execute on function public.workspace_has_members(uuid) to authenticated, service_role;

-- Sem o ramo `is_workspace_owner`: nenhuma tela adiciona outra pessoa direto;
-- a entrada de convidados é pela RPC `accept_workspace_invite` (service role).
drop policy if exists "Owners can add members" on public.workspace_members;
create policy "Creator bootstraps own workspace" on public.workspace_members
  as permissive
  for insert
  to public
  with check (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_members.workspace_id
        and w.created_by = (select auth.uid())
    )
    and user_id = (select auth.uid())
    and role = 'owner'
    and not public.workspace_has_members(workspace_id)
  );

-- Chaves imutáveis e carteira nunca sem owner. A exclusão da própria carteira
-- (cascata) passa, porque a linha de `workspaces` já não existe quando os
-- membros são apagados; a exclusão de conta passa pela flag de sessão.
create or replace function public.workspace_members_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.workspace_id is distinct from old.workspace_id
       or new.user_id is distinct from old.user_id then
      raise exception 'WORKSPACE_MEMBER_IMMUTABLE_KEYS' using errcode = 'P0001';
    end if;
    if old.role = 'owner' and new.role <> 'owner'
       and not exists (
         select 1 from public.workspace_members m
         where m.workspace_id = old.workspace_id
           and m.role = 'owner'
           and m.user_id <> old.user_id
       ) then
      raise exception 'WORKSPACE_LAST_OWNER' using errcode = 'P0001';
    end if;
    return new;
  end if;

  if old.role = 'owner'
     and coalesce(current_setting('app.deleting_user', true), '') <> 'on'
     and exists (select 1 from public.workspaces w where w.id = old.workspace_id)
     and not exists (
       select 1 from public.workspace_members m
       where m.workspace_id = old.workspace_id
         and m.role = 'owner'
         and m.user_id <> old.user_id
     ) then
    raise exception 'WORKSPACE_LAST_OWNER' using errcode = 'P0001';
  end if;
  return old;
end;
$$;

revoke all on function public.workspace_members_guard() from public, anon, authenticated;

drop trigger if exists workspace_members_guard on public.workspace_members;
create trigger workspace_members_guard
  before update or delete on public.workspace_members
  for each row execute function public.workspace_members_guard();

-- ─── 6. Autoria ─────────────────────────────────────────────────────────────
-- INSERT: a linha nasce com o autor que está logado.
drop policy if exists "Workspace members can insert transactions" on public.transactions;
create policy "Workspace members can insert transactions" on public.transactions
  as permissive for insert to public
  with check (is_workspace_member(workspace_id) and user_id = (select auth.uid()));

drop policy if exists "Workspace members can insert categories" on public.categories;
create policy "Workspace members can insert categories" on public.categories
  as permissive for insert to public
  with check (is_workspace_member(workspace_id) and user_id = (select auth.uid()));

drop policy if exists "Workspace members can insert budgets" on public.budgets;
create policy "Workspace members can insert budgets" on public.budgets
  as permissive for insert to public
  with check (is_workspace_member(workspace_id) and user_id = (select auth.uid()));

-- UPDATE: o autor original fica. O front ainda manda `user_id` no payload de
-- edição (conserto na Fase 5); preservar em vez de recusar evita quebrar a
-- edição por outro membro enquanto isso.
create or replace function public.preserve_row_author()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.user_id := old.user_id;
  return new;
end;
$$;

revoke all on function public.preserve_row_author() from public, anon, authenticated;

drop trigger if exists preserve_transactions_author on public.transactions;
create trigger preserve_transactions_author
  before update on public.transactions
  for each row execute function public.preserve_row_author();

drop trigger if exists preserve_categories_author on public.categories;
create trigger preserve_categories_author
  before update on public.categories
  for each row execute function public.preserve_row_author();

-- ─── 7. Referência a categoria/cartão de outra carteira ─────────────────────
-- TG_ARGV[0] = coluna, TG_ARGV[1] = tabela referenciada.
create or replace function public.assert_same_workspace_ref()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
  v_ws uuid;
begin
  v_ref := to_jsonb(new) ->> tg_argv[0];
  if v_ref is null then
    return new;
  end if;

  execute format('select workspace_id from public.%I where id = $1', tg_argv[1])
    into v_ws
    using v_ref::uuid;

  if v_ws is null or v_ws <> new.workspace_id then
    raise exception 'CROSS_WORKSPACE_REFERENCE'
      using errcode = '23503',
            detail = format('%s.%s aponta para %s de outra carteira', tg_table_name, tg_argv[0], tg_argv[1]);
  end if;
  return new;
end;
$$;

revoke all on function public.assert_same_workspace_ref() from public, anon, authenticated;

do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('transactions', 'category_id', 'categories'),
      ('transactions', 'payment_credit_card_id', 'credit_cards'),
      ('bills', 'category_id', 'categories'),
      ('bills', 'default_payment_credit_card_id', 'credit_cards'),
      ('bill_instances', 'payment_credit_card_id', 'credit_cards'),
      ('budgets', 'category_id', 'categories'),
      ('workspace_installment_plans', 'category_id', 'categories'),
      ('workspace_installment_plans', 'payment_credit_card_id', 'credit_cards'),
      ('workspace_subscriptions', 'category_id', 'categories'),
      ('workspace_subscriptions', 'payment_credit_card_id', 'credit_cards'),
      ('credit_card_invoice_payments', 'credit_card_id', 'credit_cards')
    ) as t(tabela, coluna, alvo)
  loop
    execute format('drop trigger if exists %I on public.%I', 'same_ws_' || r.coluna, r.tabela);
    execute format(
      'create trigger %I before insert or update of %I on public.%I for each row execute function public.assert_same_workspace_ref(%L, %L)',
      'same_ws_' || r.coluna, r.coluna, r.tabela, r.coluna, r.alvo
    );
  end loop;
end
$$;

-- ─── 8. E-mail do perfil vem de `auth.users`, não da API ────────────────────
revoke insert, update, delete on public.profiles from anon;
revoke insert, update on public.profiles from authenticated;
grant update (full_name, avatar_url, avatar_color, updated_at) on public.profiles to authenticated;

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email, updated_at = now()
  where id = new.id;
  return new;
end;
$$;

revoke all on function public.sync_profile_email() from public, anon, authenticated;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

-- ─── 9. `transactions.updated_at` ───────────────────────────────────────────
drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();
