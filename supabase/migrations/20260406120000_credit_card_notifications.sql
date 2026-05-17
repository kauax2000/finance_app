-- Credit card notifications: type enum, prefs, dedupe table

-- 1) Allow notifications.type = 'credit_card'
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('transaction', 'budget', 'system', 'promotion', 'credit_card'));

-- 2) Workspace prefs: master toggle for credit card alerts
alter table public.workspace_member_notification_prefs
  add column if not exists notify_credit_cards boolean not null default true;

alter table public.workspace_member_notification_prefs
  add column if not exists notify_credit_card_calendar boolean not null default true;

comment on column public.workspace_member_notification_prefs.notify_credit_card_calendar is
  'Invoice close / payment due reminders (scheduled); separate from spend/limit alerts.';

-- 3) Dedupe sends per card (and optional category alert) per billing period / event key
create table if not exists public.credit_card_notification_dedupe (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  credit_card_id uuid not null references public.credit_cards (id) on delete cascade,
  dedupe_key text not null,
  sent_at timestamptz not null default now(),
  unique (credit_card_id, dedupe_key)
);

create index if not exists idx_cc_notif_dedupe_workspace
  on public.credit_card_notification_dedupe (workspace_id);

alter table public.credit_card_notification_dedupe enable row level security;

-- No client access; edge functions use service role
