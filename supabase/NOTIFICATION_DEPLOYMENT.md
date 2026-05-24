# Notifications & push: deployment checklist

Use this when enabling **Web Push** and **member expense alerts** in a Supabase project.

## Edge Functions

Deploy with:

```bash
npm run supabase:deploy:functions
```

Includes:

| Function | Purpose |
|----------|---------|
| `push-subscribe` / `push-unsubscribe` | Device Web Push registration |
| `dispatch-notifications` | Client-triggered system notifications |
| `notify-transaction-created` | **Database webhook** — alerts other members on manual expense in shared workspace |
| `evaluate-budgets`, `evaluate-credit-card-alerts`, `credit-card-calendar-alerts`, `evaluate-bills-reminders` | Scheduled / invoked producers |

## Secrets (Supabase Edge Functions → Secrets)

| Secret | Purpose |
|--------|---------|
| `VAPID_PUBLIC_KEY` | Same value as client `NEXT_PUBLIC_VAPID_PUBLIC_KEY` |
| `VAPID_PRIVATE_KEY` | Web Push signing (never in repo / Vercel) |
| `VAPID_SUBJECT` | e.g. `mailto:support@yourdomain.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Used by `notify-transaction-created` auth |
| `NOTIFY_INTERNAL_SECRET` | Optional; send as `x-notify-internal-secret` from Database Webhook |
| `APP_BASE_URL` | Production app origin for email links |

Client (Vercel + `.env.local`):

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
```

Generate keys:

```bash
npx web-push generate-vapid-keys
```

## Database

Apply migrations:

```bash
supabase db push
```

Key migration: `20260518120000_push_subscriptions.sql` (`push_subscriptions`, `notify_push`).

## Database Webhook (required for member expense alerts)

After deploying `notify-transaction-created`:

1. **Supabase Dashboard → Database → Webhooks → Create**
2. **Table:** `public.transactions`
3. **Events:** `INSERT`
4. **Target:** Edge Function `notify-transaction-created`  
   — or HTTP POST to `/functions/v1/notify-transaction-created` with body `{ "transaction_id": "{{ record.id }}" }`
5. **Auth:** `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`

See also [`supabase/migrations/20260524120000_notify_transaction_created_webhook.sql`](migrations/20260524120000_notify_transaction_created_webhook.sql).

## iPhone PWA push checklist

1. iOS **16.4+**, production HTTPS URL, login.
2. Safari → **Adicionar à Tela de Início** → open from home screen.
3. **Configurações → Notificações → Push no dispositivo** → grant system permission.
4. Trigger test (e.g. create category) → in-app + system notification.
5. App backgrounded → tap notification opens correct route.

## Member expense smoke test

1. Shared workspace with User A + User B.
2. User A: enable **Alertas financeiros importantes** + **Push no dispositivo** (PWA on iPhone).
3. User B: add manual expense in shared workspace.
4. User A: in-app notification + push (if enabled).
5. User B adds income → no alert.
6. Subscription/installment expense → no alert.
7. Personal workspace expense → no alert.

Automated unit tests: `npm run test:unit` (`transaction-notify-rules`, `notification-href`).
