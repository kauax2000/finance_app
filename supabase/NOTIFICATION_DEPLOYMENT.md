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
| `notify-transaction-created` | Alerts other members on a manual expense in a shared workspace; called by the `transactions_notify_created` trigger (`pg_net`), not by the app |
| `evaluate-budgets`, `evaluate-credit-card-alerts`, `credit-card-calendar-alerts`, `evaluate-bills-reminders` | Scheduled / invoked producers |

## Secrets (Supabase Edge Functions → Secrets)

| Secret | Purpose |
|--------|---------|
| `VAPID_PUBLIC_KEY` | Same value as client `NEXT_PUBLIC_VAPID_PUBLIC_KEY` |
| `VAPID_PRIVATE_KEY` | Web Push signing (never in repo / Vercel) |
| `VAPID_SUBJECT` | e.g. `mailto:support@yourdomain.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Used by `notify-transaction-created` auth (Bearer, until the old Database Webhook is removed) |
| `CRON_SECRET` | Sent as `x-cron-secret` by the crons and by the expense trigger; same value as the `cron_secret` Vault secret |
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

The migration `20261021120000_internal_edge_dispatch.sql` holds the calls to the Edge Functions: `public.invoke_edge_function` (reads the Vault secrets `edge_functions_url` and `cron_secret`; with either missing it does nothing), the two daily crons and the trigger `transactions_notify_created`. It needs `pg_cron`, `pg_net` and Vault (Database → Extensions).

## Aviso de despesa: trigger, não Webhook

A despesa manual avisa os outros membros pelo trigger `transactions_notify_created`
(`AFTER INSERT` em `public.transactions`, só despesa sem assinatura nem parcela),
que chama `notify-transaction-created` por `pg_net` com o cabeçalho
`x-cron-secret`. Depois da publicação não há Database Webhook no Dashboard, e o app não
chama mais a função: uma despesa lançada offline avisa quando a fila a insere. O trigger
nunca derruba o `insert`: sem segredo no Vault ou com falha de rede, a despesa
é salva e o aviso se perde.

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

## Publicar o Bloco 1 (alertas confiáveis)

Reúne a revisão dos textos e das regras de disparo (2026-10-17, desenho em
`docs/superpowers/specs/2026-10-17-notificacoes-redesign-design.md`, seção C),
os crons e o aviso de despesa no banco, e o backup semanal. Está no
repositório, testado, e **não foi publicado**. Faça na ordem. Todo SQL abaixo
leva marcadores: troque-os no SQL Editor e **nunca** salve o SQL preenchido no
repositório (ele é público).

### 1. Secrets das Edge Functions

`CRON_SECRET` já existe (Edge Functions → Secrets): é o valor que o passo 2
repete no Vault. `NOTIFY_INTERNAL_SECRET` fica sem uso e pode ser **apagado
depois do passo 6**.

### 2. Vault (SQL Editor)

Precisa das extensões `pg_cron` e `pg_net` ligadas (Database → Extensions).

- `<PROJECT_REF>`: o ref do projeto;
- `<CRON_SECRET>`: o mesmo valor do secret `CRON_SECRET` do passo 1.

```sql
select vault.create_secret('https://<PROJECT_REF>.supabase.co/functions/v1', 'edge_functions_url');
select vault.create_secret('<CRON_SECRET>', 'cron_secret');
```

A URL não leva barra final. Para trocar um valor depois, use
`vault.update_secret` (o `id` sai de `select id, name from vault.secrets;`).

### 3. Migração

```bash
supabase db push
```

A migração `20261021120000_internal_edge_dispatch.sql` agenda os dois crons
(`credit-card-calendar-alerts-daily` e `bills-reminders-daily`, às `0 12 * * *`:
12:00 UTC, 09:00 em Brasília; o dia das funções é o de `America/Sao_Paulo`) e
**substitui** os de mesmo nome que existirem, inclusive os criados à mão pelo
SQL antigo deste documento. Também cria o trigger. Conferir:

```sql
select jobname, schedule from cron.job;
select tgname from pg_trigger where tgname = 'transactions_notify_created';
```

O primeiro mostra os dois jobs; o segundo devolve uma linha.

### 4. Funções

O `_shared` vai embutido em cada função no deploy: **toda função que importa
um módulo mudado do `_shared` precisa ser publicada de novo**, ou continua com
a cópia antiga. Os módulos mudados são `notification-copy.ts`,
`notification-schedule.ts`, `deliver-notification.ts`, `notification-types.ts`,
`credit-card-cycle.ts` e `formatters.ts`, e a `notify-transaction-created`
também mudou a autenticação (aceita `x-cron-secret`).

```bash
supabase functions deploy evaluate-budgets evaluate-credit-card-alerts credit-card-calendar-alerts evaluate-bills-reminders notify-transaction-created workspace-invites-accept
supabase functions delete dispatch-notifications
```

A `dispatch-notifications` saiu do repositório (ninguém a chama): o `delete`
tira a cópia publicada. As outras funções (`activity-logs`, `delete-user`,
`push-*`, `run-recurring-billing`, `sessions`, `workspace-invites-create`,
`workspace-invites-resend`) não importam nada que mudou.

O que muda em cada uma:

| Função | Mudança |
|--------|---------|
| `evaluate-budgets` | Texto com categoria, mês e valores; o link abre a categoria no mês do orçamento (`?month=AAAA-MM`). |
| `evaluate-credit-card-alerts` | O limite usado soma a fatura aberta e a última fechada ainda não paga (`credit_card_invoice_payments`); texto com valores e disponível. |
| `credit-card-calendar-alerts` | Texto com o valor da fatura; não avisa fatura zerada nem vencimento já pago; "fechou" sai no dia seguinte ao fechamento; "fecha/vence em 3 dias" vale também com 2 (tolera um dia de cron perdido); só o interruptor "Cartões: fatura e vencimento" o desliga. |
| `evaluate-bills-reminders` | Texto com valor; a conta atrasada avisa no 1º dia de atraso e depois a cada 7 dias, e não todo dia (tolera um dia de cron perdido: o aviso da janela sai no 1º ou no 2º dia dela, uma vez só). |
| `notify-transaction-created` | O valor da despesa sai no formato novo ("R$ 1.234,56" escrito à mão, sem o `Intl` do runtime), o link passa pela checagem nova, e a autenticação passa a ser o `x-cron-secret` do trigger (o Bearer da chave de serviço segue aceito até o passo 5). |
| `workspace-invites-accept` | O link do aviso de convite aceito passa pela checagem nova (recusa `\`, caractere de controle e `//`). |

