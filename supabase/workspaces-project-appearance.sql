-- Workspace icon + accent color (project appearance)
-- Run in Supabase SQL Editor after workspaces.sql (idempotent)

-- 1) Columns (nullable first for backfill)
alter table public.workspaces
  add column if not exists icon text;

alter table public.workspaces
  add column if not exists icon_background_color text;

-- 2) Backfill existing rows
update public.workspaces
set
  icon = coalesce(nullif(trim(icon), ''), 'home'),
  icon_background_color = coalesce(
    nullif(trim(icon_background_color), ''),
    '#' || lpad(to_hex((abs(hashtext(id::text)) % 16777215)::bigint), 6, '0')
  )
where icon is null
   or icon_background_color is null
   or trim(coalesce(icon, '')) = ''
   or trim(coalesce(icon_background_color, '')) = '';

-- Coerce unknown icon keys before CHECK
update public.workspaces
set icon = 'home'
where icon not in (
  'briefcase','home','users','plane','heart','shopping-cart','wallet','building-2',
  'laptop','trending-up','gift','sparkles','target','zap','coffee','music',
  'camera','dumbbell','book-open','globe'
);

-- 3) NOT NULL
alter table public.workspaces
  alter column icon set not null;

alter table public.workspaces
  alter column icon_background_color set not null;

-- 4) Icon allowlist (aligned with src/lib/workspace-icons.ts)
alter table public.workspaces drop constraint if exists workspaces_icon_allowed;

alter table public.workspaces
  add constraint workspaces_icon_allowed check (
    icon in (
      'briefcase',
      'home',
      'users',
      'plane',
      'heart',
      'shopping-cart',
      'wallet',
      'building-2',
      'laptop',
      'trending-up',
      'gift',
      'sparkles',
      'target',
      'zap',
      'coffee',
      'music',
      'camera',
      'dumbbell',
      'book-open',
      'globe'
    )
  );

-- 5) At most one personal workspace per creator
create unique index if not exists idx_workspaces_one_personal_per_creator
  on public.workspaces (created_by)
  where type = 'personal';
