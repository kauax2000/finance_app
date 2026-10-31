# Publicar o Bloco 5: previsão

Reúne a receita recorrente, o orçamento que se repete e a previsão do mês:

- a migração `20261026120000_previsao.sql`: a coluna
  `workspace_subscriptions.kind` (`expense` | `income`, padrão `expense`) e o
  check `workspace_subscriptions_income_no_card`; a saída do check
  `transactions_subscription_expense_only`; as funções `charge_subscription_cycle`
  e `seed_subscription_first_transaction`, que passam a gravar `type = kind`; a
  coluna `budgets.repeats`; a tabela `orcamentos_copiados`; as funções
  `copiar_orcamentos_do_mes` e `garantir_orcamentos_do_mes`; o cron
  `orcamentos-do-mes`; a coluna `workspaces.monthly_savings_target` (a reserva);
- a Edge `evaluate-budgets`, que passa a contar a compra no cartão pelo mês do
  **fechamento** da fatura;
- a Edge `credit-card-calendar-alerts`, que ganha o aviso de fatura acima do
  normal (`cc_invoice_trending_high`);
- no front do 2.0: o cartão do "seguro para gastar" no Painel, a rota
  `/previsao`, o quadro de impacto da parcela, a receita nas assinaturas e o
  "Repetir todo mês" do orçamento.

**Estado em 31/10/2026: a migração `20261026120000_previsao.sql` está em produção,
aplicada sozinha, antes das `captura`, `ia` e `planos`; o próximo `db push` do
repositório pede `--include-all`. As Edges deste bloco não foram publicadas.** O
front do `finance-app-2.0` também não: ele só vai para `main`, e para produção, quando os blocos planejados
estiverem prontos (decisão do dono).

**O backend do Bloco 5 pode subir antes do front, menos o
`credit-card-calendar-alerts`.** A migração só acrescenta, e nada dela muda o que
o front de `main` faz (a tabela do §6 mostra o porquê). O
`credit-card-calendar-alerts` só sobe junto com o front (§7): o aviso novo leva a
`/previsao`, que não existe em `main`. Os outros pontos de atenção estão no §6: a
assinatura de **receita** só existe para o front novo, e o aviso de orçamento do
front antigo passa a olhar mais de um mês.

Faça na ordem. Todo SQL abaixo cabe como está no SQL Editor: ele não leva id,
chave nem URL, e nada precisa ser trocado. **Nunca** salve no repositório o
resultado de uma conferência (o repositório é público).

## 0. Pré-requisitos

- **Os Blocos 3A, 3B e 4 vão antes, ou junto.** A migração do Bloco 5 é a última
  da fila; se os outros ainda não subiram, o `db push` aplica todas em ordem. Faça
  as conferências dos roteiros anteriores depois dele.
- **A CLI** do Homebrew, 2.121 ou mais nova, com o projeto ligado
  (`supabase link`, uma vez só). Sem Docker nesta máquina, as funções sobem pela
  API (`--use-api`), e o pgTAP (`supabase/tests/database/assinaturas_schema.test.sql`,
  que o bloco atualizou) não roda aqui: as conferências do §1 cobrem o mesmo chão.
- **O `pg_cron`** ligado (Database → Extensions), como nos blocos anteriores. A
  migração só agenda o cron quando a extensão existe.

## 1. Migração

```bash
supabase db push --linked
```

Aplica `20261026120000_previsao.sql` (e, antes dela, as que ainda não subiram).
Depois, rode as conferências **uma por vez**: o SQL Editor mostra só o resultado
do último comando.

**Toda assinatura que já existe é despesa.** Este é o passo mais importante: o
front de `main` só sabe de despesa.

```sql
select kind, count(*) from public.workspace_subscriptions group by kind;
```

Esperado: uma linha só, `expense`, com a contagem de assinaturas da conta. Se
aparecer `income`, alguém já criou uma receita recorrente pelo front novo (o
banco de desenvolvimento é o de produção): veja o §6 antes de seguir.

**Os checks.**

