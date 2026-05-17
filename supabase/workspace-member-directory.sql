-- Safe directory of workspace members (email + name) for UI lists.
-- Run in Supabase SQL Editor after workspaces-rls.sql (idempotent).

create or replace function public.workspace_member_directory(p_workspace_id uuid)
returns table (
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  avatar_color text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id,
    coalesce(p.email, ''),
    coalesce(p.full_name, ''),
    p.avatar_url,
    coalesce(nullif(btrim(p.avatar_color), ''), 'bg-sky-500')
  from public.workspace_members wm
  join public.profiles p on p.id = wm.user_id
  where wm.workspace_id = p_workspace_id
    and public.is_workspace_member(p_workspace_id);
$$;

grant execute on function public.workspace_member_directory(uuid) to authenticated;
