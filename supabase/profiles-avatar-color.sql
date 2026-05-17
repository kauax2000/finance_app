-- Persist avatar background color per user (used for initials avatars across the app).
-- Run in Supabase SQL Editor (idempotent).

alter table public.profiles
  add column if not exists avatar_color text;

comment on column public.profiles.avatar_color is
  'Tailwind class from the app palette (e.g. bg-sky-500). Used for deterministic initials avatar background.';

-- Backfill missing colors (pick a random palette entry).
update public.profiles
set avatar_color = (
  array[
    'bg-red-500','bg-orange-500','bg-amber-500','bg-yellow-500','bg-lime-500',
    'bg-green-500','bg-emerald-500','bg-teal-500','bg-cyan-500','bg-sky-500',
    'bg-blue-500','bg-indigo-500','bg-violet-500','bg-purple-500','bg-fuchsia-500',
    'bg-pink-500','bg-rose-500'
  ])[1 + floor(random() * 17)::int]
where avatar_color is null or btrim(avatar_color) = '';

