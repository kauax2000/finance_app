-- Optional icon for bills (same string ids as category icons, e.g. lucide slug keys)

alter table public.bills
  add column if not exists icon text;

comment on column public.bills.icon is
  'Lucide-style icon id (same vocabulary as categories.icon); null = default in UI';
