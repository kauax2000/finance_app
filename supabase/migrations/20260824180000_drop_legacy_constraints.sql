-- Fase CONTRACT do expand/contract das migrações 150000 e 152000.
--
-- ⚠ APLICAR SOMENTE DEPOIS DO DEPLOY DO CLIENTE NOVO (Vercel).
--
-- As migrações 150000/152000 adicionaram as constraints novas mantendo as
-- legadas, para o cliente em produção (que ainda usa os alvos antigos de
-- `onConflict`) continuar funcionando durante a transição. Esta migração
-- remove as legadas e completa a mudança semântica:
--
--   * budgets: deixa de ser único por (user_id, categoria, mês) e passa a ser
--     único por (workspace_id, categoria, mês) — orçamento é do workspace;
--   * client_id: deixa de ser único global e passa a ser único por workspace.
--
-- Alvos de `onConflict` que o cliente PRECISA estar usando antes disto:
--   budgets            → "workspace_id,category_id,period_start"
--   demais entidades   → "workspace_id,client_id"

drop index if exists public.idx_budgets_user_category_period;

alter table public.transactions drop constraint if exists transactions_client_id_key;
alter table public.categories drop constraint if exists categories_client_id_key;
alter table public.credit_cards drop constraint if exists credit_cards_client_id_key;
alter table public.bills drop constraint if exists bills_client_id_key;
alter table public.bill_instances drop constraint if exists bill_instances_client_id_key;
alter table public.workspace_subscriptions drop constraint if exists workspace_subscriptions_client_id_key;
alter table public.budgets drop constraint if exists budgets_client_id_key;
