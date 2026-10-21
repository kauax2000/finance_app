# Publicar o Bloco 2: fatura que bate e anexos

Reúne o estorno no cartão, o total da fatura segundo o banco, a conferência da
fatura pelo PDF, CSV ou OFX, a importação de extrato e de planilha e os anexos
(nota, recibo, boleto e o PDF da fatura). As telas novas entram como
**wireframe** (`src/components/wireframe/`). Está no repositório, testado, e
**não foi publicado**. Faça na ordem. Todo SQL abaixo leva marcadores: troque-os
no SQL Editor e **nunca** salve o SQL preenchido no repositório (ele é público).

## 0. Pré-requisito: o Bloco 1 publicado

O cron semanal dos anexos chama a Edge pela `public.invoke_edge_function`, que
nasce no Bloco 1 e lê do Vault os segredos `edge_functions_url` e `cron_secret`.
Sem eles a função não faz nada e a limpeza nunca roda. Antes deste roteiro,
faça os passos **2 (Vault)** e **3 (Migração)** de "Publicar o Bloco 1" em
[`NOTIFICATION_DEPLOYMENT.md`](NOTIFICATION_DEPLOYMENT.md). O `db push` abaixo
aplica também a migração do Bloco 1, se ela ainda faltar.

**Antes do passo 4 (front) deste roteiro, faça também os passos 4 (Funções) e
5 (Remover o Database Webhook) do Bloco 1.** O Webhook antigo chama
`notify-transaction-created` em todo INSERT de `transactions`, sem o `WHEN` do
trigger: vivo, ele avisaria os outros membros de **cada lançamento importado**
(500 linhas, 500 avisos). Desde esta mudança a própria
`notify-transaction-created` ignora o importado (e a receita, a assinatura e a
parcela, como o `WHEN`), mas só a versão publicada no passo 3 abaixo. Confira:
Dashboard → Database → Webhooks não tem nenhuma entrada para `transactions`.

Confira que o Vault tem os dois nomes (só os nomes, nunca o valor):

```sql
select name from vault.secrets where name in ('edge_functions_url', 'cron_secret');
```

Duas linhas.

## 1. Migrações

```bash
supabase db push
```

Aplica três migrações, nesta ordem:

| Migração | O que faz |
|----------|-----------|
| `20261022120000_fatura_que_bate.sql` | Colunas `source`, `needs_review` e `import_batch_id` em `transactions`; a tabela `credit_card_statement_totals` (o total que o banco cobrou, por cartão e fechamento); o trigger `transactions_notify_created` passa a pular o que veio de importação (`import_batch_id is null` no `WHEN`) |
| `20261022121000_bills_bundle_estornos.sql` | A `rpc_fetch_bills_page_bundle` passa a trazer também as receitas no cartão (os estornos), para a fatura projetada em Contas a pagar já sair abatida |
| `20261022130000_anexos.sql` | O bucket privado `attachments` (10 MB por arquivo, WebP, JPEG, PNG e PDF), a tabela `attachments`, a cota de 25 MB por carteira (trigger `attachments_enforce_quota`), as políticas de `storage.objects` e o cron `attachments-cleanup-weekly` (domingo, `0 7 * * 0`: 07:00 UTC) |

## 2. Conferir o banco (SQL Editor)

**O bucket é privado.**

```sql
select id, public from storage.buckets where id = 'attachments';
```

Uma linha, com `public = false`. Se vier `true`, pare: os anexos estariam
abertos a quem tiver o caminho. Rode `update storage.buckets set public = false where id = 'attachments';`
e confira de novo.

**O cron existe.**

```sql
select jobname, schedule from cron.job;
```

Mostra `attachments-cleanup-weekly` com `0 7 * * 0`, ao lado dos dois do Bloco 1.
A migração só agenda se o `pg_cron` estiver ligado: se o job faltar, ligue o
`pg_cron` (Database → Extensions) e rode no SQL Editor o bloco `do $cron$ ... $cron$`
do fim de `20261022130000_anexos.sql` (copie do arquivo).

**As políticas de storage existem.**

```sql
select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects';
```

A lista tem as três dos anexos:

- `Workspace members can view attachments`
- `Workspace members can upload attachments`
- `Workspace members can delete attachments`

Se faltarem, o `db push` caiu no `insufficient_privilege` e deixou só o aviso
`anexos: sem privilégio para as políticas de storage.objects` (o papel da
migração não é dono de `storage.objects`). Rode no SQL Editor o bloco `do $$ ... $$`
da seção "5. storage.objects" de `20261022130000_anexos.sql` (copie do arquivo)
e confira de novo. Sem elas, nenhum anexo sobe nem abre.

**A cota consegue ler o bucket.** O `attachments_enforce_quota` é
`security definer`: lê `storage.objects` com o papel do dono da função, para
contar o tamanho real do arquivo. No Supabase hospedado o dono é `postgres`.

```sql
select pg_get_userbyid(p.proowner) as dono,
       has_table_privilege(pg_get_userbyid(p.proowner), 'storage.objects', 'select') as le_objetos
from pg_proc p
where p.oid = 'public.attachments_enforce_quota()'::regprocedure;
```

Esperado: `dono = postgres` e `le_objetos = true`. Se vier `false`, todo anexo
falha ao gravar a linha (o app apaga o objeto enviado e mostra o erro): não
publique o front até resolver. Se o dono for outro papel, rode
`alter function public.attachments_enforce_quota() owner to postgres;` e
confira de novo.

**A importação não avisa os membros.**

```sql
select pg_get_triggerdef(oid) from pg_trigger where tgname = 'transactions_notify_created';
```