Logo depois da publicação, uma conta já atrasada pode receber o aviso de
atraso mais uma vez (a chave de deduplicação mudou de formato).

### 5. Remover o Database Webhook

Em Dashboard → Database → Webhooks, apague o webhook de `transactions`. Senão
cada despesa avisa duas vezes (a deduplicação segura, mas a função roda à toa).

### 6. Teste de fumaça

1. A outra pessoa lança uma despesa numa carteira compartilhada e o aviso chega.
2. No SQL Editor, `select * from net._http_response order by created desc limit 5;`
   mostra status 200 para a chamada.
3. No dia seguinte, `select * from cron.job_run_details order by start_time desc limit 10;`
   mostra as duas execuções das 12:00 UTC com `succeeded`.

Passou? Apague o secret `NOTIFY_INTERNAL_SECRET` das Edge Functions.

### 7. Backup semanal

O workflow `.github/workflows/backup-db.yml` roda aos domingos, 06:00 UTC, e
sob demanda. Guarda o `pg_dump` cifrado como artefato por 90 dias.

1. Em GitHub → Settings → Secrets and variables → Actions, cadastre:
   - `SUPABASE_DB_URL`: a connection string do **pooler em modo sessão**
     (Dashboard → Connect). Use o pooler, e não o host direto
     `db.<PROJECT_REF>.supabase.co`: o runner do GitHub não tem IPv6 e o host
     direto falha;
   - `BACKUP_PASSPHRASE`: longa e aleatória (40 caracteres ou mais), guardada
     **também fora do GitHub** (gerenciador de senhas). Sem ela o backup não
     abre, e o repositório é **público**: os artefatos de um repositório
     público podem ser baixados por qualquer conta logada no GitHub, e só a
     cifra os protege.
2. Em Actions → "Backup semanal do banco" → **Run workflow**, rode uma vez.
3. **Verifique o backup uma vez**: baixe o artefato `backup-db`, decifre e liste.

   ```bash
   gpg -d backup-AAAA-MM-DD.dump.gpg > backup.dump
   pg_restore --list backup.dump
   ```

   A lista de tabelas tem de sair completa.
4. Para restaurar:

   ```bash
   gpg -d backup-AAAA-MM-DD.dump.gpg | pg_restore --no-owner -d "<DB_URL_DESTINO>"
   ```

O GitHub **desliga os workflows agendados** de um repositório sem atividade por
60 dias. De vez em quando abra a aba Actions: se o agendamento estiver
desligado, religue-o ("Enable workflow") ou rode o workflow à mão.

### 8. Ordem com o front

Publique o front (o que tirou a chamada do cliente a `notify-transaction-created`)
**depois** do passo 3. Antes disso, quem avisa as despesas é o Webhook; o
passo 5 só vem depois do 3, para nunca haver um intervalo em que nada avisa.
