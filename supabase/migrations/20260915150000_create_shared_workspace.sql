-- Fase 6C.8 — criar carteira compartilhada é uma transação só.
--
-- O cliente fazia duas escritas soltas: `workspaces` e depois
-- `workspace_members`. Se a segunda falhava, sobrava uma carteira sem membros
-- que não aparecia na lista (ela é lida por `workspace_members`), que ninguém
-- conseguia apagar (a exclusão exige owner) e que um novo clique duplicava.
--
-- `security invoker`: valem as políticas de sempre — `created_by = auth.uid()`
-- no insert da carteira e "Creator bootstraps own workspace" no do membro. A
-- função só garante que as duas escritas acontecem juntas ou nenhuma.
-- A carteira pessoal continua nascendo pelo gatilho de `auth.users`.

create or replace function public.create_shared_workspace(
  p_name text,
  p_icon text,
  p_icon_background_color text
)
returns public.workspaces
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_ws public.workspaces;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;
  if nullif(btrim(p_name), '') is null then
    raise exception 'WORKSPACE_NAME_REQUIRED' using errcode = '22023';
  end if;

  insert into public.workspaces (name, type, created_by, icon, icon_background_color)
  values (
    btrim(p_name),
    'shared',
    v_uid,
    p_icon,
    coalesce(nullif(btrim(p_icon_background_color), ''), '#2563EB')
  )
  returning * into v_ws;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_ws.id, v_uid, 'owner');

  return v_ws;
end;
$$;

revoke all on function public.create_shared_workspace(text, text, text) from public, anon;
grant execute on function public.create_shared_workspace(text, text, text) to authenticated, service_role;
