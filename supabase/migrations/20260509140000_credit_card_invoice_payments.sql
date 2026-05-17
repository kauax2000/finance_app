-- Manual tracking of credit-card invoice payment (per statement close date).

create table if not exists public.credit_card_invoice_payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  credit_card_id uuid not null references public.credit_cards(id) on delete cascade,
  statement_close_date date not null,
  status text not null default 'paid'
    constraint credit_card_invoice_payments_status_check
      check (status = 'paid'),
  paid_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_card_invoice_payments_unique_cycle
    unique (workspace_id, credit_card_id, statement_close_date)
);

create index if not exists idx_credit_card_invoice_payments_card_workspace
  on public.credit_card_invoice_payments(credit_card_id, workspace_id);

alter table public.credit_card_invoice_payments enable row level security;

drop policy if exists "Workspace members can view credit_card_invoice_payments"
  on public.credit_card_invoice_payments;
create policy "Workspace members can view credit_card_invoice_payments"
on public.credit_card_invoice_payments for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can insert credit_card_invoice_payments"
  on public.credit_card_invoice_payments;
create policy "Workspace members can insert credit_card_invoice_payments"
on public.credit_card_invoice_payments for insert
with check (
  public.is_workspace_member(workspace_id)
  and auth.uid() = created_by
);

drop policy if exists "Workspace members can update credit_card_invoice_payments"
  on public.credit_card_invoice_payments;
create policy "Workspace members can update credit_card_invoice_payments"
on public.credit_card_invoice_payments for update
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can delete credit_card_invoice_payments"
  on public.credit_card_invoice_payments;
create policy "Workspace members can delete credit_card_invoice_payments"
on public.credit_card_invoice_payments for delete
using (public.is_workspace_member(workspace_id));

do $$
begin
  if exists (
    select 1
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'set_updated_at'
  ) then
    drop trigger if exists set_credit_card_invoice_payments_updated_at
      on public.credit_card_invoice_payments;
    create trigger set_credit_card_invoice_payments_updated_at
      before update on public.credit_card_invoice_payments
      for each row execute function public.set_updated_at();
  end if;
end $$;
