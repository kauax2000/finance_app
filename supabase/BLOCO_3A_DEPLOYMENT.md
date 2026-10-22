# Publicar o Bloco 3A: captura sem abrir o app

Reúne a captura de gastos fora do app e a fila do que precisa de conferência:

- o token pessoal de captura (`fac_…`), criado e revogado em Minha conta;
- a Edge `capture`, chamada pelo Atalho do iPhone e pela automação do Apple Pay
  (guia em `docs/captura/atalho-iphone.md`);
- o apelido do cartão na Wallet (`credit_cards.wallet_alias`);
- a frase rápida no formulário de lançamento e o compartilhar do Android;
- a lista "A conferir" (`/transactions?conferir=1`), a contagem no Painel e o
  lembrete das 20h (cron `review-reminder-daily` e Edge `review-reminder`);
- o caminho de serviço dos avaliadores (`evaluate-budgets` e
  `evaluate-credit-card-alerts` aceitam o Bearer da service role e o
  `x-cron-secret`, além do JWT).

As telas novas entram como **wireframe** (`src/components/wireframe/`).

**Estado em 22/10/2026: nada publicado.** O banco e as funções dos Blocos 1 e 2
estão no ar desde 21/10/2026 (migrações, funções, Vault com `edge_functions_url`
e `cron_secret`, `pg_cron` e `pg_net` ligados). O front do `finance-app-2.0` não
está: ele só vai para `main`, e para produção, quando os Blocos 1 a 7 estiverem
prontos (decisão do dono).

**O backend do 3A pode subir antes do front.** Nada do 3A aparece para quem usa o
front de `main`:

- os tokens só nascem pela tela do 2.0;
- sem token, ninguém chama a `capture`;
- sem itens `needs_review`, o lembrete não acha ninguém.

Os itens `needs_review` só nascem pela importação e pela captura do 2.0. Veja
"Compatibilidade", abaixo.

Faça na ordem. Todo SQL abaixo leva marcadores: troque-os no SQL Editor e
**nunca** salve o SQL preenchido no repositório (ele é público). Os marcadores
são `<WORKSPACE_ID>`, `<USER_ID>`, `<EMAIL>`, `<TOKEN_ID>`, `<TX_ID>`,
`<TOKEN>` e `<URL>`.

## 0. Pré-requisito: Blocos 1 e 2 publicados

O cron do lembrete chama a Edge pela `public.invoke_edge_function`, que nasce no
Bloco 1 e lê do Vault os segredos `edge_functions_url` e `cron_secret`. Em
produção isso já está feito. Confira só os nomes, nunca o valor:

```sql
select name from vault.secrets where name in ('edge_functions_url', 'cron_secret');
```

Duas linhas.

## 1. Migração

```bash
supabase db push --linked
```

Aplica uma migração, `20261023120000_captura.sql`:

| Parte | O que faz |
|-------|-----------|
| `capture_tokens` | A tabela dos tokens: guarda só o `sha256` (`token_hash`), com RLS. `authenticated` lê só as colunas sem o hash; nenhuma política de escrita |
| `create_capture_token` · `revoke_capture_token` | RPCs `security definer`. A primeira confere se a pessoa é membro, limita 10 tokens ativos por pessoa e devolve o texto do token uma vez só. A segunda marca `revoked_at` |
| `workspace_plan` | Devolve `'familia'` para toda carteira, até o Bloco 4 |
| Colunas | `credit_cards.wallet_alias`, `transactions.capture_meta` e `workspace_member_notification_prefs.notify_review` (padrão `true`) |
| `review_reminder_dedupe` | Um lembrete por pessoa, carteira e dia; só a service role lê e grava |
| `notifications_type_check` | Ganha o tipo `'review'` |
| `transactions_needs_review_idx` | Índice parcial dos itens a conferir (a lista, a contagem e o lembrete) |
| Cron `review-reminder-daily` | `0 23 * * *` (23:00 UTC, 20h em Brasília): chama `review-reminder` por `invoke_edge_function` |

**A migração vai antes das funções.** O `_shared/deliver-notification.ts` deste
bloco lê `notify_review` nas preferências. Publicada antes da migração, toda
função que entrega aviso deixa de carregar as preferências.

## 2. Conferir o banco (SQL Editor)

**O RLS da tabela de tokens está ligado.**

```sql
select relname, relrowsecurity from pg_class
where oid in ('public.capture_tokens'::regclass, 'public.review_reminder_dedupe'::regclass);
```

Duas linhas, as duas com `relrowsecurity = true`.

**O hash não é legível pelo app.**

```sql
select has_column_privilege('authenticated', 'public.capture_tokens', 'token_hash', 'select');
```

Esperado: `false`. Se vier `true`, pare. Rode de novo as duas linhas `revoke all`
e `grant select (…)` da seção 1 de `20261023120000_captura.sql` (copie do
arquivo) e confira de novo.

**O plano responde.**

```sql
select public.workspace_plan('<WORKSPACE_ID>');
```

