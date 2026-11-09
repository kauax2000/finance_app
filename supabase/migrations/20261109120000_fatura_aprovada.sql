-- Fatura aprovada: a pessoa confirma que o app bate com o banco naquele ciclo.
alter table public.credit_card_statement_totals
  add column if not exists approved_at timestamptz null,
  add column if not exists approved_by uuid null references auth.users(id) on delete set null;

create index if not exists idx_cc_statement_totals_approved_by_fk
  on public.credit_card_statement_totals (approved_by);
