-- Garantir projeto "Pessoal" + membership + dados por omissão para utilizadores que já existiam
-- antes do trigger handle_new_user (ou sem linha em workspace_members).
--
-- Idempotente: pode voltar a executar com segurança.
-- Executar no Supabase SQL Editor (como postgres), depois de:
--   workspaces.sql, workspaces-rls.sql, workspaces-project-appearance.sql,
--   workspaces-handle-new-user.sql
-- (Este ficheiro adiciona workspace_id a wallets/categories se ainda não existir.)
--
-- Não substitui o trigger: apenas corrige contas antigas ou estados inconsistentes.

create extension if not exists pgcrypto;

-- Igual a workspaces-core-migration.sql: necessário para contagens/inserts por workspace
alter table public.wallets
  add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

alter table public.categories
  add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

create index if not exists idx_wallets_workspace_id on public.wallets(workspace_id);
create index if not exists idx_categories_workspace_id on public.categories(workspace_id);

do $$
declare
  r record;
  personal_workspace_id uuid;
  accent_palette text[] := array[
    '#2563EB','#7C3AED','#DB2777','#DC2626','#EA580C','#CA8A04',
    '#16A34A','#0D9488','#0891B2','#4F46E5','#9333EA','#C026D3'
  ];
  accent_pick text;
  wallet_count int;
begin
  for r in
    select
      u.id as user_id,
      u.email::text as email,
      coalesce(u.raw_user_meta_data->>'full_name', u.email::text) as full_name
    from auth.users u
  loop
    accent_pick := accent_palette[
      1 + floor(random() * array_length(accent_palette, 1))::int
    ];

    insert into public.profiles (id, email, full_name)
    values (r.user_id, r.email, r.full_name)
    on conflict (id) do nothing;

    select w.id
      into personal_workspace_id
    from public.workspaces w
    where w.created_by = r.user_id
      and w.type = 'personal'
    order by w.created_at asc
    limit 1;

    if personal_workspace_id is null then
      insert into public.workspaces (
        id,
        name,
        type,
        created_by,
        icon,
        icon_background_color
      )
      values (
        gen_random_uuid(),
        'Pessoal',
        'personal',
        r.user_id,
        'home',
        accent_pick
      )
      returning id into personal_workspace_id;
    end if;

    insert into public.workspace_members (workspace_id, user_id, role)
    values (personal_workspace_id, r.user_id, 'owner')
    on conflict (workspace_id, user_id) do update set role = excluded.role;

    -- Carteiras/categorias antigas (workspace_id nulo) passam a pertencer a este Pessoal
    update public.wallets
    set workspace_id = personal_workspace_id
    where user_id = r.user_id
      and workspace_id is null;

    update public.categories
    set workspace_id = personal_workspace_id
    where user_id = r.user_id
      and workspace_id is null;

    select count(*)::int
      into wallet_count
    from public.wallets
    where workspace_id = personal_workspace_id;

    if wallet_count = 0 then
      insert into public.wallets (user_id, workspace_id, name, type, balance, color, icon)
      values
        (r.user_id, personal_workspace_id, 'Carteira', 'cash', 0, '#10B981', 'wallet'),
        (r.user_id, personal_workspace_id, 'Conta Corrente', 'checking', 0, '#3B82F6', 'building-bank'),
        (r.user_id, personal_workspace_id, 'Poupança', 'savings', 0, '#F59E0B', 'piggy-bank');
    end if;

    if not exists (
      select 1 from public.categories c where c.workspace_id = personal_workspace_id limit 1
    ) then
      insert into public.categories (user_id, workspace_id, name, type, color, icon)
      values
        (r.user_id, personal_workspace_id, 'Alimentação', 'expense', '#EF4444', 'utensils'),
        (r.user_id, personal_workspace_id, 'Transporte', 'expense', '#3B82F6', 'car'),
        (r.user_id, personal_workspace_id, 'Moradia', 'expense', '#8B5CF6', 'home'),
        (r.user_id, personal_workspace_id, 'Lazer', 'expense', '#F59E0B', 'gamepad-2'),
        (r.user_id, personal_workspace_id, 'Saúde', 'expense', '#10B981', 'heart'),
        (r.user_id, personal_workspace_id, 'Educação', 'expense', '#6366F1', 'graduation-cap'),
        (r.user_id, personal_workspace_id, 'Outros', 'expense', '#6B7280', 'more-horizontal'),
        (r.user_id, personal_workspace_id, 'Salário', 'income', '#10B981', 'briefcase'),
        (r.user_id, personal_workspace_id, 'Freelance', 'income', '#3B82F6', 'laptop'),
        (r.user_id, personal_workspace_id, 'Investimentos', 'income', '#F59E0B', 'trending-up'),
        (r.user_id, personal_workspace_id, 'Presentes', 'income', '#EC4899', 'gift'),
        (r.user_id, personal_workspace_id, 'Outros', 'income', '#6B7280', 'more-horizontal');
    end if;
  end loop;
end $$;