Esperado: `familia`. A `capture` consulta o plano antes de tudo: sem ele, toda
captura volta 402.

**O cron existe.**

```sql
select jobname, schedule, command from cron.job where jobname = 'review-reminder-daily';
```

Uma linha, com `0 23 * * *` e `select public.invoke_edge_function('review-reminder')`.
Se faltar, ligue o `pg_cron` (Database → Extensions) e rode no SQL Editor o
bloco `do $cron$ ... $cron$` do fim de `20261023120000_captura.sql` (copie do
arquivo).

**O aviso aceita o tipo novo.**

```sql
select pg_get_constraintdef(oid) from pg_constraint where conname = 'notifications_type_check';
```

A definição contém `'review'`.

**O índice existe.**

```sql
select indexdef from pg_indexes where indexname = 'transactions_needs_review_idx';
```

Uma linha, com `WHERE needs_review`.

**O `pgcrypto` está em `extensions`.** A `create_capture_token` chama
`extensions.gen_random_bytes` e `extensions.digest`.

```sql
select extname, extnamespace::regnamespace from pg_extension where extname = 'pgcrypto';
```

Esperado: `extensions`.

**As colunas novas existem.**

```sql
select table_name, column_name, column_default from information_schema.columns
where table_schema = 'public'
  and (table_name, column_name) in (
    ('credit_cards', 'wallet_alias'),
    ('transactions', 'capture_meta'),
    ('workspace_member_notification_prefs', 'notify_review')
  );
```

Três linhas; `notify_review` com o padrão `true`.

**Quantos itens o lembrete vai achar.**

```sql
select count(*) from public.transactions where needs_review;
```

Esperado: `0`. Os itens `needs_review` só nascem pela importação e pela captura
do 2.0, e nada disso está no ar. Se vier mais que zero, as pessoas que lançaram
esses itens recebem o lembrete às 20h, mesmo no front de `main`. O aviso leva a
`/transactions?conferir=1`, que no front antigo é a lista comum. Aceite isso ou
espere o front do 2.0 antes de publicar.

## 3. Funções

O `_shared` vai embutido em cada função no deploy: toda função que importa um
módulo mudado precisa ser publicada de novo. Os módulos mudados neste bloco são
`captura.ts`, `deliver-notification.ts`, `frase.ts`, `notification-types.ts`,
`review-reminder.ts` e `service-auth.ts`. A lista abaixo saiu das importações de
cada função, diretas e através do `_shared`. Sem Docker nesta máquina, o deploy
vai pela API:

```bash
supabase functions deploy capture review-reminder evaluate-budgets evaluate-credit-card-alerts notify-transaction-created credit-card-calendar-alerts evaluate-bills-reminders workspace-invites-accept --use-api
```

| Função | Por quê |
|--------|---------|
| `capture` | Nova. Importa `captura.ts` e `frase.ts` |
| `review-reminder` | Nova. Importa `review-reminder.ts`, `deliver-notification.ts` e `notification-types.ts` |
| `evaluate-budgets` | Caminho de serviço (`service-auth.ts`), além de `deliver-notification.ts` e `notification-types.ts` |
| `evaluate-credit-card-alerts` | Caminho de serviço (`service-auth.ts`), além de `deliver-notification.ts` e `notification-types.ts` |
| `notify-transaction-created` | O `isServiceAuthorized` saiu dela para `service-auth.ts`; importa também `deliver-notification.ts` e `notification-types.ts` |
| `credit-card-calendar-alerts` | Importa `deliver-notification.ts` e `notification-types.ts` |
| `evaluate-bills-reminders` | Importa `deliver-notification.ts` e `notification-types.ts` |
| `workspace-invites-accept` | Importa `deliver-notification.ts` e `notification-types.ts` |

As outras nove funções não importam nenhum desses módulos e não precisam de
deploy.

O `verify_jwt = false` de `capture` e de `review-reminder` está em
`supabase/config.toml`. A `capture` recebe o token `fac_…`, não um JWT, e o
confere ela mesma. A `review-reminder` só aceita o `x-cron-secret`.

## 4. Teste de fumaça

**Só com dado de teste** (o banco é o de produção). Use uma carteira de teste em
que você é o único membro: assim o aviso de despesa do trigger não chega a
ninguém, e os alertas de orçamento e cartão só olham essa carteira.

`<URL>` é o endereço da captura: o Project URL (Settings → API) seguido de
`/functions/v1/capture`.

### 4.1. Criar um token de teste

Os tokens nascem pela tela de Minha conta do 2.0, que não está no ar. Até lá,
crie o token no SQL Editor. O SQL abaixo grava só o hash e mostra o texto do
token uma vez, no resultado.

Ache o seu id e confira que você é membro da carteira de teste:

```sql
select id from auth.users where email = '<EMAIL>';
select role from public.workspace_members
where workspace_id = '<WORKSPACE_ID>' and user_id = '<USER_ID>';
```

Crie o token:

