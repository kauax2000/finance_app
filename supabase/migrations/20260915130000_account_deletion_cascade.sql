-- Fase 2 — excluir a conta conclui, numa transação só.
--
-- Toda FK para auth.users já é ON DELETE CASCADE, então `auth.admin.deleteUser`
-- apagaria perfil, carteiras criadas pela pessoa (e tudo dentro delas, de todos
-- os membros — decisão "apagar tudo"), lançamentos e o resto. O que abortava a
-- exclusão no meio eram dois guardas que não sabiam distinguir "alguém apagou a
-- carteira pessoal" de "a dona da carteira pessoal deixou de existir".
--
-- Nas duas funções a pergunta passa a ser: o usuário ainda existe? Numa cascata
-- a linha de auth.users já foi removida (a ação da FK roda depois do DELETE do
-- pai), então o guarda libera; fora dela, continua barrando.

create or replace function public.workspaces_before_delete_guard_and_cleanup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.type = 'personal'
     and exists (select 1 from auth.users u where u.id = old.created_by) then
    raise exception 'WORKSPACE_PERSONAL_IMMUTABLE'
      using errcode = 'P0001';
  end if;
  return old;
end;
$$;

create or replace function public.workspace_members_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.workspace_id is distinct from old.workspace_id
       or new.user_id is distinct from old.user_id then
      raise exception 'WORKSPACE_MEMBER_IMMUTABLE_KEYS' using errcode = 'P0001';
    end if;
    if old.role = 'owner' and new.role <> 'owner'
       and not exists (
         select 1 from public.workspace_members m
         where m.workspace_id = old.workspace_id
           and m.role = 'owner'
           and m.user_id <> old.user_id
       ) then
      raise exception 'WORKSPACE_LAST_OWNER' using errcode = 'P0001';
    end if;
    return new;
  end if;

  -- DELETE: o último dono só sai junto com a carteira ou com a própria conta.
  if old.role = 'owner'
     and exists (select 1 from auth.users u where u.id = old.user_id)
     and exists (select 1 from public.workspaces w where w.id = old.workspace_id)
     and not exists (
       select 1 from public.workspace_members m
       where m.workspace_id = old.workspace_id
         and m.role = 'owner'
         and m.user_id <> old.user_id
     ) then
    raise exception 'WORKSPACE_LAST_OWNER' using errcode = 'P0001';
  end if;
  return old;
end;
$$;
