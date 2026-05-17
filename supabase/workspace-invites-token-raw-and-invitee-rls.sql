-- Persist plain invite token for re-copying URLs; allow invitees to read their pending email invites.
-- Run in Supabase SQL Editor after workspace-invites-multiuse-link.sql / workspaces-rls.sql (idempotent).

alter table public.workspace_invites
  add column if not exists token_raw text;

comment on column public.workspace_invites.token_raw is
  'Plain invite token for building /invites/accept URL. Hash remains canonical for verification. Visible only via RLS to workspace owners and the invited_email user while pending.';

-- Invitees (not yet members) can list their own pending email invites — used by workspace switcher.
drop policy if exists "Invitees can view own pending email invites" on public.workspace_invites;
create policy "Invitees can view own pending email invites"
on public.workspace_invites
for select
using (
  status = 'pending'
  and expires_at > now()
  and invited_email is not null
  and lower(trim(coalesce(invited_email, ''))) =
      lower(trim(coalesce(auth.jwt() ->> 'email', '')))
);
