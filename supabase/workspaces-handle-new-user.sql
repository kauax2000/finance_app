-- Update handle_new_user() to create personal workspace + seed default data inside it
-- Run after workspaces.sql + workspaces-rls.sql

create extension if not exists "pgcrypto";

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  personal_workspace_id uuid;
  accent_palette text[] := array[
    '#2563EB','#7C3AED','#DB2777','#DC2626','#EA580C','#CA8A04',
    '#16A34A','#0D9488','#0891B2','#4F46E5','#9333EA','#C026D3'
  ];
  accent_pick text;
  raw_full text;
  first_name text;
  personal_workspace_name text;
begin
  accent_pick := accent_palette[
    1 + floor(random() * array_length(accent_palette, 1))::int
  ];
  raw_full := coalesce(trim(new.raw_user_meta_data->>'full_name'), '');
  first_name := nullif(split_part(raw_full, ' ', 1), '');
  if first_name is null then
    first_name := nullif(split_part(coalesce(new.email, ''), '@', 1), '');
  end if;
  if first_name is null then
    first_name := 'Usuário';
  end if;
  personal_workspace_name := 'Carteira pessoal de ' || first_name;
  -- Create profile (ignore if already exists)
  insert into public.profiles (id, email, full_name, avatar_color)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    (array[
      'bg-red-500','bg-orange-500','bg-amber-500','bg-yellow-500','bg-lime-500',
      'bg-green-500','bg-emerald-500','bg-teal-500','bg-cyan-500','bg-sky-500',
      'bg-blue-500','bg-indigo-500','bg-violet-500','bg-purple-500','bg-fuchsia-500',
      'bg-pink-500','bg-rose-500'
    ])[1 + floor(random() * 17)::int]
  )
  on conflict (id) do nothing;

  -- Create (or find) personal workspace
  select w.id
    into personal_workspace_id
  from public.workspaces w
  where w.created_by = new.id
    and w.type = 'personal'
  order by w.created_at asc
  limit 1;

  if personal_workspace_id is null then
    insert into public.workspaces (id, name, type, created_by, icon, icon_background_color)
    values (
      gen_random_uuid(),
      personal_workspace_name,
      'personal',
      new.id,
      'home',
      accent_pick
    )
    returning id into personal_workspace_id;
  end if;

  -- Ensure membership owner
  insert into public.workspace_members (workspace_id, user_id, role)
  values (personal_workspace_id, new.id, 'owner')
  on conflict (workspace_id, user_id) do update set role = excluded.role;

  -- Seed default expense categories in the personal workspace
  insert into public.categories (user_id, workspace_id, name, type, color, icon)
  values
    (new.id, personal_workspace_id, 'Alimentação', 'expense', '#EF4444', 'utensils'),
    (new.id, personal_workspace_id, 'Transporte', 'expense', '#3B82F6', 'car'),
    (new.id, personal_workspace_id, 'Moradia', 'expense', '#8B5CF6', 'home'),
    (new.id, personal_workspace_id, 'Lazer', 'expense', '#F59E0B', 'gamepad-2'),
    (new.id, personal_workspace_id, 'Saúde', 'expense', '#10B981', 'heart'),
    (new.id, personal_workspace_id, 'Educação', 'expense', '#6366F1', 'graduation-cap'),
    (new.id, personal_workspace_id, 'Outros', 'expense', '#6B7280', 'more-horizontal')
  on conflict do nothing;

  -- Seed default income categories in the personal workspace
  insert into public.categories (user_id, workspace_id, name, type, color, icon)
  values
    (new.id, personal_workspace_id, 'Salário', 'income', '#10B981', 'briefcase'),
    (new.id, personal_workspace_id, 'Freelance', 'income', '#3B82F6', 'laptop'),
    (new.id, personal_workspace_id, 'Investimentos', 'income', '#F59E0B', 'trending-up'),
    (new.id, personal_workspace_id, 'Presentes', 'income', '#EC4899', 'gift'),
    (new.id, personal_workspace_id, 'Outros', 'income', '#6B7280', 'more-horizontal')
  on conflict do nothing;

  return new;
end;
$$;

-- Keep trigger name stable; attach to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

