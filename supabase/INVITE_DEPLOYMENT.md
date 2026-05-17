# Workspace invites: deployment checklist

Use this when wiring **project sharing** (email + link invites) in a Supabase project.

## Edge Functions

Deploy and configure these functions (folder `supabase/functions/`):

- **`workspace-invites-create`** — creates `workspace_invites`, sends email (optional), returns link URL.
- **`workspace-invites-accept`** — validates token, inserts into `workspace_members`, records notifications.

Secrets / env in Supabase (Edge Functions → *Secrets*):

| Secret | Purpose |
|--------|---------|
| `SUPABASE_URL` | Usually injected by Supabase |
| `SUPABASE_ANON_KEY` | JWT validation in functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB updates inside functions |
| `RESEND_API_KEY` | Required for **email** invites (`workspace-invites-create`) |
| `RESEND_FROM` | Sender on a [verified domain](https://resend.com/domains) (production) |
| `APP_BASE_URL` | **Production** public app origin, no trailing slash (e.g. `https://app.example.com`). Used when the HTTP `Origin` header is missing (e.g. some server-side invokes). Ensures invite links point at the real site. |

After schema changes, run in SQL Editor (if not already): `workspaces.sql`, RLS files, `workspace-member-directory.sql`, `workspace-invites-token-raw-and-invitee-rls.sql` (stores `token_raw` for copied links + RLS for invitees), etc., then **Settings → API → Reload schema** if PostgREST caches old schema.

Linked CLI projects can apply the same SQL via **`supabase/migrations/20260331120000_workspace_invites_token_raw.sql`** (`supabase db push`).

### Erro: `Could not find the 'token_raw' column ... in the schema cache`

1. Garanta a coluna: rode no SQL Editor o conteúdo de [`workspace-invites-token-raw-and-invitee-rls.sql`](workspace-invites-token-raw-and-invitee-rls.sql) (ou a migração acima).
2. Recarregue o schema do PostgREST: **Settings → API → Reload schema**, ou execute [`reload-postgrest-schema.sql`](reload-postgrest-schema.sql) no SQL Editor (`NOTIFY pgrst, 'reload schema'`).
3. Gere o link de convite de novo na página **Membros**.

## Auth redirect URLs (Supabase Dashboard)

Under **Authentication → URL configuration**:

- **Site URL**: your primary production origin (e.g. `https://app.example.com`).
- **Redirect URLs**: include every origin and path users may land on after **OAuth** or **email confirmation**, for example:
  - `http://localhost:3000/**` (development)
  - `https://app.example.com/**`
  - Paths used by this app: `/invites/accept`, `/login`, `/register`, `/dashboard`

Invite flows depend on:

- `emailRedirectTo` after signup → often the full URL to `/invites/accept?token=...`
- Google OAuth `redirectTo` → same path when the user started from an invite

If a redirect URL is not allowlisted, Supabase will block the redirect after login or confirm email.

## SQL: member directory (optional UI)

Run [`workspace-member-directory.sql`](workspace-member-directory.sql) so the **Membros** page can show co-worker emails/names without loosening global `profiles` RLS.

## smoke-test

1. Owner creates link invite → open `invite_url` in incognito.
2. **Criar conta** or **Entrar**; confirm the URL still contains `token` when returning to `/invites/accept`.
3. Success message → **Dashboard** → sidebar switcher shows the shared workspace.
