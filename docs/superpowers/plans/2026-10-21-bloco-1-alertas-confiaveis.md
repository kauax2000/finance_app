# Bloco 1 — Alertas confiáveis: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa a tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** os avisos que já existem (cartão, contas a pagar, despesa de outro membro) disparam em produção sem depender de configuração manual no Dashboard. O banco ganha um backup semanal enquanto o Supabase estiver no Free.

**Arquitetura:**
- Uma função SQL `public.invoke_edge_function` chama uma Edge Function por `pg_net`, lendo a URL base e o segredo no Vault.
- Dois jobs de `pg_cron` e um trigger em `transactions` usam essa função. Os três substituem o SQL colado à mão e o Database Webhook do Dashboard.
- O cliente para de chamar `notify-transaction-created`, porque o trigger cobre toda origem.
- `dispatch-notifications`, sem nenhum chamador, é apagada.
- Um workflow do GitHub faz `pg_dump` semanal cifrado.

**Tecnologia:** Postgres (`pg_cron`, `pg_net`, `supabase_vault`), Edge Functions em Deno, Next.js, Vitest, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-20-proposta-funcional-design.md`, §5 (Bloco 1) e §3 (tabela do plano gratuito: "`pg_dump` semanal guardado fora (a montar no Bloco 1)").

## Restrições globais

- **O banco de dev é o de produção.**
  - Nenhuma tarefa roda `supabase db push`, `supabase functions deploy`, `supabase functions delete` nem SQL contra o projeto.
  - A aplicação é do dono, pelo roteiro da Tarefa 5.
- **O Supabase CLI local não roda.**
  - O que se testa aqui é por `npm run test:unit` (Vitest, inclusive testes que leem a fonte com `lerFonte`/`semComentarios` de `src/test/fonte.ts`) e por `npm run test:edge` (Deno, só `supabase/functions/_shared`).
- **Nenhum segredo, URL de projeto, ref de projeto nem chave entra no repositório.**
  - O repositório é **público** no GitHub.
  - Segredos ficam no Vault (banco), nos Secrets das Edge Functions ou nos Secrets do GitHub.
- **Horário dos crons:** `0 12 * * *` (12:00 UTC, 09:00 em Brasília), como já está documentado em `supabase/NOTIFICATION_DEPLOYMENT.md`.
- **Nomes dos jobs:** `credit-card-calendar-alerts-daily` e `bills-reminders-daily`, os mesmos do SQL manual de hoje, para o `cron.unschedule` da migração substituir o que o dono criou à mão.
- **Nomes no Vault:**
  - `edge_functions_url`: valor `https://<ref>.supabase.co/functions/v1`, sem barra final;
  - `cron_secret`: o mesmo valor do secret `CRON_SECRET` das Edge Functions.
- **Mudança de jornada:** atualizar `docs/JORNADAS.md`, `docs/atlas/template.html`, rodar `python3 docs/atlas/build.py` e republicar o Atlas (regra do `AGENTS.md`).
- **Fechamento de cada tarefa de código:** `npx tsc --noEmit && npm run lint && npm run test:unit` verdes.

## Foco de revisão

1. **O trigger nunca pode derrubar o `insert` de uma transação.** Se faltar segredo no Vault, se o `pg_net` falhar ou se a URL for inválida, a despesa tem de ser salva. O teste de fonte da Tarefa 1 exige `exception when others` dentro de `invoke_edge_function` e o retorno `null` quando falta segredo.
2. **A função SQL não pode ser chamável pelo app.** Um `authenticated` chamando `invoke_edge_function` dispararia funções internas com o segredo. A Tarefa 1 exige `revoke all ... from public, anon, authenticated`.
3. **Despesa lançada offline e sincronizada depois:** sem a chamada do cliente, quem avisa os membros é o trigger, no `insert` que a fila faz ao reconectar. A Tarefa 2 garante que nenhum caminho do cliente volte a chamar a função, e a Tarefa 1 garante que o trigger dispara em todo `insert` de despesa.
4. **Segredo vazando no log público do Actions:** o `pg_dump` e o `gpg` não podem ecoar a URL do banco nem a senha. A Tarefa 4 exige o segredo só por variável de ambiente, nunca interpolado na linha de comando com `${{ }}`.
5. **Parcela e assinatura lançadas pelo cron não podem avisar os membros como "despesa nova"** (regra de `transaction-notify-rules.ts`). O `WHEN` do trigger da Tarefa 1 filtra `subscription_id is null and installment_plan_id is null`, e o teste de fonte cobra isso.