```sql
select conname from pg_constraint
where conname in (
  'workspace_subscriptions_kind_check',
  'workspace_subscriptions_income_no_card',
  'transactions_subscription_expense_only'
)
order by 1;
```

Duas linhas: `workspace_subscriptions_income_no_card` e
`workspace_subscriptions_kind_check`. O `transactions_subscription_expense_only`
**não** pode aparecer.

**As duas funções gravam o tipo da assinatura.**

```sql
select
  pg_get_functiondef('public.charge_subscription_cycle(uuid)'::regprocedure) like '%r.kind%' as cobranca_usa_kind,
  pg_get_functiondef('public.seed_subscription_first_transaction()'::regprocedure) like '%new.kind%' as primeira_usa_kind;
```

Esperado: `true` e `true`.

**Só o mês corrente repete.** O orçamento do histórico nasce com `repeats = false`.

```sql
select
  period_start = date_trunc('month', public.app_today())::date as mes_corrente,
  repeats,
  count(*)
from public.budgets
group by 1, 2
order by 1, 2;
```

Esperado, logo depois da migração: nenhuma linha com `repeats = true` fora do
mês corrente (`mes_corrente = false`), e no mês corrente só `true`, com a
contagem de orçamentos do mês. Depois dela, o orçamento que a pessoa criar para
outro mês nasce `true` (o padrão novo), e o que alguém desligar em "Repetir todo
mês" fica `false`: a conferência só vale no primeiro minuto.

**O padrão de `repeats` passou a ser `true`**, para o front de `main` (que não
manda a coluna) herdar a repetição:

```sql
select column_default from information_schema.columns
where table_schema = 'public' and table_name = 'budgets' and column_name = 'repeats';
```

Uma linha, com `true`.

**A tabela do marcador existe, está vazia e só a service role a alcança.**

```sql
select r.papel,
       has_table_privilege(r.papel, 'public.orcamentos_copiados', 'select,insert,update,delete') as alcanca
from unnest(array['anon', 'authenticated']) as r(papel);
```

Duas linhas, ambas com `alcanca = false`. Se alguma vier `true`, pare e rode de
novo o `revoke all on public.orcamentos_copiados from anon, authenticated;` da
migração.

```sql
select count(*) from public.orcamentos_copiados;
```

Esperado: `0`. Ela só enche quando o cron do dia 1 ou o Painel do 2.0 pedirem a
cópia de um mês.

**As funções da cópia têm o alcance certo.**

```sql
select
  has_function_privilege('authenticated', 'public.copiar_orcamentos_do_mes(date, uuid)', 'execute') as copiar_authenticated,
  has_function_privilege('service_role', 'public.copiar_orcamentos_do_mes(date, uuid)', 'execute') as copiar_service_role,
  has_function_privilege('authenticated', 'public.garantir_orcamentos_do_mes(uuid)', 'execute') as garantir_authenticated,
  has_function_privilege('anon', 'public.garantir_orcamentos_do_mes(uuid)', 'execute') as garantir_anon;
```

Esperado: `false`, `true`, `true`, `false`. Se `copiar_authenticated` vier `true`,
**pare**: qualquer pessoa logada copiaria o orçamento de qualquer carteira.
Rode de novo o `revoke` e o `grant` da função na migração. A
`garantir_orcamentos_do_mes` confere sozinha que a pessoa é membro da carteira.

**O cron existe.**

```sql
select jobname, schedule, command from cron.job where jobname = 'orcamentos-do-mes';
```

Uma linha, com `5 3 1 * *` (dia 1, 03:05 UTC, 00:05 em Brasília) e
`select public.copiar_orcamentos_do_mes(date_trunc('month', public.app_today())::date)`.
Se faltar, ligue o `pg_cron` e rode no SQL Editor o bloco `do $cron$ ... $cron$` do
fim da seção 2 de `20261026120000_previsao.sql` (copie do arquivo).

**A reserva existe, e só o dono a altera.**

```sql
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'workspaces' and column_name = 'monthly_savings_target';
```

