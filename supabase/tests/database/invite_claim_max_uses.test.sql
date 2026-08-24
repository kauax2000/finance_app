-- pgTAP: accept_workspace_invite enforces max_uses atomically (claim before join)
begin;
select plan(6);

-- Fixtures: owner + two invitees, one workspace, one email invite (max_uses = 1)
create temp table _inv_fix as
with owner_u as (
  insert into auth.users (id, aud, role, email, encrypted_password,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
  values (gen_random_uuid(), 'authenticated', 'authenticated',
    'inv_owner_' || gen_random_uuid() || '@local.test', '', '{}', '{}', now(), now(), false, false)
  returning id
),
guest_a as (
  insert into auth.users (id, aud, role, email, encrypted_password,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
  values (gen_random_uuid(), 'authenticated', 'authenticated',
    'inv_guest_a_' || gen_random_uuid() || '@local.test', '', '{}', '{}', now(), now(), false, false)
  returning id, email
),
guest_b as (
  insert into auth.users (id, aud, role, email, encrypted_password,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
  values (gen_random_uuid(), 'authenticated', 'authenticated',
    'inv_guest_b_' || gen_random_uuid() || '@local.test', '', '{}', '{}', now(), now(), false, false)
  returning id, email
),
ws as (
  insert into public.workspaces (name, type, created_by)
  select 'pgtap_inv_ws_' || substr(md5(random()::text), 1, 8), 'shared', id
  from owner_u
  returning id, created_by
),
own_member as (
  insert into public.workspace_members (workspace_id, user_id, role)
  select ws.id, ws.created_by, 'owner' from ws
  on conflict do nothing
  returning workspace_id
),
inv as (
  insert into public.workspace_invites (
    workspace_id, invited_email, role, token_hash, status,
    expires_at, created_by, usage_count, max_uses
  )
  select
    ws.id,
    (select email from guest_a),
    'member',
    'pgtap_hash_' || substr(md5(random()::text), 1, 16),
    'pending',
    now() + interval '7 days',
    ws.created_by,
    0,
    1
  from ws
  returning id, workspace_id, token_hash
)
select
  (select id from ws) as workspace_id,
  (select id from guest_a) as guest_a_id,
  (select email from guest_a) as guest_a_email,
  (select id from guest_b) as guest_b_id,
  (select email from guest_b) as guest_b_email,
  (select token_hash from inv) as token_hash,
  (select id from inv) as invite_id;

-- Wrong email is rejected before any claim
select is(
  (select public.accept_workspace_invite(
      (select token_hash from _inv_fix),
      (select guest_b_id from _inv_fix),
      (select guest_b_email from _inv_fix)))->>'status',
  'email_mismatch',
  'invitee email must match the invite'
);

-- First accept by the invited user succeeds
select is(
  (select public.accept_workspace_invite(
      (select token_hash from _inv_fix),
      (select guest_a_id from _inv_fix),
      (select guest_a_email from _inv_fix)))->>'status',
  'accepted',
  'first accept succeeds'
);

select ok(
  exists (
    select 1 from public.workspace_members
    where workspace_id = (select workspace_id from _inv_fix)
      and user_id = (select guest_a_id from _inv_fix)
  ),
  'membership row created for invited user'
);

-- Invite is now exhausted (max_uses = 1) and marked accepted
select is(
  (select status from public.workspace_invites where id = (select invite_id from _inv_fix)),
  'accepted',
  'invite marked accepted after exhausting max_uses'
);

-- Repeat accept by the same user is idempotent
select is(
  (select public.accept_workspace_invite(
      (select token_hash from _inv_fix),
      (select guest_a_id from _inv_fix),
      (select guest_a_email from _inv_fix)))->>'status',
  'already_member',
  'repeat accept is idempotent (already_member)'
);

select is(
  (select usage_count from public.workspace_invites where id = (select invite_id from _inv_fix)),
  1,
  'usage_count did not advance past max_uses'
);

select * from finish();
rollback;
