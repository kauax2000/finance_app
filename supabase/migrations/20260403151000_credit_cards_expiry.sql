-- Optional card expiry (validade) for credit_cards

alter table public.credit_cards
  add column if not exists expiry_month smallint,
  add column if not exists expiry_year smallint;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'credit_cards_expiry_month_range'
  ) then
    alter table public.credit_cards
      add constraint credit_cards_expiry_month_range check (
        expiry_month is null or (expiry_month >= 1 and expiry_month <= 12)
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'credit_cards_expiry_year_range'
  ) then
    alter table public.credit_cards
      add constraint credit_cards_expiry_year_range check (
        expiry_year is null or (expiry_year >= 2000 and expiry_year <= 2100)
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'credit_cards_expiry_both_or_neither'
  ) then
    alter table public.credit_cards
      add constraint credit_cards_expiry_both_or_neither check (
        (expiry_month is null and expiry_year is null)
        or (expiry_month is not null and expiry_year is not null)
      );
  end if;
end $$;
