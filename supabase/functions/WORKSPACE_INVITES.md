# Workspace Invite Functions

This project uses two Edge Functions for workspace invites:

- `workspace-invites-create`
- `workspace-invites-accept`

## Required environment variables

Configure these in Supabase project secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_BASE_URL` (example: `https://app.example.com`)
- `RESEND_API_KEY`
- `RESEND_FROM` (example: `Finance App <no-reply@example.com>`)

## Deployment

Use the existing npm script:

```bash
npm run supabase:deploy:functions
```

It deploys both invite functions plus existing security functions.

## Smoke test

1. Log in as workspace owner.
2. Open `Membros` and send invite to a valid user email.
3. Confirm pending invite appears.
4. Open email link as invited user.
5. Confirm invite is accepted and workspace membership is created.