---

### Tarefa 1: Chamada interna por `pg_net`, crons e trigger na migração

**Arquivos:**
- Criar: `supabase/migrations/20261021120000_internal_edge_dispatch.sql`
- Modificar: `supabase/functions/notify-transaction-created/index.ts:26-32` (`isServiceAuthorized`)
- Teste: `src/lib/internal-edge-dispatch.test.ts`

**Interfaces:**
- Produz `public.invoke_edge_function(p_function text, p_body jsonb default '{}'::jsonb) returns bigint`:
  - devolve o id do pedido do `pg_net`, ou `null` quando faltam os segredos ou quando a chamada falha;
  - é `security definer` com `set search_path = ''`.
- Produz o trigger `transactions_notify_created` (`after insert on public.transactions for each row`).
- Produz os jobs `credit-card-calendar-alerts-daily` e `bills-reminders-daily`.
- `notify-transaction-created` passa a aceitar `x-cron-secret` igual a `CRON_SECRET`. Ele substitui o `x-notify-internal-secret`/`NOTIFY_INTERNAL_SECRET`, que sai. O `Bearer` da service role continua aceito, porque o Webhook do Dashboard só é removido depois.

- [ ] **Passo 1: escrever o teste de fonte que falha**

Em `src/lib/internal-edge-dispatch.test.ts`, com `lerFonte`/`semComentarios`. Os testes e o que cada um afirma:

| Teste | Afirma |
|---|---|
| `"a migração lê URL e segredo do Vault, sem literal"` | contém `vault.decrypted_secrets`, `'edge_functions_url'`, `'cron_secret'`; **não** contém `supabase.co`, `Bearer ` nem `eyJ` |
| `"invoke_edge_function não derruba quem chama"` | contém `exception when others` e `return null` |
| `"invoke_edge_function não é do app"` | casa `/revoke all on function public\.invoke_edge_function\(text, jsonb\) from public, anon, authenticated/i` e contém `security definer` e `set search_path = ''` |
| `"os dois crons substituem os manuais"` | contém `'credit-card-calendar-alerts-daily'`, `'bills-reminders-daily'`, `'0 12 * * *'` (duas vezes) e `cron.unschedule` |
| `"o trigger só pega despesa manual"` | contém `after insert on public.transactions`, `new.type = 'expense'`, `new.subscription_id is null`, `new.installment_plan_id is null` e `'notify-transaction-created'` |
| `"o webhook entende o segredo do cron"` | a fonte de `supabase/functions/notify-transaction-created/index.ts` contém `'x-cron-secret'` e `CRON_SECRET`, e **não** contém `NOTIFY_INTERNAL_SECRET` |

- [ ] **Passo 2: rodar e ver falhar**

Rode: `npx vitest run src/lib/internal-edge-dispatch.test.ts`
Esperado: FAIL, com `ENOENT` no arquivo de migração.

- [ ] **Passo 3: escrever a migração**

Ela tem três partes. Siga o padrão do Apêndice C do `00000000000000_baseline.sql`: o bloco `do $$ ... if exists (select 1 from pg_extension where extname = 'pg_cron')`, que vira no-op no ambiente local.

1. **`invoke_edge_function`:**
   - lê `edge_functions_url` e `cron_secret` de `vault.decrypted_secrets`;
   - se algum faltar, faz `raise notice` e devolve `null`;
   - senão, chama `net.http_post(url := v_url || '/' || p_function, headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', v_secret), body := p_body)`;
   - envolve tudo em `begin ... exception when others then raise warning ...; return null; end`;
   - leva o `revoke` do teste.
