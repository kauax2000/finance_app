-- Bind app session rows to the GoTrue login session (`session_id` JWT claim).
--
-- Enables real revocation enforcement in the `sessions` edge function: a
-- revoked device re-registering with its pre-revocation JWT matches its
-- inactive row by `auth_session_id` and is rejected, while a fresh password
-- login (new GoTrue session) is allowed. Also used to re-bind `token_hash`
-- after JWT rotation when localStorage was cleared.
--
-- `user_sessions` is a loose-file table until the schema baseline lands;
-- guard for DBs where it does not exist yet.

do $$
begin
  if to_regclass('public.user_sessions') is not null then
    alter table public.user_sessions
      add column if not exists auth_session_id text;

    create index if not exists idx_user_sessions_auth_session
      on public.user_sessions (user_id, auth_session_id);
  end if;
end;
$$;
