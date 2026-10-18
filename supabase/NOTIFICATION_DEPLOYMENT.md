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

The notification tables (`push_subscriptions`, `notify_push`, the dedupe tables) live in the baseline: [`supabase/migrations/00000000000000_baseline.sql`](migrations/00000000000000_baseline.sql).

## Database Webhook (required for member expense alerts)

After deploying `notify-transaction-created`:

1. **Supabase Dashboard → Database → Webhooks → Create**
2. **Table:** `public.transactions`
3. **Events:** `INSERT`
4. **Target:** Edge Function `notify-transaction-created`  
   — or HTTP POST to `/functions/v1/notify-transaction-created` with body `{ "transaction_id": "{{ record.id }}" }`
5. **Auth:** `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`

The webhook is Dashboard configuration, invisible to migrations (see the note at the end of [`00000000000000_baseline.sql`](migrations/00000000000000_baseline.sql)).

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

## Publicar a revisão de 2026-10-17

Revisão dos textos e das regras de disparo (desenho em
`docs/superpowers/specs/2026-10-17-notificacoes-redesign-design.md`, seção C).
Está no repositório, testada (`npm run test:edge`), e **não foi publicada**.
Não há migração nova: só funções e os dois crons.

### 1. As funções, nesta ordem

O `supabase/functions/_shared` não se publica sozinho: vai embutido em cada
função. Como todas as cinco o usam (`notification-copy.ts`,
`notification-schedule.ts`, `deliver-notification.ts`, `notification-types.ts`,
`credit-card-cycle.ts`, `formatters.ts`), publique as cinco juntas.

```bash
supabase functions deploy evaluate-budgets
supabase functions deploy evaluate-credit-card-alerts
supabase functions deploy credit-card-calendar-alerts
supabase functions deploy evaluate-bills-reminders
supabase functions deploy dispatch-notifications
```

O que muda em cada uma:

| Função | Mudança |
|--------|---------|
| `evaluate-budgets` | Texto com categoria, mês e valores; o link abre a categoria no mês do orçamento (`?month=AAAA-MM`). |
| `evaluate-credit-card-alerts` | O limite usado soma a fatura aberta e a última fechada ainda não paga (`credit_card_invoice_payments`); texto com valores e disponível. |
| `credit-card-calendar-alerts` | Texto com o valor da fatura; não avisa fatura zerada nem vencimento já pago; "fechou" sai no dia seguinte ao fechamento; "fecha/vence em 3 dias" vale também com 2 (tolera um dia de cron perdido); só o interruptor "Cartões: fatura e vencimento" o desliga. |
| `evaluate-bills-reminders` | Texto com valor; a conta atrasada avisa no 1º dia de atraso e depois a cada 7 dias, e não todo dia. |
| `dispatch-notifications` | Só aceita `type: "system"` com um `kind` da lista fechada (vazia hoje): o resto recebe 400. O cliente já não chama esta função. |

Logo depois da publicação, uma conta já atrasada pode receber o aviso de
atraso mais uma vez (a chave de deduplicação mudou de formato).

### 2. Os crons (SQL Editor do projeto)

O calendário do cartão e as contas não estão agendados nas migrações: o
agendamento chama a função por HTTP com segredos do projeto, que não entram no
repositório. Rode no SQL Editor, trocando os marcadores — e **nunca** salve o
SQL preenchido no repositório:

- `<PROJECT_REF>`: o ref do projeto;
- `<CRON_SECRET>`: o secret `CRON_SECRET` das Edge Functions — é o que as duas
  funções conferem (`x-cron-secret`);
- `<SERVICE_ROLE_KEY>`: a chave de serviço do projeto (o `verify_jwt` dessas
  funções está desligado em `config.toml`; o cabeçalho cobre quem religá-lo no
  Dashboard).

`0 12 * * *` é 12:00 UTC, 09:00 em Brasília (o dia das funções é o de
`America/Sao_Paulo`).

```sql
select cron.unschedule(jobid) from cron.job
where jobname in ('credit-card-calendar-alerts-daily', 'bills-reminders-daily');

select cron.schedule(
  'credit-card-calendar-alerts-daily', '0 12 * * *',
  $cmd$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/credit-card-calendar-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := '{}'::jsonb
  )
  $cmd$
);

select cron.schedule(
  'bills-reminders-daily', '0 12 * * *',
  $cmd$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/evaluate-bills-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := '{}'::jsonb
  )
  $cmd$
);
```

Conferir: `select jobname, schedule from cron.job;` e, no dia seguinte,
`select * from cron.job_run_details order by start_time desc limit 10;`.
