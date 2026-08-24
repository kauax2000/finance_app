-- Atomic workspace-invite acceptance.
--
-- The previous edge-function flow upserted the membership BEFORE claiming
-- `usage_count`, so N concurrent accepts of a bounded invite all joined while
-- usage_count advanced by 1 — `max_uses` was never actually enforced.
--
-- This RPC performs validate → claim → join in one transaction with a row
-- lock on the invite. The edge function (`workspace-invites-accept`) validates
-- the caller's JWT and passes the verified identity; execution is restricted
-- to service_role.

create or replace function public.accept_workspace_invite(
  p_token_hash text,
  p_user_id uuid,
  p_user_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.workspace_invites%rowtype;
  v_email text := lower(coalesce(trim(p_user_email), ''));
  v_next_usage integer;
  v_exhausted boolean;
begin
  if p_user_id is null then
    return jsonb_build_object('status', 'invalid_user');
  end if;
  if v_email = '' then
    return jsonb_build_object('status', 'invalid_user');
  end if;

  select * into v_invite
  from public.workspace_invites
  where token_hash = p_token_hash
  for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  -- Idempotency first: re-clicking the link after joining (even once the
  -- invite is exhausted/accepted) must not read as an error.
  if exists (
    select 1 from public.workspace_members
    where workspace_id = v_invite.workspace_id and user_id = p_user_id
  ) then
    return jsonb_build_object(
      'status', 'already_member',
      'workspace_id', v_invite.workspace_id
    );
  end if;

  if v_invite.status <> 'pending' then
    return jsonb_build_object('status', 'not_pending', 'workspace_id', v_invite.workspace_id);
  end if;

  if v_invite.expires_at < now() then
    update public.workspace_invites set status = 'expired' where id = v_invite.id;
    return jsonb_build_object('status', 'expired', 'workspace_id', v_invite.workspace_id);
  end if;

  if v_invite.invited_email is not null
     and lower(trim(v_invite.invited_email)) <> v_email then
    return jsonb_build_object('status', 'email_mismatch');
  end if;

  -- Claim BEFORE joining: the invite row is locked, so concurrent accepts
  -- serialize here and the (max_uses + 1)-th caller is rejected.
  if v_invite.max_uses is not null and v_invite.usage_count >= v_invite.max_uses then
    return jsonb_build_object('status', 'exhausted', 'workspace_id', v_invite.workspace_id);
  end if;

  v_next_usage := v_invite.usage_count + 1;
  v_exhausted := v_invite.max_uses is not null and v_next_usage >= v_invite.max_uses;

  update public.workspace_invites
  set usage_count = v_next_usage,
      status = case when v_exhausted then 'accepted' else status end,
      accepted_at = case when v_exhausted then now() else accepted_at end
  where id = v_invite.id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_invite.workspace_id, p_user_id, 'member')
  on conflict (workspace_id, user_id) do nothing;

  return jsonb_build_object(
    'status', 'accepted',
    'workspace_id', v_invite.workspace_id,
    'invite_id', v_invite.id,
    'created_by', v_invite.created_by
  );
end;
$$;

revoke all on function public.accept_workspace_invite(text, uuid, text) from public;
revoke all on function public.accept_workspace_invite(text, uuid, text) from anon;
revoke all on function public.accept_workspace_invite(text, uuid, text) from authenticated;
grant execute on function public.accept_workspace_invite(text, uuid, text) to service_role;
