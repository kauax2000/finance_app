# Edge Functions com Supabase local

O Next.js chama funções via `supabase.functions.invoke` (ex.: `sessions`). Com **Supabase local**, o API (`supabase start`) **não serve** as Edge Functions sozinhas: é preciso **`supabase functions serve`** noutro terminal.

## Pré-requisitos

- Docker a correr
- CLI: `supabase` instalada

## 1. Variáveis `.env.local`

Use o **API URL** e a **anon key** que o `supabase start` imprime (geralmente `http://127.0.0.1:54321`).

Ver também [`.env.example`](../.env.example).

## 2. Subir o stack

```bash
supabase start
```

## 3. Servir as funções

Num **segundo** terminal, na raiz do repo:

```bash
supabase functions serve sessions
```

Ou todas de uma vez:

```bash
supabase functions serve
```

## 4. Verificar CORS / rota (opcional)

Com o stack e `functions serve` ativos:

```bash
curl -i -X OPTIONS "http://127.0.0.1:54321/functions/v1/sessions" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization, apikey, content-type, x-app-session-id"
```

Esperado: `HTTP/1.1 200` e cabeçalhos `access-control-allow-*`.

## Erros comuns

| Sintoma | Ação |
|--------|------|
| "Não foi possível contactar as Edge Functions" | Confirme `supabase start` + `supabase functions serve` |
| 404 na função | Função não está a ser servida; use `serve sessions` ou `serve` |
| Docker não liga | Inicie o Docker Desktop (ou daemon) e volte a `supabase start` |

## `verify_jwt` em produção

[`config.toml`](./config.toml) define `verify_jwt = false` para várias funções. **Após alterar**, faça redeploy no projeto hospedado para o Dashboard aplicar a mesma política.

## `credit-card-calendar-alerts` (cron)

Função agendada: envia lembretes de fechamento/vencimento de fatura. **Não usa JWT**; exige o segredo:

1. Defina o secret no projeto: `supabase secrets set CRON_SECRET=...` (produção) ou no `.env` local servido com `--env-file` ao `functions serve`.
2. Chame diariamente (Dashboard → Edge Functions → Schedules, ou cron externo):

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/credit-card-calendar-alerts" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json"
```

3. Implante: `supabase functions deploy credit-card-calendar-alerts` (e `evaluate-credit-card-alerts` para alertas pós-transação).

## `run-recurring-billing` (cron — assinaturas e parcelas)

Cria transações quando `next_billing_date` está em dia (UTC), via RPCs `run_subscription_billing` e `run_installment_billing`. **Não usa JWT**; exige o mesmo `CRON_SECRET` que as outras funções de cron.

1. **Secret:** `supabase secrets set CRON_SECRET=...` no projeto hospedado. Em local, use `--env-file` com o ficheiro que define `CRON_SECRET`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` ao servir funções.

2. **Agendar (produção):** Dashboard → Edge Functions → agendar `run-recurring-billing` com POST diário e cabeçalho `x-cron-secret`, ou cron externo (GitHub Actions, etc.) que chame o URL abaixo.

3. **Teste local** (com `supabase start` + `supabase functions serve run-recurring-billing --env-file .env.local` ou equivalente):

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/run-recurring-billing" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json"
```

Resposta esperada: JSON com `subscription_billed` e `installment_billed` (números de linhas criadas nesta execução).

4. **Deploy:** `supabase functions deploy run-recurring-billing --project-ref <ref>`

### `pg_cron` vs Edge

As migrações podem registar jobs `subscription-billing-daily` e `installment-billing-daily` **só se** a extensão `pg_cron` existir quando a migração corre. Se não houver cron na base, esta Edge Function é o caminho fiável. Se **ambos** estiverem ativos, é seguro: as RPCs são idempotentes no mesmo dia (não duplicam cobrança para a mesma data). Para **apenas** Edge, pode remover os jobs na SQL Editor: `select cron.unschedule(jobid) from cron.job where jobname in ('subscription-billing-daily','installment-billing-daily');` (requer `pg_cron` e permissões adequadas).
