-- MCP: o token OAuth de uma IA (Claude, ChatGPT) só lê, e só insere lançamento.
--
-- O token que o Supabase Auth emite para um cliente OAuth é um JWT comum da
-- pessoa (`role = authenticated`) com a claim `client_id`. Com a chave anônima
-- ele chegaria ao `/rest/v1` como a própria pessoa e poderia alterar ou apagar
-- tudo o que ela pode (antiobjetivo da spec 2026-10-27-mcp-conectar-ia). A
-- sessão do app não tem `client_id`.
--
-- Políticas `as restrictive` entram em AND com as permissivas que já existem:
-- para a sessão do app nada muda. O residual (RPCs `security definer` que
-- escrevem e não passam pelo RLS) está em `supabase/MCP_DEPLOYMENT.md`.
--
-- Só acrescenta, fora a assinatura antiga do `create_workspace_installment_plan`:
-- o front de `main` a chama por nome com 9 argumentos e cai na nova pelos
-- `default`s.

-- 1. quem é token de IA -------------------------------------------------------
create or replace function public.eh_token_de_ia()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'client_id', '') <> ''
$$;

revoke all on function public.eh_token_de_ia() from public, anon;
grant execute on function public.eh_token_de_ia() to authenticated, service_role;

-- 2. tabelas: nada de update nem delete; insert só em `transactions` -----------
-- Toda tabela de `public` com política de escrita para quem está logado (as
-- três operações em todas, para uma política permissiva nova não abrir a
-- porta). `(select …)`: avaliada uma vez por consulta (initplan).
do $$
declare
  t text;
  op text;
begin
  foreach t in array array[
    'attachments',
    'bill_instances',
    'bills',
    'budgets',
    'categories',
    'credit_card_category_spend_alerts',
    'credit_card_invoice_payments',
    'credit_card_statement_totals',
    'credit_cards',
    'insights_silenciados',
    'notifications',
    'profiles',
    'projects',
    'push_subscriptions',
    'settlements',
    'transactions',
    'user_settings',
    'workspace_installment_plans',
    'workspace_invites',
    'workspace_member_limits',
    'workspace_member_notification_prefs',
    'workspace_members',
    'workspace_split_weights',
    'workspace_subscriptions',
    'workspaces'
  ] loop
    foreach op in array array['insert', 'update', 'delete'] loop
      execute format('drop policy if exists %I on public.%I', 'ia_somente_leitura_' || op, t);
      -- O lançamento da IA é o insert permitido (a política do passo 3).
      continue when t = 'transactions' and op = 'insert';
      execute format(
        'create policy %I on public.%I as restrictive for %s to authenticated %s (not (select public.eh_token_de_ia()))',
        'ia_somente_leitura_' || op, t, op, case op when 'insert' then 'with check' else 'using' end
      );
    end loop;
  end loop;
end
$$;

-- 3. o lançamento da IA não passa por um feito à mão ---------------------------
-- Antiobjetivo: "um lançamento criado pela IA ficar indistinguível de um feito
-- à mão". O MCP já grava assim; a política impede o `/rest/v1` direto.
drop policy if exists ia_lancamento_marcado on public.transactions;
create policy ia_lancamento_marcado on public.transactions
  as restrictive
  for insert
  to authenticated
  with check (not (select public.eh_token_de_ia()) or (source = 'ia_externa' and needs_review));

-- 4. storage: o token da IA não sobe, troca nem apaga arquivo -----------------
drop policy if exists ia_somente_leitura_insert on storage.objects;
create policy ia_somente_leitura_insert on storage.objects
  as restrictive
  for insert
  to authenticated
  with check (not (select public.eh_token_de_ia()));

drop policy if exists ia_somente_leitura_update on storage.objects;
create policy ia_somente_leitura_update on storage.objects
  as restrictive
  for update
  to authenticated
  using (not (select public.eh_token_de_ia()));

drop policy if exists ia_somente_leitura_delete on storage.objects;
create policy ia_somente_leitura_delete on storage.objects
  as restrictive
  for delete
  to authenticated
  using (not (select public.eh_token_de_ia()));

-- 5. o parcelado marca a origem dentro da RPC ----------------------------------
-- O MCP gravava `source`, `needs_review` e `capture_meta` num update depois da
-- RPC, que o passo 2 agora barra. Os três vão para o `criar_plano_parcelado`
-- (20261102120000), que já os grava. Com token de IA a marca não é opcional.
drop function if exists public.create_workspace_installment_plan(uuid, uuid, text, text, uuid, integer, numeric, numeric, date);

create or replace function public.create_workspace_installment_plan(
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
  p_capture_meta jsonb default null
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

  if public.eh_token_de_ia() then
    p_source := 'ia_externa';
    p_needs_review := true;
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
    p_next_billing_date,
    p_source,
    p_needs_review,
    null,
    p_capture_meta
  );
end;
$$;

revoke all on function public.create_workspace_installment_plan(uuid, uuid, text, text, uuid, integer, numeric, numeric, date, text, boolean, jsonb) from public, anon;
grant execute on function public.create_workspace_installment_plan(uuid, uuid, text, text, uuid, integer, numeric, numeric, date, text, boolean, jsonb) to authenticated, service_role;