2. **Os dois jobs:**
   - `cron.unschedule` dos nomes, se existirem;
   - depois `cron.schedule(nome, '0 12 * * *', $cmd$select public.invoke_edge_function('<função>')$cmd$)`, para `credit-card-calendar-alerts` e para `evaluate-bills-reminders`.
3. **O trigger:**
   - a função `public.transactions_notify_created()` faz `perform public.invoke_edge_function('notify-transaction-created', jsonb_build_object('transaction_id', new.id))` e `return null`;
   - o trigger leva `when (new.type = 'expense' and new.subscription_id is null and new.installment_plan_id is null)`;
   - atualize o `comment on table public.transactions` para citar o trigger em vez do Webhook.

- [ ] **Passo 4: o webhook entende o segredo do cron**

Em `isServiceAuthorized`, troque a linha de `NOTIFY_INTERNAL_SECRET`/`x-notify-internal-secret` por `secretMatches(Deno.env.get('CRON_SECRET'), req.headers.get('x-cron-secret'))`. Em `corsHeaders`, tire `x-notify-internal-secret`.

- [ ] **Passo 5: rodar e ver passar**

Rode: `npx vitest run src/lib/internal-edge-dispatch.test.ts && npx tsc --noEmit && npm run lint`
Esperado: PASS.

- [ ] **Passo 6: commit**

```bash
git add supabase/migrations/20261021120000_internal_edge_dispatch.sql supabase/functions/notify-transaction-created/index.ts src/lib/internal-edge-dispatch.test.ts
git commit -m "feat(alertas): crons e aviso de despesa por pg_net e Vault, sem Dashboard"
```

---

### Tarefa 2: O cliente para de avisar os membros

**Arquivos:**
- Apagar: `src/lib/transaction-notifications.ts`
- Modificar: `src/lib/transactions/mutations.ts:13,105` e `src/lib/offline/handlers/transactions.ts:11,82` (tirar o import e a chamada de `scheduleNotifyTransactionCreated`)
- Teste: `src/lib/notification-producers.test.ts`

**Interfaces:**
- Consome: o trigger `transactions_notify_created` (Tarefa 1).
- Produz: nenhum arquivo de `src/` cita `notify-transaction-created`.

- [ ] **Passo 1: escrever o teste que falha**

Em `notification-producers.test.ts`, crie o teste `"o aviso de despesa nova é do banco, não do cliente"`:
- para cada arquivo de `arquivosTsx("src")` mais os `.ts` de `src/lib`, `semComentarios(lerFonte(caminho))` não contém `"notify-transaction-created"`;
- `existsSync("src/lib/transaction-notifications.ts")` é `false`.

Se `arquivosTsx` não cobrir `.ts`, monte a lista com `readdirSync(..., { recursive: true })`, filtrando `.ts`/`.tsx` e excluindo os `.test.`.

- [ ] **Passo 2: rodar e ver falhar**

Rode: `npx vitest run src/lib/notification-producers.test.ts`
Esperado: FAIL, nos três arquivos citados.

- [ ] **Passo 3: apagar o módulo e as duas chamadas**

- [ ] **Passo 4: rodar e ver passar**

Rode: `npx vitest run src/lib/notification-producers.test.ts && npx tsc --noEmit && npm run lint && npm run test:unit`
Esperado: PASS.

- [ ] **Passo 5: commit**

```bash
git add -A src/lib
git commit -m "refactor(alertas): o trigger avisa os membros; o cliente não chama mais a Edge"
```

---

### Tarefa 3: Apagar `dispatch-notifications`

**Arquivos:**
- Apagar: `supabase/functions/dispatch-notifications/`
- Modificar: `supabase/config.toml:17-18` (o bloco `[functions.dispatch-notifications]`), e `package.json:27` (tirar `dispatch-notifications` do script `supabase:deploy:functions`)
- Teste: `src/lib/notification-producers.test.ts`

