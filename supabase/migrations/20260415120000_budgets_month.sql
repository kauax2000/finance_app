-- Ensure budgets.year + budgets.month exist and are populated.
-- This project uses year/month integer columns and some environments enforce NOT NULL.
-- Idempotent migration to keep repo schema aligned with production.

alter table public.budgets
  add column if not exists year integer;
alter table public.budgets
  add column if not exists month integer;

-- Backfill from period_start.
update public.budgets
set year = extract(year from period_start)::int
where year is null;

update public.budgets
set month = extract(month from period_start)::int
where month is null;

-- Enforce reasonable bounds.
alter table public.budgets
  drop constraint if exists budgets_year_bounds_check;
alter table public.budgets
  add constraint budgets_year_bounds_check
  check (year between 1900 and 2200);

alter table public.budgets
  drop constraint if exists budgets_month_bounds_check;
alter table public.budgets
  add constraint budgets_month_bounds_check
  check (month between 1 and 12);

-- Make required.
alter table public.budgets
  alter column year set not null;
alter table public.budgets
  alter column month set not null;

comment on column public.budgets.month is
  'Month-of-year (1-12). Derived from period_start.';

comment on column public.budgets.year is
  'Year (e.g. 2026). Derived from period_start.';

