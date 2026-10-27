-- MCP: o token de uma IA só chama a RPC do parcelado.
--
-- As políticas de 20261103130000 fecham as tabelas, mas uma RPC `security
-- definer` não passa pelo RLS: com o token da IA, `delete_workspace`,
-- `trocar_papel`, `definir_partes` e as outras ainda escreviam. Em vez de uma
-- guarda em cada uma (e na próxima que nascer), o PostgREST roda esta função
-- antes de toda requisição (`db_pre_request`) e recusa, para o token da IA,
-- toda RPC fora da lista e todo PATCH, PUT e DELETE. A sessão do app, o anon e
-- a service role não têm `client_id` e saem na primeira linha.
--
-- `security definer`: roda com o papel da requisição, e o anon não executa
-- `eh_token_de_ia()`. Erro aqui derruba toda a API: só lê configurações com
-- `missing_ok`, e nada mais.

create or replace function public.guarda_do_token_de_ia()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  metodo text := coalesce(current_setting('request.method', true), '');
  caminho text := rtrim(coalesce(current_setting('request.path', true), ''), '/');
begin
  if not public.eh_token_de_ia() then
    return;
  end if;
  if metodo in ('PATCH', 'PUT', 'DELETE')
    or (caminho like '/rpc/%' and caminho <> '/rpc/create_workspace_installment_plan') then
    raise exception 'token_de_ia_somente_leitura' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.guarda_do_token_de_ia() from public;
grant execute on function public.guarda_do_token_de_ia() to anon, authenticated, service_role;

alter role authenticator set pgrst.db_pre_request = 'public.guarda_do_token_de_ia';
notify pgrst, 'reload config';