A definição contém `import_batch_id IS NULL` no `WHEN`.

## 3. Funções

O `_shared` vai embutido em cada função no deploy: toda função que importa um
módulo mudado precisa ser publicada de novo. Os módulos mudados são
`_shared/credit-card-cycle.ts` (o estorno abate a fatura; `escolherTotal` põe o total do banco na fatura fechada) e
`_shared/transaction-notify-rules.ts` (o aviso de despesa ignora o que o
`WHEN` do trigger ignora), e a `attachments-cleanup` é nova.

```bash
supabase functions deploy evaluate-credit-card-alerts credit-card-calendar-alerts evaluate-bills-reminders notify-transaction-created attachments-cleanup
```

| Função | Mudança |
|--------|---------|
| `evaluate-credit-card-alerts` | O limite usado desconta os estornos do cartão, e a última fatura fechada não paga vale o total do banco quando gravado |
| `credit-card-calendar-alerts` | O valor da fatura nos avisos de fechamento e vencimento desconta os estornos; na fatura fechada (fechou, vence), vale o total do banco quando gravado, lido de `credit_card_statement_totals` numa consulta só por execução |
| `evaluate-bills-reminders` | Importa o `credit-card-cycle.ts` mudado; publicada para não ficar com a cópia antiga |
| `notify-transaction-created` | Responde 200 com `skipped` (`imported`, `not_expense`, `subscription` ou `installment`) para a linha que o `WHEN` do trigger pula: o importado não avisa nem por um Webhook antigo que tenha ficado |
| `attachments-cleanup` | Nova. Chamada pelo cron semanal com o `x-cron-secret`; apaga do bucket o objeto sem linha em `attachments` e com mais de 24 h |

A `attachments-cleanup` usa os secrets `CRON_SECRET` (o mesmo do Bloco 1),
`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (os dois últimos o Supabase já
fornece). O `verify_jwt = false` dela está em `supabase/config.toml`: a
chamada vem do banco, sem JWT, e quem autentica é o `x-cron-secret`.

Confira que o cron alcança a função (não apaga nada recente: a folga é de 24 h):

```sql
select public.invoke_edge_function('attachments-cleanup');
```

A resposta do `pg_net` é assíncrona: espere alguns segundos e só então rode
`select status_code, content from net._http_response order by created desc limit 1;`.
Ela mostra 200 e `{"ok":true,...}`. Um 401 é `CRON_SECRET` diferente do
`cron_secret` do Vault; nenhuma linha, depois da espera, é o Vault incompleto
(passo 0).

## 4. Front

Publique o front **depois** do passo 1. Ver "Ordem com o front", abaixo.

## 5. Teste de fumaça

**Só com dado de teste e só depois de publicar** (o banco é o de produção).
Use uma carteira e um cartão de teste.

1. **Total do banco.** No cartão de teste, no wireframe "Conferir fatura",
   escolha o último ciclo fechado (ainda não pago), digite um total diferente
   do calculado e grave. O painel dessa fatura mostra "Total do banco ·
   diferença", e a fatura em Contas a pagar (pendentes) passa a valer o total
   do banco, e os avisos "fechou" e "vence" dessa fatura também. A UI só grava esse total, não o apaga: no fim do teste, ache a
   linha e apague-a no SQL Editor.

   ```sql
   select id, statement_close_date, bank_total from public.credit_card_statement_totals
   where credit_card_id = '<CARD_ID>';
   delete from public.credit_card_statement_totals where id = '<ID>';
   ```
2. **Importação.** Em Lançamentos, "Importar extrato ou planilha" (abre com
   `?importar=1`, que some da URL). Importe um CSV pequeno, **com valores
   inventados**, numa conta de teste. Os lançamentos aparecem com
   "Importado · a conferir" no detalhe, e nenhum aviso de despesa chega aos
   outros membros. "Desfazer importação" apaga o lote inteiro.
3. **Anexo.** No detalhe de uma transação de teste, anexe uma foto. "Abrir"
   abre a URL assinada (vale 1 h) numa aba nova; com o popup bloqueado, aparece
   o link "Abrir anexo", e o app não sai da tela. Num boleto de conta, pague a
   parcela: o painel da conta (`?detail=`) continua mostrando o boleto em
   "Anexos da última parcela paga", só com Abrir.
4. **Anexo some com a transação.** Antes de excluir, guarde o caminho:

   ```sql
   select path from public.attachments where transaction_id = '<TX_ID>';
   ```

   Exclua a transação de teste pelo app. Depois:

   ```sql
   select name from storage.objects where bucket_id = 'attachments' and name = '<PATH>';
   ```

   Nenhuma linha: o objeto saiu do bucket junto com a transação. A exclusão
   avulsa remove o objeto na hora; a exclusão em lote, a de compra parcelada
   (que apaga o plano em cascata) e a feita offline deixam o objeto para o
   cron semanal `attachments-cleanup-weekly`.

## Ordem com o front

**Migrações antes do front.** O front novo lê a tabela
`credit_card_statement_totals` e as colunas `transactions.source`,
`needs_review` e `import_batch_id`: na consulta do período do Painel, no
fallback do `?txn=` de Lançamentos, na página do cartão e no detalhe do
lançamento. Publicado antes do passo 1, **o Painel não carrega** (a consulta
pede colunas que não existem). O contrário é seguro: o front antigo ignora as
colunas novas, que têm valor padrão.

## Cota

25 MB por carteira (`26214400` bytes) e 10 MB por arquivo enquanto o Supabase
for Free. Mudar a cota é uma migração nova que troca o número em
`attachments_enforce_quota`; o limite por arquivo mora no bucket e na
constraint de `attachments.size_bytes`.