Uma linha.

```sql
select policyname, cmd from pg_policies
where schemaname = 'public' and tablename = 'workspaces' and cmd = 'UPDATE';
```

Uma linha, `Owners can update workspace`. É ela que faz o campo da reserva ser só do
dono; a tela mostra "Só quem é dono da carteira altera a reserva" para o membro.

## 2. Funções

O `_shared` vai embutido em cada função no deploy: toda função que importa um
módulo mudado precisa ser publicada de novo. Os módulos mudados neste bloco são
`credit-card-cycle.ts` (ganhou `statementCloseYmdForPurchaseYmd`),
`notification-copy.ts` (ganhou `trendingHighCopy`) e os dois novos,
`orcamento-mes.ts` e `fatura-tendencia.ts`. O `deliver-notification.ts` **não**
mudou.

**Como a lista foi feita:** para cada `supabase/functions/*/index.ts`, foram
seguidos os `import` relativos, diretos e através do `_shared` (por exemplo,
`captura.ts` e `formatters.ts` importam o `notification-copy.ts`), até o fim, e
ficou na lista toda função que alcança um desses quatro módulos. São oito: sete
sobem aqui, e o `credit-card-calendar-alerts` sobe só com o front (§7).

```bash
supabase functions deploy capture evaluate-bills-reminders evaluate-budgets evaluate-credit-card-alerts ia-ler notify-transaction-created review-reminder --use-api
```

**Mudam de comportamento:**

| Função | Por quê |
|--------|---------|
| `evaluate-budgets` | Importa `credit-card-cycle.ts`, `notification-copy.ts` e `orcamento-mes.ts`: a compra no cartão conta pelo mês do fechamento |
| `capture` | Importa `credit-card-cycle.ts` e `notification-copy.ts`, e agora manda `payment_method` e `payment_credit_card_id` ao `evaluate-budgets` (compatível: o `evaluate-budgets` novo lê o par, e sem ele cai em "todo cartão") |

**Mesmo comportamento** (só um acréscimo no módulo, uma função nova que elas
não chamam): publicá-las não muda o que fazem, mas deixa o código no ar igual ao
do repositório.

| Função | Por quê |
|--------|---------|
| `evaluate-bills-reminders` | Importa `credit-card-cycle.ts` e `notification-copy.ts` |
| `evaluate-credit-card-alerts` | Importa `credit-card-cycle.ts` e `notification-copy.ts` |
| `ia-ler` | Importa `credit-card-cycle.ts` e `notification-copy.ts` |
| `notify-transaction-created` | Importa `notification-copy.ts` (pelo `formatters.ts`) |
| `review-reminder` | Importa `credit-card-cycle.ts` |

**Fica para o §7:** `credit-card-calendar-alerts`. Ele importa três dos módulos
mudados (`credit-card-cycle.ts`, `notification-copy.ts` e `fatura-tendencia.ts`)
e ganha o aviso com o link `/previsao`. Até lá, a versão no ar continua com o
`_shared` que foi embutido no último deploy dela, e os eventos que ela já manda
(fechou, vence em breve, vence hoje) não precisam do código novo:
`credit-card-cycle.ts` e `notification-copy.ts` só ganharam funções novas, sem
mudar nenhuma das que existiam.

Não precisam de deploy: `run-recurring-billing` (ele só chama a RPC
`charge_subscription_cycle`, que a migração já trocou), `billing-daily` e as
demais, que não alcançam nenhum dos quatro módulos.

## 3. Conferência pós-deploy

Só leitura. A primeira espera um dia: a cobrança de assinaturas roda uma vez por
dia, e a primeira depois da migração é que prova o que as funções do §1 gravam.

**A primeira cobrança de assinatura saiu `expense`.** No dia seguinte à migração:

```sql
select t.type, s.kind, count(*)
from public.transactions t
join public.workspace_subscriptions s on s.id = t.subscription_id
where t.created_at > now() - interval '2 days'
group by t.type, s.kind;
```

