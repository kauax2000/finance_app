-- Persist plain invite token for re-copying URLs; allow invitees to read their pending email invites.
-- Mirrors workspace-invites-token-raw-and-invitee-rls.sql (idempotent).
-- Apply: Supabase SQL Editor, or `supabase db push` when the project is linked.

alter table public.workspace_invites
  add column if not exists token_raw text;

comment on column public.workspace_invites.token_raw is
  'Plain invite token for building /invites/accept URL. Hash remains canonical for verification. Visible only via RLS to workspace owners and the invited_email user while pending.';

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
