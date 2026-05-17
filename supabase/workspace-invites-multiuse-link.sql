-- Multi-use invite links: nullable email, usage counters, max_uses semantics.
-- Link invites: invited_email null, max_uses null (unlimited until revoke/expiry).
-- Email invites: invited_email set, max_uses = 1.

alter table public.workspace_invites
  alter column invited_email drop not null;

alter table public.workspace_invites
  add column if not exists usage_count int not null default 0;

alter table public.workspace_invites
  add column if not exists max_uses int null;

update public.workspace_invites
set max_uses = 1
where max_uses is null
  and invited_email is not null;

alter table public.workspace_invites
  drop constraint if exists workspace_invites_email_max_uses_chk;

alter table public.workspace_invites
  add constraint workspace_invites_email_max_uses_chk
  check (
    (invited_email is not null and max_uses = 1)
    or (invited_email is null)
  );
