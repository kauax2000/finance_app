-- Contas a Pagar (bills templates + bill_instances per occurrence)

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  notes text,
  category_id uuid references public.categories(id) on delete set null,
  frequency text not null default 'monthly'
    constraint bills_frequency_check
      check (
        frequency in (
          'monthly',
          'bimonthly',
          'quarterly',
          'yearly',
          'one_time'
        )
      ),
  due_day_of_month smallint not null default 10
    constraint bills_due_day_of_month_range
      check (due_day_of_month >= 1 and due_day_of_month <= 31),
  amount_estimated numeric(15, 2),
  start_date date not null,
  end_date date,
  default_payment_method text,
  default_wallet_id uuid references public.wallets(id) on delete set null,
  default_payment_credit_card_id uuid references public.credit_cards(id) on delete set null,
  reminder_days_before integer[] not null default array[3, 0]::integer[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bills_default_credit_card_requires_method check (
    default_payment_credit_card_id is null
    or default_payment_method = 'credit_card'
  )
);

create index if not exists idx_bills_workspace_active
  on public.bills (workspace_id, is_active);

alter table public.bills enable row level security;

drop policy if exists "Workspace members can view bills" on public.bills;
create policy "Workspace members can view bills"
on public.bills for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can insert bills" on public.bills;
create policy "Workspace members can insert bills"
on public.bills for insert
with check (
  public.is_workspace_member(workspace_id)
  and auth.uid() = user_id
);

drop policy if exists "Workspace members can update bills" on public.bills;
create policy "Workspace members can update bills"
on public.bills for update
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can delete bills" on public.bills;
create policy "Workspace members can delete bills"
on public.bills for delete
using (public.is_workspace_member(workspace_id));

do $$
begin
  if exists (
    select 1 from pg_proc
    where pronamespace = 'public'::regnamespace and proname = 'set_updated_at'
  ) then
    drop trigger if exists set_bills_updated_at on public.bills;
    create trigger set_bills_updated_at
      before update on public.bills
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- ---------------------------------------------------------------------------

create table if not exists public.bill_instances (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  bill_id uuid not null references public.bills(id) on delete cascade,
  due_date date not null,
  amount numeric(15, 2),
  status text not null default 'pending'
    constraint bill_instances_status_check
      check (status in ('pending', 'paid', 'skipped')),
  paid_at timestamptz,
  paid_amount numeric(15, 2),
  payment_method text,
  payment_credit_card_id uuid references public.credit_cards(id) on delete set null,
  wallet_id uuid references public.wallets(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bill_instances_unique_cycle unique (bill_id, due_date),
  constraint bill_instances_paid_amount_consistency check (
    paid_amount is null or status = 'paid'
  ),
  constraint bill_instances_credit_card_requires_method check (
    payment_credit_card_id is null
    or payment_method = 'credit_card'
  )
);

create index if not exists idx_bill_instances_workspace_status_due
  on public.bill_instances (workspace_id, status, due_date);

alter table public.bill_instances enable row level security;

drop policy if exists "Workspace members can view bill_instances" on public.bill_instances;
create policy "Workspace members can view bill_instances"
on public.bill_instances for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can insert bill_instances" on public.bill_instances;
create policy "Workspace members can insert bill_instances"
on public.bill_instances for insert
with check (
  public.is_workspace_member(workspace_id)
  and auth.uid() = user_id
);

drop policy if exists "Workspace members can update bill_instances" on public.bill_instances;
create policy "Workspace members can update bill_instances"
on public.bill_instances for update
using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can delete bill_instances" on public.bill_instances;
create policy "Workspace members can delete bill_instances"
on public.bill_instances for delete
using (public.is_workspace_member(workspace_id));

do $$
begin
  if exists (
    select 1 from pg_proc
    where pronamespace = 'public'::regnamespace and proname = 'set_updated_at'
  ) then
    drop trigger if exists set_bill_instances_updated_at on public.bill_instances;
    create trigger set_bill_instances_updated_at
      before update on public.bill_instances
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Dedupe for bill reminders (Edge service role — no client RLS policies)

create table if not exists public.bill_notification_dedupe (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bill_instance_id uuid not null references public.bill_instances(id) on delete cascade,
  reminder_offset_days int not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  sent_on date not null default (timezone('utc', now()))::date,
  unique (
    bill_instance_id,
    reminder_offset_days,
    user_id,
    sent_on
  )
);

create index if not exists idx_bill_notification_dedupe_workspace
  on public.bill_notification_dedupe (workspace_id);

alter table public.bill_notification_dedupe enable row level security;

-- ---------------------------------------------------------------------------
-- Notifications: allow type = 'bill'

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (
    type in (
      'transaction',
      'budget',
      'system',
      'promotion',
      'credit_card',
      'bill'
    )
  );

-- ---------------------------------------------------------------------------
-- Prefs: contas a pagar

alter table public.workspace_member_notification_prefs
  add column if not exists notify_bills boolean not null default true;

comment on column public.workspace_member_notification_prefs.notify_bills is
  'Reminders for Contas a Pagar (due soon / due today).';
