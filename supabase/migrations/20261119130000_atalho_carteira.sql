-- Atalho com carteira (19/nov/2026): o guia do iPhone cria o token já com o
-- modo (`atalho_gatilho`: siri ou toque) e troca a carteira do token depois.
-- A assinatura nova de `create_capture_token` ganha `p_gatilho`; a antiga sai
-- para não ficar sobrecarga ambígua no PostgREST.

drop function if exists public.create_capture_token(uuid, text);

create or replace function public.create_capture_token(
  p_workspace_id uuid,
  p_name text,
  p_gatilho text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_token text;
begin
  if v_uid is null or not public.is_workspace_member(p_workspace_id) then
    raise exception 'nao_membro';
  end if;

  if p_gatilho is not null and p_gatilho not in ('siri', 'toque') then
    raise exception 'gatilho_invalido';
  end if;

  -- Dois pedidos ao mesmo tempo não passam juntos do limite.
  perform pg_advisory_xact_lock(hashtext('capture_tokens:' || v_uid::text));

  if (
    select count(*) from public.capture_tokens
    where user_id = v_uid and revoked_at is null
  ) >= 10 then
    raise exception 'limite_tokens';
  end if;

  v_token := 'fac_' || encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.capture_tokens (user_id, workspace_id, name, token_hash, atalho_gatilho)
  values (v_uid, p_workspace_id, btrim(p_name), encode(extensions.digest(v_token, 'sha256'), 'hex'), p_gatilho);

  return v_token;
end;
$$;

revoke all on function public.create_capture_token(uuid, text, text) from public, anon;
grant execute on function public.create_capture_token(uuid, text, text) to authenticated;

create or replace function public.set_capture_token_workspace(
  p_id uuid,
  p_workspace_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_workspace_member(p_workspace_id) then
    raise exception 'nao_membro';
  end if;

  update public.capture_tokens
  set workspace_id = p_workspace_id
  where id = p_id and user_id = auth.uid() and revoked_at is null;

  if not found then
    raise exception 'nao_encontrado';
  end if;
end;
$$;

revoke all on function public.set_capture_token_workspace(uuid, uuid) from public, anon;
grant execute on function public.set_capture_token_workspace(uuid, uuid) to authenticated;
