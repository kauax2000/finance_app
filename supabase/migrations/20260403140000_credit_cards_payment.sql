-- Credit cards (workspace-scoped) + payment fields on transactions

create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  last_four text not null,
  brand text,
  closing_day smallint not null,
  due_day smallint not null,
  credit_limit numeric(15, 2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_cards_closing_day_range check (closing_day >= 1 and closing_day <= 31),
  constraint credit_cards_due_day_range check (due_day >= 1 and due_day <= 31),
  constraint credit_cards_last_four_digits check (last_four ~ '^[0-9]{4}$')
);

create index if not exists idx_credit_cards_workspace_id on public.credit_cards(workspace_id);

alter table public.transactions
  add column if not exists payment_method text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transactions_payment_method_check'
  ) then
    alter table public.transactions
      add constraint transactions_payment_method_check
      check (
        payment_method is null
        or payment_method in ('pix','ted','debit_card','credit_card','cash','other')
      );
  end if;
end $$;

alter table public.transactions
  add column if not exists payment_credit_card_id uuid references public.credit_cards(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transactions_payment_card_matches_method'
  ) then
    alter table public.transactions
      add constraint transactions_payment_card_matches_method check (
        payment_credit_card_id is null or payment_method = 'credit_card'
      );
  end if;
end $$;

alter table public.credit_cards enable row level security;

drop policy if exists "Workspace members can view credit cards" on public.credit_cards;
create policy "Workspace members can view credit cards"
on public.credit_cards for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can insert credit cards" on public.credit_cards;
create policy "Workspace members can insert credit cards"
on public.credit_cards for insert
with check (
  public.is_workspace_member(workspace_id)
  and auth.uid() = user_id
);

drop policy if exists "Workspace members can update credit cards" on public.credit_cards;
create policy "Workspace members can update credit cards"
on public.credit_cards for update
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can delete credit cards" on public.credit_cards;
create policy "Workspace members can delete credit cards"
on public.credit_cards for delete
using (public.is_workspace_member(workspace_id));

do $$
begin
  if exists (
    select 1
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'set_updated_at'
  ) then
    drop trigger if exists set_credit_cards_updated_at on public.credit_cards;
    create trigger set_credit_cards_updated_at
      before update on public.credit_cards
      for each row execute function public.set_updated_at();
  end if;
end $$;