Esperado: só `expense` | `expense`. Qualquer linha com `type` diferente de `kind`
é bug: pare e avise.

**Nenhum lançamento de despesa saiu com tipo trocado em geral.**

```sql
select count(*) from public.transactions t
join public.workspace_subscriptions s on s.id = t.subscription_id
where t.type is distinct from s.kind;
```

Esperado: `0`.

**O aviso de orçamento.** Lance uma despesa de teste numa categoria com orçamento
e confira, nos logs de `evaluate-budgets` (Dashboard → Edge Functions →
`evaluate-budgets` → Logs), que a chamada responde 200. Quem manda
`payment_method` e `payment_credit_card_id` é o front do 2.0 e a `capture`; o
front de `main` não manda, e a Edge cai em "todo cartão" (§6).

**Nenhuma receita recorrente antes do front.** Repita esta conferência toda
semana, e antes de publicar o front, até o 2.0 ir para `main`:

```sql
select kind, count(*) from public.workspace_subscriptions group by kind;
```

Esperado: só `expense`. Uma linha `income` encontrada em produção antes do front
precisa ser **apagada**, não desativada: o front de `main` não lê `kind` e a
mostra como saída (na lista, no calendário de pagamentos e nos compromissos da
categoria), enquanto o cron grava o lançamento como receita. O `is_active = false`
não resolve, porque a assinatura inativa continua listada. O §6 explica.

## 4. O orçamento que se repete

- **A cópia é uma vez por carteira e mês.** O marcador `orcamentos_copiados` entra
  junto com ela: quem já tem o marcador não é copiado de novo, e é isso que impede
  um orçamento apagado no mês de voltar na próxima abertura do Painel.
- **Só a linha do mês anterior com `repeats` é copiada**, e a categoria que já tem
  orçamento no mês não ganha outro (a chave única cuida). Os avisos de 80%, 100% e
  estouro nascem nulos: o mês novo avisa de novo.
- **O dia 1 depende do cron.** Se ele falhar, o Painel e Categorias do 2.0 chamam
  `garantir_orcamentos_do_mes` ao abrir e fecham o buraco. No front de `main`, que
  não chama a RPC, um mês sem cópia fica sem orçamento até o cron do próximo dia 1.
  Para copiar na mão, com o SQL Editor:

  ```sql
  select public.copiar_orcamentos_do_mes(date_trunc('month', public.app_today())::date);
  ```

  Devolve quantas linhas criou; rodar duas vezes não duplica.

## 5. O que não fazer neste bloco

**Não apague a `orcamentos_copiados` nem um mês dela.** Sem o marcador, a próxima
abertura do Painel copia de novo o mês anterior, e o orçamento que a pessoa
apagou volta.

**Não ligue `repeats` em massa no histórico.** Só o mês corrente nasce `true`. Um
`update budgets set repeats = true` sem filtro faria o cron do dia 1 copiar o mês
inteiro de volta de todas as carteiras, inclusive o que a pessoa parou de usar.

## 6. Compatibilidade com o front de `main`

| O que muda no banco | Por que `main` não sente |
|---|---|
| `workspace_subscriptions.kind`, padrão `expense` | Coluna nova; o `insert` de `main` não a manda, e toda assinatura criada por ele é despesa |
| Check `workspace_subscriptions_income_no_card` | Só barra receita no cartão; `main` só cria despesa |
| `transactions_subscription_expense_only` sai | Era a trava de "só despesa"; as funções do cron gravam `type = kind`, que para `main` é sempre `expense` |
| `charge_subscription_cycle` e `seed_subscription_first_transaction` | Mesma assinatura e o mesmo resultado para `kind = 'expense'` |
| `budgets.repeats` | Coluna nova; o `upsert` de `main` (`onConflict "workspace_id,category_id,period_start"`) não a manda: a linha nova herda `true` e a existente mantém o valor |
| `orcamentos_copiados`, `copiar_orcamentos_do_mes`, `garantir_orcamentos_do_mes` | Só o cron e o front novo as chamam |
| `workspaces.monthly_savings_target` | Coluna nova e opcional; a política de `update` é a que já existia |
| `evaluate-budgets` | O corpo novo (`payment_method`, `payment_credit_card_id`) é opcional: sem ele, a Edge avalia o dia e o fechamento da compra em cada cartão da carteira |
| `credit-card-calendar-alerts` | **Não sobe antes do front.** O aviso novo de fatura alta leva a `/previsao`, que só existe no front do 2.0; o `main` abre o `metadata.href` da notificação, então no sino, no push e no e-mail o link daria 404. Ela sobe no §7. Os eventos que existiam ficam como estavam, e o novo usa a preferência `notify_credit_cards` |