```sql
with t as (
  select 'fac_' || encode(extensions.gen_random_bytes(32), 'hex') as token
), ins as (
  insert into public.capture_tokens (user_id, workspace_id, name, token_hash)
  select '<USER_ID>'::uuid, '<WORKSPACE_ID>'::uuid, 'Teste de fumaça 3A',
         encode(extensions.digest(t.token, 'sha256'), 'hex')
  from t
  returning id
)
select ins.id as token_id, t.token from ins, t;
```

O `token_id` é o `<TOKEN_ID>`, e `token` é o `<TOKEN>`.

> **O texto do token nunca é salvo em lugar nenhum**: nem no repositório, nem num
> arquivo, nem no histórico do shell. Para não deixá-lo no histórico, guarde-o
> com `read -rs TOKEN` e escreva `$TOKEN` no lugar do marcador. Feche a aba do
> SQL Editor depois de copiar. Ao fim do teste o token é revogado e apagado.

### 4.2. Capturar

```bash
curl -sS -i -X POST '<URL>' \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"text":"1 teste captura","id":"fumaca-3a-1"}'
```

Esperado: `200` com `{"ok":true,"id":"…","needs_review":…,"resumo":"R$ 1,00 · …"}`.
O `id` é o `<TX_ID>`. Sem histórico na carteira de teste, o `needs_review` deve
vir `true` (nenhuma categoria pelo histórico).

### 4.3. Repetir com o mesmo `id`

Rode o mesmo `curl` de novo. Esperado: `200` com **o mesmo `id`**. Confira que
há uma linha só:

```sql
select count(*) from public.transactions
where workspace_id = '<WORKSPACE_ID>' and description ilike '%teste captura%';
```

Esperado: `1`. Confira também que o uso foi registrado:

```sql
select last_used_at from public.capture_tokens where id = '<TOKEN_ID>';
```

### 4.4. Revogar

```sql
update public.capture_tokens set revoked_at = now() where id = '<TOKEN_ID>';
```

Rode o `curl` de novo. Esperado: `401` com `{"error":"Token inválido."}`.

### 4.5. Limpar

```sql
delete from public.transactions where id = '<TX_ID>';
delete from public.capture_tokens where id = '<TOKEN_ID>';
```

Apague o lançamento **antes** do passo 4.6. Senão, o lembrete o acha e gasta o
dedupe do dia dessa carteira.

### 4.6. O cron alcança o lembrete

Antes, confira que `select count(*) from public.transactions where needs_review;`
ainda dá o que deu no passo 2. Esta chamada manda o lembrete **agora** para quem
tem itens a conferir.

```sql
select public.invoke_edge_function('review-reminder');
```

A resposta do `pg_net` é assíncrona. Espere alguns segundos e só então rode:

```sql
select status_code, content from net._http_response order by created desc limit 1;
```

Esperado: `200` e `{"ok":true,"notified":0,...}`, sem itens a conferir. Um `401`
é o `CRON_SECRET` diferente do `cron_secret` do Vault. Nenhuma linha, depois da
espera, é o Vault incompleto (passo 0).

## Compatibilidade

- **O front de `main` não usa nada disso.** Ele não lê `capture_tokens`,
  `wallet_alias`, `capture_meta` nem `notify_review`. As colunas novas têm
  padrão, e nenhuma coluna existente mudou de tipo nem saiu.
- **Os avaliadores continuam aceitando o JWT da pessoa.** O caminho de serviço
  (Bearer da service role, ou `x-cron-secret` com `workspace_id` no corpo) é um
  segundo caminho. A chamada do front antigo depois de salvar uma despesa segue
  igual.
- **`notifications` aceita o tipo novo.** Um aviso `review` aparece no front
  antigo com o ícone padrão do sino.
- **Nenhum item a conferir nasce no front antigo.** Ele não grava
  `needs_review`. Editar um lançamento pelo 2.0 tira a marca. Pelo front antigo,
  a marca fica.

## Segredos

Nenhum novo.

- A `capture` usa `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`, que o Supabase
  já fornece. Ela grava como a pessoa, repetindo as regras da RLS, e chama os
  avaliadores com o Bearer da service role.
- O cron usa os segredos do Vault que já existem (`edge_functions_url` e
  `cron_secret`). A `review-reminder` confere o `CRON_SECRET` das Edge
  Functions, o mesmo do Bloco 1.

## Ordem com o front

**Migração antes do front.** O front do 2.0 lê `capture_tokens`, `wallet_alias`,
`capture_meta` e `notify_review`: na Minha conta, no detalhe do lançamento, no
fallback do `?txn=` de Lançamentos e em Configurações. Publicado antes do passo
1, essas telas falham. O contrário é seguro, como diz "Compatibilidade".

Com o front no ar, refaça o teste de fumaça pela tela:

1. crie o token em Minha conta;
2. instale o Atalho pelo guia `docs/captura/atalho-iphone.md`;
3. confira o item em "A conferir";
4. revogue o token.
