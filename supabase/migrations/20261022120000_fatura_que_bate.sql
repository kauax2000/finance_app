-- Fatura que bate (Bloco 2): colunas de importação em `transactions`, o total
-- que o banco informa para cada fatura e o aviso aos membros que ignora o que
-- veio de importação (um histórico importado viraria enxurrada de avisos).

-- 1. transactions: origem, revisão e lote de importação -----------------------
alter table public.transactions
  add column if not exists source text not null default 'app',
  add column if not exists needs_review boolean not null default false,
  add column if not exists import_batch_id uuid;

alter table public.transactions drop constraint if exists transactions_source_check;
alter table public.transactions
  add constraint transactions_source_check check (source in (
    'app', 'quick_text', 'shortcut', 'apple_pay', 'whatsapp', 'share',
    'import_pdf', 'import_sheet', 'import_statement', 'recurring'
  ));

create index if not exists idx_transactions_import_batch
  on public.transactions (import_batch_id)
  where import_batch_id is not null;

-- 2. total da fatura segundo o banco ------------------------------------------
create table if not exists public.credit_card_statement_totals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  credit_card_id uuid not null references public.credit_cards(id) on delete cascade,
  statement_close_date date not null,
  bank_total numeric(15, 2) not null,
  source text not null check (source in ('manual', 'pdf', 'csv', 'ofx')),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, credit_card_id, statement_close_date)
);

create index if not exists idx_cc_statement_totals_card_close
  on public.credit_card_statement_totals (credit_card_id, statement_close_date desc);
create index if not exists idx_cc_statement_totals_created_by_fk
  on public.credit_card_statement_totals (created_by);

drop trigger if exists set_credit_card_statement_totals_updated_at on public.credit_card_statement_totals;
create trigger set_credit_card_statement_totals_updated_at
  before update on public.credit_card_statement_totals
  for each row execute function public.set_updated_at();

drop trigger if exists same_ws_credit_card_id on public.credit_card_statement_totals;
create trigger same_ws_credit_card_id
  before insert or update of credit_card_id on public.credit_card_statement_totals
  for each row execute function public.assert_same_workspace_ref('credit_card_id', 'credit_cards');

alter table public.credit_card_statement_totals enable row level security;
revoke all on public.credit_card_statement_totals from anon;

drop policy if exists "Workspace members can view credit_card_statement_totals" on public.credit_card_statement_totals;
create policy "Workspace members can view credit_card_statement_totals"
  on public.credit_card_statement_totals for select
  using (is_workspace_member(workspace_id));

drop policy if exists "Workspace members can insert credit_card_statement_totals" on public.credit_card_statement_totals;
create policy "Workspace members can insert credit_card_statement_totals"
  on public.credit_card_statement_totals for insert
  with check (is_workspace_member(workspace_id) and created_by = (select auth.uid()));

drop policy if exists "Workspace members can update credit_card_statement_totals" on public.credit_card_statement_totals;
create policy "Workspace members can update credit_card_statement_totals"
  on public.credit_card_statement_totals for update
  using (is_workspace_member(workspace_id));

drop policy if exists "Workspace members can delete credit_card_statement_totals" on public.credit_card_statement_totals;
create policy "Workspace members can delete credit_card_statement_totals"
  on public.credit_card_statement_totals for delete
  using (is_workspace_member(workspace_id));

-- 3. aviso aos membros: importação não avisa ----------------------------------
drop trigger if exists transactions_notify_created on public.transactions;
create trigger transactions_notify_created
  after insert on public.transactions
  for each row
  when (
    new.type = 'expense'
    and new.subscription_id is null
    and new.installment_plan_id is null
    and new.import_batch_id is null
  )
  execute function public.transactions_notify_created();
