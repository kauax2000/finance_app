-- Client-generated IDs for offline-first sync (idempotent upsert on replay)

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS client_id uuid UNIQUE;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS client_id uuid UNIQUE;

ALTER TABLE public.credit_cards
  ADD COLUMN IF NOT EXISTS client_id uuid UNIQUE;

ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS client_id uuid UNIQUE;

ALTER TABLE public.bill_instances
  ADD COLUMN IF NOT EXISTS client_id uuid UNIQUE;

ALTER TABLE public.workspace_subscriptions
  ADD COLUMN IF NOT EXISTS client_id uuid UNIQUE;

ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS client_id uuid UNIQUE;

CREATE INDEX IF NOT EXISTS transactions_client_id_idx ON public.transactions (client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS categories_client_id_idx ON public.categories (client_id) WHERE client_id IS NOT NULL;