**Interfaces:** nenhuma. A função não tem chamador (o `ALLOWED_KINDS` está vazio, e o teste existente já trava o cliente).

- [ ] **Passo 1: escrever o teste que falha**

Teste `"dispatch-notifications não existe mais"`, que afirma três coisas:
- `existsSync("supabase/functions/dispatch-notifications")` é `false`;
- `lerFonte("supabase/config.toml")` não contém `dispatch-notifications`;
- `lerFonte("package.json")` não contém `dispatch-notifications`.

- [ ] **Passo 2: rodar e ver falhar**

Rode: `npx vitest run src/lib/notification-producers.test.ts`. Esperado: FAIL.

- [ ] **Passo 3: apagar a pasta e as duas referências**

- [ ] **Passo 4: rodar e ver passar**

Rode: `npx vitest run src/lib/notification-producers.test.ts && npm run lint`. Esperado: PASS.

- [ ] **Passo 5: commit**

```bash
git add -A supabase/functions supabase/config.toml package.json src/lib/notification-producers.test.ts
git commit -m "chore(alertas): remove dispatch-notifications, sem chamador"
```

---

### Tarefa 4: Backup semanal cifrado

**Arquivos:**
- Criar: `.github/workflows/backup-db.yml`
- Teste: `src/lib/backup-workflow.test.ts`

**Interfaces:**
- Consome os Secrets do GitHub `SUPABASE_DB_URL` (a URL de conexão do pooler em modo sessão, com a senha) e `BACKUP_PASSPHRASE`.
- O dono os cadastra pela Tarefa 5.

- [ ] **Passo 1: escrever o teste de fonte que falha**

`src/lib/backup-workflow.test.ts` lê o YAML e afirma:
- contém `schedule:`, a expressão `cron: "0 6 * * 0"` e `workflow_dispatch:`;
- contém `postgres:17`, `pg_dump`, `--symmetric`, `--cipher-algo AES256` e `retention-days: 90`;
- os segredos só entram em `env:`: a linha que contém `pg_dump` **não** contém `${{`;
- não contém `upload-artifact` antes de `gpg`. Confira pela ordem dos índices: o `gpg` vem antes.

- [ ] **Passo 2: rodar e ver falhar**

Rode: `npx vitest run src/lib/backup-workflow.test.ts`. Esperado: FAIL (`ENOENT`).

- [ ] **Passo 3: escrever o workflow**

- um job `ubuntu-latest`;
- `env` do passo: `DB_URL: ${{ secrets.SUPABASE_DB_URL }}` e `PASS: ${{ secrets.BACKUP_PASSPHRASE }}`;
- passo único: `docker run --rm -e DB_URL postgres:17 sh -c 'pg_dump "$DB_URL" -Fc --no-owner'`, com a saída direto para `gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase-fd 0`, alimentado por `printf %s "$PASS"`, gerando `backup-$(date +%F).dump.gpg`;
- depois `actions/upload-artifact@v4` com `retention-days: 90`;
- antes do `pg_dump`, um passo que falha com mensagem clara se `SUPABASE_DB_URL` ou `BACKUP_PASSPHRASE` estiverem vazios;
- `permissions: contents: read`.

> ponytail: o artefato fica no próprio GitHub, cifrado e por 90 dias (~12 cópias semanais). Quando o Supabase virar Pro (backup diário próprio), este workflow pode sair.

- [ ] **Passo 4: rodar e ver passar**

Rode: `npx vitest run src/lib/backup-workflow.test.ts && npm run lint`. Esperado: PASS.

- [ ] **Passo 5: commit**

```bash
git add .github/workflows/backup-db.yml src/lib/backup-workflow.test.ts
git commit -m "chore(backup): pg_dump semanal cifrado enquanto o Supabase for Free"
```

---

### Tarefa 5: Roteiro de publicação, jornadas e Atlas

