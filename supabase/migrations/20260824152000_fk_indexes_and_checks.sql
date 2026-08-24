-- Integridade e performance (Fase 5): índices de FK, remoção de índices
-- redundantes, check constraints de sanidade e client_id por workspace.

-- ---------------------------------------------------------------------------
-- 1. FKs sem índice (cada DELETE/UPDATE no pai fazia full scan no filho)
-- ---------------------------------------------------------------------------
create index if not exists idx_transactions_category_fk
  on public.transactions (category_id) where category_id is not null;
create index if not exists idx_transactions_payment_card_fk
  on public.transactions (payment_credit_card_id) where payment_credit_card_id is not null;
create index if not exists idx_bills_category_fk
  on public.bills (category_id) where category_id is not null;
create index if not exists idx_bills_payment_card_fk
  on public.bills (default_payment_credit_card_id) where default_payment_credit_card_id is not null;
create index if not exists idx_bill_instances_transaction_fk
  on public.bill_instances (transaction_id) where transaction_id is not null;
create index if not exists idx_bill_instances_payment_card_fk
  on public.bill_instances (payment_credit_card_id) where payment_credit_card_id is not null;
create index if not exists idx_ws_subscriptions_category_fk
  on public.workspace_subscriptions (category_id) where category_id is not null;
create index if not exists idx_ws_subscriptions_payment_card_fk
  on public.workspace_subscriptions (payment_credit_card_id) where payment_credit_card_id is not null;
create index if not exists idx_ws_installment_plans_category_fk
  on public.workspace_installment_plans (category_id) where category_id is not null;
create index if not exists idx_ws_installment_plans_payment_card_fk
  on public.workspace_installment_plans (payment_credit_card_id) where payment_credit_card_id is not null;
create index if not exists idx_cc_category_alerts_category_fk
  on public.credit_card_category_spend_alerts (category_id) where category_id is not null;
create index if not exists idx_transaction_splits_category_fk
  on public.transaction_splits (category_id) where category_id is not null;
create index if not exists idx_cc_invoice_payments_created_by_fk
  on public.credit_card_invoice_payments (created_by);

-- ---------------------------------------------------------------------------
-- 2. Índices redundantes
-- ---------------------------------------------------------------------------
-- prefixo da PK (workspace_id, user_id)
drop index if exists public.idx_workspace_members_workspace;
-- duplicam os índices das constraints UNIQUE de client_id
drop index if exists public.transactions_client_id_idx;
drop index if exists public.categories_client_id_idx;
-- subsumido pela unique (workspace_id, credit_card_id, statement_close_date)
drop index if exists public.idx_credit_card_invoice_payments_card_workspace;
-- prefixo de idx_transactions_workspace_subscription_date
drop index if exists public.idx_transactions_workspace_subscription;
-- dominado por idx_transactions_workspace_date_desc
drop index if exists public.idx_transactions_date;

-- ---------------------------------------------------------------------------
-- 3. Checks de sanidade (NOT VALID → VALIDATE: anomalias existentes aparecem
--    no VALIDATE sem bloquear o ALTER)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'transactions_amount_positive') then
    alter table public.transactions
      add constraint transactions_amount_positive check (amount > 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'workspace_subscriptions_amount_positive') then
    alter table public.workspace_subscriptions
      add constraint workspace_subscriptions_amount_positive check (amount > 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'credit_cards_limit_positive') then
    alter table public.credit_cards
      add constraint credit_cards_limit_positive
      check (credit_limit is null or credit_limit > 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bill_instances_paid_requires_paid_at') then
    alter table public.bill_instances
      add constraint bill_instances_paid_requires_paid_at
      check (status <> 'paid' or paid_at is not null) not valid;
  end if;
end;
$$;

alter table public.transactions validate constraint transactions_amount_positive;
alter table public.workspace_subscriptions validate constraint workspace_subscriptions_amount_positive;
alter table public.credit_cards validate constraint credit_cards_limit_positive;
alter table public.bill_instances validate constraint bill_instances_paid_requires_paid_at;

-- ---------------------------------------------------------------------------
-- 4. client_id: escopo por workspace (era UNIQUE global — colisão entre
--    tenants virava UPDATE negado por RLS: oráculo de existência cross-tenant
--    e falha de sync indecifrável). PostgREST upsert usa `on_conflict=
--    workspace_id,client_id` (handlers offline atualizados junto).
-- ---------------------------------------------------------------------------
-- Fase EXPAND: as UNIQUE globais de client_id são MANTIDAS aqui. O cliente em
-- produção ainda faz `upsert(onConflict: "client_id")` no replay offline e
-- quebraria se elas sumissem agora. A remoção é a fase CONTRACT, na migração
-- 20260824180000, aplicável só depois do deploy do cliente novo.
-- (client_id é UUID v4: a coexistência é inofensiva — a global é apenas mais
--  restritiva que a nova, e colisão real entre tenants é improvável.)

alter table public.transactions
  add constraint transactions_workspace_client_id_key unique (workspace_id, client_id);
alter table public.categories
  add constraint categories_workspace_client_id_key unique (workspace_id, client_id);
alter table public.credit_cards
  add constraint credit_cards_workspace_client_id_key unique (workspace_id, client_id);
alter table public.bills
  add constraint bills_workspace_client_id_key unique (workspace_id, client_id);
alter table public.bill_instances
  add constraint bill_instances_workspace_client_id_key unique (workspace_id, client_id);
alter table public.workspace_subscriptions
  add constraint workspace_subscriptions_workspace_client_id_key unique (workspace_id, client_id);
alter table public.budgets
  add constraint budgets_workspace_client_id_key unique (workspace_id, client_id);