**Os dois pontos de atenção:**

- **Receita recorrente.** Uma assinatura `income` criada pelo front novo aparece no
  front de `main` como despesa (ele não lê `kind`): na lista, no calendário de
  pagamentos e nas projeções. O lançamento que o cron grava é receita de verdade,
  então o extrato fica certo, mas o resto vira confusão. Enquanto o front novo não
  for para `main`, **não cadastre receita recorrente em produção** além do que for
  teste, e apague o teste (apagar, não desativar: a inativa continua listada). A
  conferência do §1, repetida no §3, mostra se alguma existe.
- **O aviso de orçamento do front antigo.** Sem o pagamento no corpo, a Edge
  avalia, além do dia da compra, o fechamento dela em cada cartão da carteira:
  uma despesa no Pix perto do fim do mês pode avaliar o orçamento do mês seguinte.
  O efeito é um aviso a mais, não a menos, e some quando o 2.0 vai para `main`.

## 7. Com o front

Junto com o front do 2.0 indo para `main`, publique o alerta de fatura alta:

```bash
supabase functions deploy credit-card-calendar-alerts --use-api
```

**O que muda no `credit-card-calendar-alerts`:** todo dia, para cada cartão ativo,
a fatura em aberto mais as parcelas que ainda vão cair nela é comparada à média
das 3 últimas fechadas com valor positivo (o total do banco, quando gravado). Acima
de 120% da média, e só com 3 fechadas, sai um aviso do tipo `credit_card`, uma vez
por ciclo (`cal:trending_high:{fechamento}:c:{cartão}`), com o link `/previsao`.
Quem desligou `notify_credit_cards` não recebe. Os outros eventos do calendário
(fechou, vence em breve, vence hoje) seguem como estavam.

**Nenhum segredo novo.** O aviso de fatura alta usa o mesmo `x-cron-secret` e a
mesma preferência `notify_credit_cards` que já existem; o cron
`credit-card-calendar-alerts-daily` (12:00 UTC) é o de sempre.

**O aviso de fatura alta** só dispara com 3 faturas fechadas e a aberta acima de
120% da média. Para conferir sem esperar, olhe os logs de
`credit-card-calendar-alerts` no dia seguinte: o corpo da resposta traz a lista
`errors`, e uma falha da consulta de um cartão aparece como `trending_high: ...`
sem derrubar os outros avisos.

Quando o front do 2.0 subir, confira também:

- o Painel mostra o cartão "Seguro para gastar" **só no mês corrente** (em outro
  mês, uma linha diz que a previsão é do mês corrente) e leva a `/previsao`;
- `/previsao` mostra o detalhe do mês, a linha do tempo de 6 meses e o campo da
  reserva (só o dono salva);
- o formulário de assinatura aceita "Receita": a lista a marca, a categoria é de
  receita e o lançamento do dia sai `income`;
- o formulário de compra parcelada mostra o quadro "Impacto da parcela" (no
  Pix, sem faturas nem limite; o cartão sem limite cadastrado diz "Sem limite
  cadastrado");
- o orçamento da categoria tem "Repetir todo mês", ligado por padrão, e o Painel
  e Categorias, ao abrir, copiam o mês anterior uma vez só;
- no mês de uma fatura que passou de 120% da média, o sino traz "Fatura do
  cartão acima do normal" e o link leva a `/previsao`.
