# Workspace invites: deployment checklist

Use this when wiring **project sharing** (email + link invites) in a Supabase project.

## Edge Functions

Folder `supabase/functions/`:

- **`workspace-invites-create`** — creates `workspace_invites`, sends email (optional), returns link URL.
- **`workspace-invites-accept`** — validates token, inserts into `workspace_members`, records notifications.
- **`workspace-invites-resend`** — resends an email invite with a new token.

Deploy (all functions, invites included):

```bash
npm run supabase:deploy:functions
```

Secrets / env in Supabase (Edge Functions → *Secrets*):

| Secret | Purpose |
|--------|---------|
| `SUPABASE_URL` | Usually injected by Supabase |
| `SUPABASE_ANON_KEY` | JWT validation in functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB updates inside functions |
| `RESEND_API_KEY` | Required for **email** invites (`workspace-invites-create`, `workspace-invites-resend`) |
| `RESEND_FROM` | Sender on a [verified domain](https://resend.com/domains) (production), e.g. `Finance App <no-reply@example.com>` |
| `APP_BASE_URL` | **Production** public app origin, no trailing slash (e.g. `https://app.example.com`). Used when the HTTP `Origin` header is missing (e.g. some server-side invokes). Ensures invite links point at the real site. |

## Schema

The consolidated baseline (`supabase/migrations/00000000000000_baseline.sql`) plus the incremental migrations create all invite/workspace objects — `supabase db push` (or `supabase start` locally) is all you need.

- The invite token is **not stored in plain text** (`20260915120000_invite_token_not_stored.sql` dropped `token_raw`; validation uses `token_hash`). Publish the invite Edge Functions **before** that migration — the old `workspace-invites-create` writes the column.
- After any SQL change, **Settings → API → Reload schema** if PostgREST caches old policies (or `NOTIFY pgrst, 'reload schema'`).

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

## Smoke test

1. Owner opens **Membros** and sends an email invite → the pending invite appears.
2. Owner creates a link invite → open `invite_url` in incognito.
3. **Criar conta** or **Entrar**; confirm the URL still contains `token` when returning to `/invites/accept`.
4. Success message → **Dashboard** → sidebar switcher shows the shared workspace.
5. **Convidado(a):** com a carteira compartilhada selecionada, **Transações** e **Categorias** listam os dados do dono (não vazios).
6. **Convidado(a):** cria uma despesa e uma categoria → o dono vê os mesmos registros na mesma carteira.

Automated policy check (local): `npm run test:db` includes `workspace_core_data_rls.test.sql`.

Production verification (SQL Editor):

```sql
select tablename, policyname
from pg_policies
where schemaname = 'public'
  and tablename in ('transactions', 'categories')
order by tablename, policyname;
```

Expect policies named `Workspace members can view …` and **no** `Users can view own …` on those tables.
