-- O aviso do Excluir conta: as carteiras compartilhadas que a pessoa criou somem
-- com a conta (workspaces.created_by em cascata), seja ela dona ou não hoje. A
-- `get_workspace_delete_impact` só responde ao dono, e as carteiras de que a
-- pessoa não é mais dona ficavam sem número. Esta conta pelo criador, e só os
-- dois números que o aviso mostra.
create or replace function public.get_account_delete_impact()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', w.id,
        'name', w.name,
        'other_members', (
          select count(*) from public.workspace_members m
          where m.workspace_id = w.id and m.user_id <> auth.uid()
        ),
        'transactions', (
          select count(*) from public.transactions t
          where t.workspace_id = w.id
        )
      )
      order by w.name
    ),
    '[]'::jsonb
  )
  from public.workspaces w
  where w.type = 'shared'
    and w.created_by = auth.uid();
$$;

revoke all on function public.get_account_delete_impact() from public, anon;
grant execute on function public.get_account_delete_impact() to authenticated, service_role;
