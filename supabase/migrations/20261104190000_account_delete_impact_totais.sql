-- O aviso do Excluir conta mostra o tamanho do que some: os lançamentos, as
-- carteiras e as categorias de todas as carteiras que a pessoa criou (a pessoal
-- e as compartilhadas, que vão com a conta pela cascata de `created_by`). A
-- lista por carteira saiu do aviso, a pedido do dono: a forma passa a ser
-- { lancamentos, carteiras, categorias }. Só o `DeleteAccountDialog` a chama.
create or replace function public.get_account_delete_impact()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with minhas as (
    select w.id from public.workspaces w where w.created_by = auth.uid()
  )
  select jsonb_build_object(
    'lancamentos', (
      select count(*) from public.transactions t
      where t.workspace_id in (select id from minhas)
    ),
    'carteiras', (select count(*) from minhas),
    'categorias', (
      select count(*) from public.categories c
      where c.workspace_id in (select id from minhas)
    )
  );
$$;

revoke all on function public.get_account_delete_impact() from public, anon;
grant execute on function public.get_account_delete_impact() to authenticated, service_role;