**Arquivos:**
- Reescrever: `supabase/NOTIFICATION_DEPLOYMENT.md`, as seções "Database Webhook" e "Publicar a revisão de 2026-10-17"
- Modificar: `docs/JORNADAS.md`:
  - a linha "Notificações no servidor" (~387), sem `dispatch-notifications` e com o trigger e os crons da migração;
  - o nó `saveTx --> after` (~520): `notify-transaction-created` sai do cliente e vira o trigger do banco;
  - a lacuna 8 (§11): ela passa a apontar o roteiro e **continua aberta até o dono publicar**.
- Modificar: `docs/atlas/template.html`, com as mesmas mudanças, a data e as contagens da capa. Depois rodar `python3 docs/atlas/build.py`.

**Interfaces:** consome os nomes das Tarefas 1, 3 e 4.

- [ ] **Passo 1: escrever o roteiro**

O roteiro vem em ordem numerada, e **todo SQL leva marcadores, nunca valores**:

1. **Secrets das Edge Functions:** `CRON_SECRET` existe. `NOTIFY_INTERNAL_SECRET` pode ser apagado depois do passo 6.
2. **Vault**, no SQL Editor:
   - `select vault.create_secret('https://<PROJECT_REF>.supabase.co/functions/v1', 'edge_functions_url');`
   - `select vault.create_secret('<CRON_SECRET>', 'cron_secret');`
   - Para trocar um valor depois, `vault.update_secret`.
3. **Migração:** `supabase db push`. Conferir:
   - `select jobname, schedule from cron.job;` mostra os dois jobs;
   - `select tgname from pg_trigger where tgname = 'transactions_notify_created';` devolve uma linha.
4. **Funções:**
   - `supabase functions deploy evaluate-budgets evaluate-credit-card-alerts credit-card-calendar-alerts evaluate-bills-reminders notify-transaction-created workspace-invites-accept`;
   - depois `supabase functions delete dispatch-notifications`.
5. **Remover o Database Webhook** de `transactions` em Dashboard → Database → Webhooks. Senão cada despesa avisa duas vezes; a deduplicação segura, mas gasta.
6. **Teste de fumaça:**
   - a outra pessoa lança uma despesa numa carteira compartilhada e o aviso chega;
   - `select * from net._http_response order by created desc limit 5;` mostra 200;
   - no dia seguinte, `select * from cron.job_run_details order by start_time desc limit 10;`.
7. **Backup:**
   - em GitHub → Settings → Secrets, cadastrar `SUPABASE_DB_URL` (a do pooler em modo sessão) e `BACKUP_PASSPHRASE` (40+ caracteres, guardada também fora do GitHub);
   - rodar o workflow por "Run workflow";
   - para restaurar: `gpg -d backup-AAAA-MM-DD.dump.gpg | pg_restore --no-owner -d "<DB_URL_DESTINO>"`.
8. **Ordem com o front:** publicar o front (Tarefa 2) **depois** do passo 3. Antes disso, quem avisa é o Webhook.

- [ ] **Passo 2: atualizar `JORNADAS.md` e `template.html`, e regenerar o Atlas**

Rode: `python3 docs/atlas/build.py`. Esperado: termina sem erro e `git diff --stat docs/atlas/atlas-jornadas.html` mostra mudança.

- [ ] **Passo 3: conferir que nenhum valor real entrou**

Rode: `git diff --cached | grep -E "supabase\.co/|eyJ|postgres(ql)?://[^<]"`.
Esperado: nenhuma linha. Os marcadores `<PROJECT_REF>` e `<DB_URL_DESTINO>` são permitidos.

- [ ] **Passo 4: commit**

```bash
git add supabase/NOTIFICATION_DEPLOYMENT.md docs/JORNADAS.md docs/atlas/template.html docs/atlas/atlas-jornadas.html
git commit -m "docs(alertas): roteiro de publicação do Bloco 1, jornadas e Atlas"
```

- [ ] **Passo 5 (orquestrador, fora do subagente):** republicar `docs/atlas/atlas-jornadas.html` no URL do Atlas, https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL, com a ferramenta de Artifact.
