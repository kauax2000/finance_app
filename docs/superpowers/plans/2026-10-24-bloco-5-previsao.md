# Bloco 5 — Previsão: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa a tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** responder "quanto ainda posso gastar" e "o que esta parcela faz com os próximos meses". O bloco entrega:
- a receita recorrente, para o salário entrar pelo cron;
- o "seguro para gastar" do mês;
- a linha do tempo de 6 meses;
- o quadro de impacto da parcela antes de salvar;
- o orçamento que se repete;
- o mês da compra no crédito também no aviso de orçamento;
- o alerta de fatura alta.

**Arquitetura:**
- **Uma função calcula e todos leem dela.**
  - A conta vive em `src/lib/previsao/` como funções puras: `faturaPrevista`, `fluxoDoMes`, `seguroParaGastar`, `projecaoMensal` e `impactoDaParcela`.
  - Elas são compostas dos helpers que já existem: `buildCardMonthlyInvoiceSnapshot`, `expandSubscriptionChargesInYmdRange`, `expandRemainingInstallmentCharges`, `totalComBanco` e `computeNextDueYmd`.
- **Banco:**
  - `workspace_subscriptions.kind`, e as duas funções de cobrança gravam `type = kind`;
  - `budgets.repeats`, com a cópia idempotente do dia 1;
  - `workspaces.monthly_savings_target`.
- **No servidor**, o aviso de orçamento e o alerta de fatura alta usam helpers puros em `supabase/functions/_shared/`. A paridade com o cliente é travada por vetores dourados num JSON, que os testes dos dois lados leem. É o mesmo padrão de `billing-calendar-vectors.json`.
- **Telas:** entram como wireframes (`AGENTS.md`).

**Tecnologia:** Next 16 / React 19, Supabase (Postgres, Edge em Deno, pg_cron), Vitest e Deno test. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-20-proposta-funcional-design.md`, §10 inteira e o anti-objetivo "Número que não bate" (§2).

## Restrições globais

- **O banco de dev é o de produção.** Nenhuma tarefa roda `supabase db push`, deploy ou SQL contra o projeto. Quem publica é o orquestrador, e só com o pedido explícito do dono.
- **O front de `main` continua em produção até o fim do 2.0.** Por isso:
  - as migrações só acrescentam;
  - toda assinatura criada pelo front antigo continua sendo despesa (`kind` com padrão `'expense'`);
  - as funções dos crons mantêm a assinatura e o comportamento para `kind = 'expense'`;
  - `budgets` aceita o upsert de hoje (`onConflict "workspace_id,category_id,period_start"`) sem mandar `repeats`.
- **O repositório é público.** Nenhuma chave, URL de projeto ou dado real entra nele.
- **Regime e rótulos** (spec §10, sem mudar uma vírgula):
  - "seguro para gastar" é **caixa**: o dinheiro que sai no mês, com a fatura contada no mês do **vencimento**;
  - o orçamento é **competência**: a compra no crédito conta no mês do **fechamento**.

  Cada tela diz qual regime mostra.
- **Mês:** o do calendário, sem `cycle_start_day`. Não há saldo de partida.
- **Data do app:** `America/Sao_Paulo`. No servidor, `app_today()` e `appTodayYmd()`; no cliente, o dia local (`localYmdFromDate`).
- **Testes:**
  - Vitest roda em ambiente `node`, só `src/**/*.test.ts`. Teste que importa `@/lib/supabase` faz `vi.mock("@/lib/supabase", …)`.
  - O Deno roda `supabase/functions/_shared/*.test.ts` (`npm run test:edge`, com `--allow-read`).
  - Os testes de fonte usam `lerFonte` e `semComentarios` de `@/test/fonte`.
- **Wireframe** (`AGENTS.md`):
  - só em `src/components/wireframe/`;
  - etiqueta `WIREFRAME · Bloco 5 · <funcionalidade>`, com o `WireframeBox`;
  - controles nativos, e todo `<button>` declara `type`;
  - nada de `@/components/ui`;
  - funciona de verdade.

  Toda rota nova tem `loading.tsx` e `AdiarMontagem`, e entra em `APP_PAGE_TITLES` e `ROUTES`.
- **Mudança de jornada:** a Tarefa 9 atualiza `docs/JORNADAS.md` e `docs/atlas/template.html` e roda `python3 docs/atlas/build.py`. O orquestrador republica o Atlas.
- **Fechamento de cada tarefa:** `npx tsc --noEmit && npm run lint && npm run test:unit`.
  - Também `npm run test:edge` quando mexe em `supabase/functions`.
  - Também `npm run ds:audit -- src/components/wireframe` quando mexe em wireframe.
  - Também `npm run build` quando mexe em tela.
  - Se o `tsc` acusar cópias `.next/**/* N.ts`, apague-as com `find .next -name "* [0-9]*.ts" -delete` e rode de novo.

## Decisões desta rodada (o orquestrador registra no ledger)

1. **Receita recorrente.** `workspace_subscriptions.kind` aceita `'expense' | 'income'`, com padrão `'expense'`.
   - O check `transactions_subscription_expense_only` sai e um check novo entra na assinatura: uma receita não usa cartão (`kind = 'expense' or payment_method is distinct from 'credit_card'`). O motivo é que receita no cartão é estorno.
   - `charge_subscription_cycle` e `seed_subscription_first_transaction` gravam `type = r.kind`.
   - Os consumidores de projeção de assinatura no cliente passam a separar as duas: a despesa continua onde está, e a receita só entra na previsão.
2. **A fatura prevista é a fatura com as assinaturas do cartão projetadas.**
   - O `buildCardMonthlyInvoiceSnapshot` não as soma, e a previsão precisa delas: um streaming no cartão sai no vencimento como qualquer compra.
   - O número mora em `faturaPrevista`, com o rótulo "prevista". O "em aberto" de hoje no Painel e no cartão não muda neste bloco. São números com nomes diferentes, o que não é o anti-objetivo da spec.
   - A revisão de tela decide se o "em aberto" passa a ser o previsto.
3. **Contas a pagar no caixa do mês:**
   - toda `bill_instances` `pending` com `due_date` até o fim do mês entra pelo `amount_estimated` da conta, inclusive a vencida de mês anterior, porque o dinheiro ainda vai sair;
   - as ocorrências seguintes da mesma conta dentro do mês ou da linha do tempo são projetadas por `computeNextDueYmd`;
   - uma conta sem `amount_estimated` entra com 0 e é listada como "sem valor".
4. **Fatura paga continua no caixa do mês do vencimento** (o dinheiro saiu nele) e é marcada `paga`. Ela não some da conta.
5. **A reserva** é `workspaces.monthly_savings_target`, editada no wireframe do seguro. A escrita segue a política de `update` de `workspaces` que já existe; se ela só deixar o dono, o campo fica só leitura para o membro.
6. **Onde mora:**
   - o Painel ganha o cartão compacto do seguro;
   - a rota nova `/previsao` tem o detalhe do seguro e a linha do tempo de 6 meses;
   - o quadro de impacto da parcela aparece no formulário (modo Parcelada), na frase rápida quando ela traz parcelas e no detalhe de um lançamento parcelado.
7. **A cópia do orçamento** é uma função SQL idempotente, `copiar_orcamentos_do_mes(p_period_start date, p_workspace_id uuid default null)`. Ela roda:
   - por um cron no dia 1 às 03:05 UTC (00:05 de Brasília);
   - pelo RPC `garantir_orcamentos_do_mes(p_workspace_id uuid)`, que o Painel e a tela de Categorias chamam ao abrir.

   Ela só copia a linha do mês anterior com `repeats`, e o mês que já tem a categoria não ganha outra (o `on conflict do nothing` da chave única cuida disso).
8. **O aviso de orçamento conta pelo mês do fechamento.**
   - A soma da categoria no mês passa a ser a de `gastoDaCategoriaNoMes` (`_shared/orcamento-mes.ts`): a despesa fora do cartão pelo dia; a do cartão pelo mês do fechamento da compra; e o estorno no cartão abatendo da categoria.
   - É a mesma regra do `postedTotal` de `buildCategoryCommitmentsForMonth`, travada pelos vetores dourados.
9. **O alerta de fatura alta (`cc_invoice_trending_high`)** mora no cron `credit-card-calendar-alerts`, com `type 'credit_card'` e a preferência `notify_credit_cards`. Ele usa o dedupe `cal:trending_high:{closeYmd}:c:{cardId}`, uma vez por ciclo.
   - **Desvio consciente da spec:** a mensagem não traz "quanto sobra no mês do vencimento". Para trazer, a conta do seguro teria de ser reescrita em Deno, uma segunda implementação, que é o anti-objetivo "número que não bate". O aviso diz o valor previsto e quanto ele está acima do normal, e leva a `/previsao`, onde o seguro do mês do vencimento está.

## Foco de revisão

1. **Assinatura de receita lançada como despesa (ou o contrário).**
   - O salário cadastrado como receita entra no extrato como `income` e soma no seguro.
   - Ele nunca aparece nos compromissos da categoria de despesa, nos eventos de pagamento como saída, nem na fatura de um cartão.
   - (Tarefa 1, teste de fonte das duas funções. Tarefa 2, testes de `payment-events` e `category-commitments` com uma assinatura `income`. Tarefa 3, caso "com renda recorrente".)
2. **A fatura que vence no último dia do mês e o mês de 28, 30 e 31 dias.**
   - O fechamento no dia 31 vira o último dia do mês.
   - A fatura cujo vencimento cai no mês seguinte não entra no caixa deste.
   - `diasRestantes` conta o dia de hoje.
   - (Tarefa 3, a tabela de casos da spec.)
3. **Estorno e total do banco.**
   - O estorno no cartão abate da fatura prevista e da categoria.
   - A fatura fechada com o total do banco usa o total do banco.
   - A fatura em aberto nunca usa o total do banco.
   - (Tarefa 3. Tarefa 7, vetores dourados.)
4. **Orçamento copiado duas vezes ou ressuscitado.**
   - O cron e a abertura do Painel no mesmo dia geram uma linha só.
   - O orçamento com `repeats = false` não volta no mês seguinte.
   - A categoria apagada não é copiada (a FK em cascata já a removeu).
   - (Tarefa 1, teste de fonte com `on conflict do nothing` e o filtro `repeats`.)
5. **Parcela sem cartão ou sem limite.**
   - O quadro de impacto de uma compra parcelada no Pix não mostra faturas nem limite, só parcela, pico, renda e seguro.
   - O cartão sem `credit_limit` diz "sem limite cadastrado" em vez de "não cabe".
   - (Tarefa 5.)

---

### Tarefa 1: Migração — receita recorrente, orçamento que se repete e reserva

**Arquivos:**
- Criar: `supabase/migrations/20261026120000_previsao.sql`
- Modificar: `src/types/database.ts`, `src/types/database-drift.ts`, `src/lib/supabase.ts` (`WorkspaceSubscription.kind`, `Workspace.monthly_savings_target`; e `Budget.repeats`, se o tipo existir)
- Teste: `src/lib/previsao/migracao-previsao.test.ts` (teste de fonte)

**Interfaces (produz):**
- **`workspace_subscriptions.kind`:** `text not null default 'expense'` com `check (kind in ('expense','income'))`. Acrescente também o check `workspace_subscriptions_income_no_card`: `kind = 'expense' or payment_method is distinct from 'credit_card'`.
- **O check da transação:** `alter table transactions drop constraint if exists transactions_subscription_expense_only`.
- **`charge_subscription_cycle(p_subscription_id uuid)` e `seed_subscription_first_transaction()`:** recriadas a partir da definição **mais recente**, `supabase/migrations/20260915110000_billing_anchor_timezone.sql`, `charge_subscription_cycle` (:148) e `seed_subscription_first_transaction` (:267). A única mudança é `'expense'` virar `r.kind` (ou `new.kind`) no `insert` em `transactions`. Mantenha assinatura, `security`, `search_path`, grants e o `on conflict`.
- **`budgets.repeats`:** `boolean not null default false`. Em seguida, `update public.budgets set repeats = true where period_start = date_trunc('month', public.app_today())::date`, e depois `alter column repeats set default true`. Só o mês corrente nasce repetindo.
- **`public.copiar_orcamentos_do_mes(p_period_start date, p_workspace_id uuid default null) returns integer`:** `security definer`, `set search_path = ''`.
  - Insere em `budgets` as linhas do mês anterior (`period_start = p_period_start - interval '1 month'`) com `repeats`, filtradas por `p_workspace_id` quando ele não é nulo.
  - Copia `user_id`, `workspace_id`, `category_id`, `amount`, `repeats` e calcula `period_start`, `period_end` (o último dia do mês), `year` e `month`. Os `threshold_*` e o `client_id` ficam nulos.
  - Usa `on conflict (workspace_id, category_id, period_start) do nothing` e devolve quantas linhas inseriu.
  - O grant é só para `service_role`.
- **`public.garantir_orcamentos_do_mes(p_workspace_id uuid) returns integer`:** `security definer`, `set search_path = ''`, grant para `authenticated`.
  - Exige `public.is_workspace_member(p_workspace_id)`; senão, `raise exception 'not a workspace member'`.
  - Chama `copiar_orcamentos_do_mes(date_trunc('month', public.app_today())::date, p_workspace_id)`.
- **O cron `orcamentos-do-mes`** roda em `'5 3 1 * *'` com `select public.copiar_orcamentos_do_mes(date_trunc('month', public.app_today())::date)`. Use o bloco `do $cron$ … $cron$` de `20261023120000_captura.sql:158`.
- **`workspaces.monthly_savings_target`:** `numeric(15,2)`, nulo, com `check (monthly_savings_target is null or monthly_savings_target >= 0)`.

- [ ] **Passo 1: teste de fonte que falha.** Ele confere:
  - o `kind` com padrão `'expense'` e o check;
  - o check `workspace_subscriptions_income_no_card`;
  - o `drop constraint if exists transactions_subscription_expense_only`;
  - nas duas funções recriadas: nenhum `'expense'` literal no `insert into public.transactions`, e o `r.kind` ou o `new.kind`;
  - o `repeats` com `default false`, depois o `update … app_today()`, depois o `set default true`, nessa ordem;
  - `copiar_orcamentos_do_mes` com `on conflict` e `do nothing`, o filtro `repeats` e o grant só para `service_role`;
  - `garantir_orcamentos_do_mes` com `is_workspace_member`;
  - o cron `orcamentos-do-mes`;
  - `monthly_savings_target` com o check;
  - todas as funções com `set search_path = ''`;
  - nenhum `drop column` nem `alter column … type`.
- [ ] **Passo 2:** `npx vitest run src/lib/previsao/migracao-previsao.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** escrever a migração e os tipos.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(previsao): receita recorrente, orçamento que se repete e reserva no banco`.

### Tarefa 2: Receita recorrente no cliente

**Arquivos:**
- Criar: `src/components/wireframe/receita-recorrente-wireframe.tsx`
- Modificar:
  - o formulário de assinatura (`src/components/subscriptions/use-subscription-form.ts`, `subscription-form-fields.tsx`, `subscription-form-shared.ts`) e `src/lib/subscriptions/mutations.ts`;
  - a lista (`src/app/(app)/subscriptions/page-client.tsx`);
  - `src/components/dashboard/payment-events.ts`, `src/lib/category-commitments.ts`, `src/lib/category-expense-month-rows.ts` e `src/lib/expense-month-attribution.ts` (`projectedSubscriptionCountsInExpenseMonth`).
- Testes: os testes existentes desses módulos ganham casos com `kind: 'income'`.

**Interfaces:**
- Consome da Tarefa 1: `WorkspaceSubscription.kind: 'expense' | 'income'`.
- Produz:
  - `SubscriptionFormPayload.kind`;
  - `ReceitaRecorrenteWireframe({ kind, onChange, disabled })`, `WIREFRAME · Bloco 5 · Receita recorrente`. São dois rádios nativos, "Despesa" e "Receita". Com "Receita", a forma de pagamento "Cartão de crédito" some das opções, e o texto avisa "Receita recorrente entra sozinha no dia, como o salário.";
  - na lista, a assinatura `income` ganha um marcador de texto "Receita" (wireframe, dentro da célula do nome).
- **Os consumidores de projeção:**
  - `payment-events.ts` só cria evento de saída para `kind !== 'income'`;
  - `category-commitments.ts` e `category-expense-month-rows.ts` ignoram as `income`;
  - `projectedSubscriptionCountsInExpenseMonth` devolve `false` para `income`;
  - um `kind` ausente (cache antigo, linha do front velho) vale `'expense'`.

- [ ] **Passo 1: testes que falham.**
  - Uma assinatura `income` não aparece como saída em `buildPaymentEventsForMonth`.
  - Ela não soma em `buildCategoryCommitmentsForMonth().projectedSubscriptionsTotal`.
  - `projectedSubscriptionCountsInExpenseMonth` devolve `false`.
  - Uma assinatura sem `kind` segue como despesa.
  - O payload do formulário com "Receita" sai com `kind: 'income'` e sem cartão.
- [ ] **Passo 2:** `npx vitest run` nos arquivos tocados. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(previsao): receita recorrente nas assinaturas`.

### Tarefa 3: O núcleo da previsão — fatura prevista, fluxo do mês, seguro e linha do tempo

**Arquivos:**
- Criar:
  - `src/lib/previsao/tipos.ts`;
  - `src/lib/previsao/fatura-prevista.ts` e `fatura-prevista.test.ts`;
  - `src/lib/previsao/fluxo.ts` e `fluxo.test.ts`.

**Interfaces (produz):**
```ts
// tipos.ts
export type DadosDaPrevisao = {
  hojeYmd: string
  transacoes: Transaction[]            // as da carteira, com o padding de meses que a função pedir
  assinaturas: WorkspaceSubscription[]
  planos: WorkspaceInstallmentPlan[]
  cartoes: CreditCard[]                // só os ativos
  totaisDoBanco: CreditCardStatementTotal[]
  faturasPagas: Set<string>            // statementTotalKey(cardId, closeYmd) de credit_card_invoice_payments
  contas: Bill[]
  contasPendentes: BillInstance[]      // status 'pending'
  reserva: number | null               // workspaces.monthly_savings_target
}
export type FaturaDoMes = { cardId: string; nome: string; closeYmd: string; dueYmd: string
  total: number; paga: boolean; usaTotalDoBanco: boolean }
export type FluxoDoMes = { ym: string
  receitas: { recebidas: number; previstas: number }
  despesas: { pagas: number; previstas: number }   // fora do crédito: transações, assinaturas, parcelas e contas
  faturas: FaturaDoMes[]
  contasSemValor: string[]
  entra: number; sai: number; sobra: number }
export type Seguro = FluxoDoMes & { reserva: number; seguro: number; diasRestantes: number; porDia: number
  comprometidoNaProximaFatura: number }
export type MesDaLinha = FluxoDoMes & { fimDeParcelamentos: Array<{ planoId: string; descricao: string }> }
export type Projecao = { meses: MesDaLinha[]; primeiroMesNegativo: string | null }
```
- `fatura-prevista.ts`: `export function faturaPrevista(card: CreditCard, closeYm: string, dados: DadosDaPrevisao): { total: number; closeYmd: string; dueYmd: string; usaTotalDoBanco: boolean }`. Ela soma três partes:
  - o `committedTotal` de `buildCardMonthlyInvoiceSnapshot(card, transacoes, closeYm, hoje, { installmentPlans: planos })`;
  - as cobranças projetadas das assinaturas `expense` desse cartão (`payment_method = 'credit_card'` e `payment_credit_card_id = card.id`) cuja data cai na janela e ainda não foram lançadas. A data vem de `expandSubscriptionChargesInYmdRange`, e uma cobrança está lançada quando há transação com `subscription_id` e o mesmo dia;
  - com a fatura `closed` e total do banco, o `totalComBanco` dele.

  `dueYmd` vem de `estimatedDueDateForClose`.
- `fluxo.ts`:
  - `export function fluxoDoMes(dados: DadosDaPrevisao, ym: string): FluxoDoMes`:
    - **receitas:** transações `income` fora do cartão no mês (até hoje são `recebidas`; depois de hoje, `previstas`), mais as cobranças projetadas das assinaturas `income` depois de hoje e dentro do mês, ainda não lançadas;
    - **despesas fora do crédito:** transações `expense` sem `credit_card` no mês (`pagas` até hoje; `previstas` depois), mais as assinaturas e as parcelas fora do cartão projetadas depois de hoje, mais as contas da Decisão 3;
    - **faturas:** a `faturaPrevista` de cada cartão para os fechamentos cujo `dueYmd` cai no mês (confira o fechamento do mês e o do mês anterior);
    - **totais:** `entra = receitas.recebidas + receitas.previstas`, `sai = despesas.pagas + despesas.previstas + Σ faturas.total` e `sobra = entra − sai`.
  - `export function seguroParaGastar(dados: DadosDaPrevisao, ym?: string): Seguro`. O mês padrão é o de `hojeYmd`.
    - `seguro = sobra − (reserva ?? 0)`;
    - `diasRestantes`: do dia de hoje (contado) ao último do mês, quando é o mês corrente; o mês inteiro, quando é futuro; e 0, quando é passado;
    - `porDia = seguro > 0 && diasRestantes > 0 ? seguro / diasRestantes : 0`, arredondado a centavo;
    - `comprometidoNaProximaFatura`: a soma das `faturaPrevista` em aberto cujo `dueYmd` cai depois do fim do mês.
  - `export function projecaoMensal(dados: DadosDaPrevisao, meses = 6): Projecao`. Começa no mês de hoje e devolve um `fluxoDoMes` por mês, mais `fimDeParcelamentos`, os planos cuja última parcela cai naquele mês. `primeiroMesNegativo` é o primeiro `ym` com `sobra < 0`.
  - A soma é feita em centavos (inteiros) e devolvida em reais. Nenhuma função lê o relógio: o dia vem de `dados.hojeYmd`.

- [ ] **Passo 1: testes que falham — a tabela de casos da spec**, cada um com números fechados escritos no teste:
  1. sem renda recorrente: `entra` só com o que já entrou;
  2. com o salário recorrente dia 5, em 2026-11 com hoje 2026-11-03: `previstas` traz o salário;
  3. meses de 28 (2027-02), 30 (2026-11) e 31 (2026-12) dias, com `diasRestantes` e `porDia`;
  4. a fatura que vence no último dia: o cartão com `due_day 31` em 2026-11 vence em 30/11 e entra no mês;
  5. o estorno de R$ 50 abatendo a fatura prevista;
  6. a fatura fechada com o total do banco, que entra pelo total do banco, e a fatura aberta, que o ignora;
  7. uma assinatura no cartão projetada dentro da fatura, e não duplicada quando já foi lançada;
  8. a conta pendente vencida no mês anterior, que entra; e a conta sem valor, que vai a `contasSemValor`;
  9. a fatura paga, que entra marcada `paga`;
  10. `projecaoMensal` com um plano que termina no 3º mês, que aparece em `fimDeParcelamentos`, e o `primeiroMesNegativo` certo;
  11. a reserva abatendo o `seguro`, e o `porDia` 0 quando o seguro é negativo.
- [ ] **Passo 2:** `npx vitest run src/lib/previsao`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(previsao): fatura prevista, seguro para gastar e linha do tempo`.

### Tarefa 4: Os dados e as telas da previsão (Painel e `/previsao`)

**Arquivos:**
- Criar:
  - `src/lib/previsao/use-previsao.ts`;
  - `src/components/wireframe/seguro-para-gastar-wireframe.tsx`;
  - `src/components/wireframe/linha-do-tempo-wireframe.tsx`;
  - `src/app/(app)/previsao/page.tsx` e `loading.tsx`.
- Modificar:
  - o cliente do Painel (`src/app/(app)/dashboard/page-client.tsx`), que monta o cartão compacto;
  - `src/config/navigation.ts` (`PREVISAO: "/previsao"`) e `APP_PAGE_TITLES` (`/previsao` → "Previsão").

**Interfaces:**
- Consome a Tarefa 3 e os hooks existentes: `useCreditCards`, `useInstallmentPlans`, `useSubscriptionsQuery`, `useCreditCardExpenseRowsQuery`, `useStatementTotalsQuery`, os pagamentos de fatura que o Painel já lê em `use-dashboard-data.ts` e as contas pendentes de `fetchPendingBillInstancesForDashboard`. Confirme os nomes com `graphify query`.
- Produz: `export function usePrevisao(workspaceId: string | null): { dados: DadosDaPrevisao | null; carregando: boolean; erro: string | null }`.
  - Ele reusa o cache dos mesmos `queryKey` do Painel, sem duplicar consultas.
  - A janela de transações vai do mês anterior ao corrente até 6 meses à frente.
  - Os `Bill[]` vêm da consulta que a tela de contas já usa.
- **`SeguroParaGastarWireframe({ seguro, compacto })`**, `WIREFRAME · Bloco 5 · Seguro para gastar`:
  - o número e o "por dia";
  - a frase do regime: "Caixa: o dinheiro que sai neste mês. A fatura conta no mês em que vence.";
  - com `compacto`, só isso e o link para `/previsao`;
  - sem `compacto`, a decomposição (receitas, despesas, faturas por cartão com "paga" e "total do banco", e a reserva);
  - "Já comprometido na próxima fatura: R$ X";
  - "Contas sem valor: …" quando houver;
  - o campo "Reserva do mês", que grava `workspaces.monthly_savings_target`.
- **`LinhaDoTempoWireframe({ projecao })`**, `WIREFRAME · Bloco 5 · Linha do tempo`: uma linha por mês, com entra, sai, sobra e "fim de: …". O primeiro mês negativo vem marcado com "Primeiro mês no vermelho".
- O cartão compacto só aparece no Painel com o mês do Painel igual ao de hoje. Em outro mês, mostra "A previsão é do mês corrente" e o link.

- [ ] **Passo 1: testes que falham.**
  - Teste de fonte: `use-previsao.ts` usa os mesmos `queryKey` dos hooks do Painel e não chama `supabase.from` diretamente para transações.
  - Teste do wireframe: o texto do regime está presente e o link vai a `ROUTES.PREVISAO`.
- [ ] **Passo 2:** `npx vitest run src/lib/previsao src/components/wireframe`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(previsao): seguro no Painel e linha do tempo em /previsao`.

### Tarefa 5: Impacto da parcela, antes de salvar

**Arquivos:**
- Criar:
  - `src/lib/previsao/impacto-parcela.ts` e `impacto-parcela.test.ts`;
  - `src/components/wireframe/impacto-parcela-wireframe.tsx`.
- Modificar:
  - `src/components/transactions/installment-purchase-section.tsx` (ou `transaction-form-fields.tsx`, onde estiver o modo Parcelada), que monta o quadro;
  - `src/components/wireframe/frase-rapida-wireframe.tsx`, que monta o quadro quando a frase traz `parcelas`;
  - o detalhe do lançamento parcelado (procure com `graphify query "transaction detail sheet installment"`).

**Interfaces:**
- Consome a Tarefa 3 (`DadosDaPrevisao`, `projecaoMensal`, `faturaPrevista`) e a Tarefa 4 (`usePrevisao`).
- Produz:
  ```ts
  export type PlanoProposto = { valorParcela: number; parcelas: number; ultimaParcela?: number
    primeiraYmd: string; cardId: string | null; descricao: string }
  export type Impacto = {
    parcelaEFim: string                        // "R$ 300,00 até jun/2027"
    pico: { semEsta: number; comEsta: number; mes: string }   // a maior soma mensal de parcelas daqui em diante
    proximasFaturas: Array<{ closeYmd: string; antes: number; depois: number }> | null   // 3, só com cartão
    percentualDaRenda: number | null           // parcelas do mês ÷ receita recorrente mensal; null sem receita
    primeiroMesNegativo: { antes: string | null; depois: string | null }
    limite: { disponivel: number | null; cabe: boolean | null; motivo: 'sem_cartao' | 'sem_limite' | null } }
  export function impactoDaParcela(plano: PlanoProposto, dados: DadosDaPrevisao): Impacto
  ```
- As regras de `impactoDaParcela`:
  - **o "depois":** junte aos `dados.planos` um plano sintético equivalente (mesmo `billing_anchor_day` que `create_workspace_installment_plan` gravaria a partir de `primeiraYmd`) e rode a mesma `projecaoMensal` e a mesma `faturaPrevista`;
  - **o limite:** `credit_limit` − (Σ `faturaPrevista` das faturas não pagas do cartão, do aberto em diante, mais as parcelas futuras). `cabe = disponivel ≥ valor total da compra`;
  - **a renda recorrente mensal:** a soma das assinaturas `income` ativas normalizada por mês (`weekly × 52/12`, `bimonthly ÷ 2`, `yearly ÷ 12`).
- **`ImpactoParcelaWireframe({ impacto })`**, `WIREFRAME · Bloco 5 · Impacto da parcela`:
  - mostra as seis linhas da spec;
  - avisa "Não cabe no limite do cartão" quando `cabe === false`;
  - mostra "Sem limite cadastrado" com `sem_limite`;
  - sem cartão, não mostra faturas nem limite.

- [ ] **Passo 1: testes que falham.**
  - 10x de R$ 300 no cartão a partir de 2026-11: `parcelaEFim` é "R$ 300,00 até ago/2027".
  - O pico com e sem a compra.
  - As 3 faturas antes e depois.
  - `percentualDaRenda` com salário de R$ 5.000 e parcelas de R$ 300 vale 6.
  - O primeiro mês negativo muda.
  - O limite de R$ 2.000 com R$ 500 usados dá `disponivel` 1500 e `cabe` falso para R$ 3.000.
  - Sem cartão (Pix): `proximasFaturas` e `limite.disponivel` nulos e motivo `sem_cartao`.
  - O cartão sem limite dá motivo `sem_limite`.
- [ ] **Passo 2:** `npx vitest run src/lib/previsao/impacto-parcela.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** implementar a função, o wireframe e os três pontos de montagem.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(previsao): impacto da parcela no formulário, na frase e no detalhe`.

### Tarefa 6: Orçamento que se repete no cliente

**Arquivos:**
- Criar: `src/components/wireframe/orcamento-repete-wireframe.tsx`
- Modificar:
  - `src/lib/category-budget-ops.ts` (`buildBudgetRow` com `repeats`, e `definirRepeticao`);
  - o editor de orçamento da categoria (procure com `graphify query "category budget edit dialog upsertCategoryBudget"`);
  - o cliente do Painel e o de `src/app/(app)/categories/page-client.tsx`, que chamam `garantir_orcamentos_do_mes` ao abrir.
- Teste: `src/lib/category-budget-ops.test.ts` (crie, se não existir).

**Interfaces:**
- Consome da Tarefa 1: `budgets.repeats` e o RPC `garantir_orcamentos_do_mes(p_workspace_id)`.
- Produz:
  - `export function definirRepeticao(budgetId: string, repeats: boolean): Promise<{ ok: boolean; erro?: string }>`;
  - `export function useGarantirOrcamentosDoMes(workspaceId: string | null): void`. Chama o RPC uma vez por carteira e por mês na sessão, com a chave `${workspaceId}:${ym}` num `Set` de módulo. Num sucesso com retorno maior que 0, invalida as consultas de orçamento. Um erro vai ao `console.error`, sem toast.
- **`OrcamentoRepeteWireframe({ repeats, onChange })`**, `WIREFRAME · Bloco 5 · Orçamento que se repete`: uma caixa nativa "Repetir todo mês" e o texto "Desligue para encerrar este orçamento depois deste mês.".

- [ ] **Passo 1: testes que falham.**
  - `buildBudgetRow` leva `repeats: true` por padrão e respeita o falso.
  - O hook chama o RPC uma vez para duas montagens no mesmo mês, e de novo num mês novo.
- [ ] **Passo 2:** `npx vitest run src/lib/category-budget-ops.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/wireframe && npm run build`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(previsao): orçamento que se repete`.

### Tarefa 7: O aviso de orçamento pelo mês do fechamento

**Arquivos:**
- Criar:
  - `supabase/functions/_shared/orcamento-mes.ts` e `orcamento-mes.test.ts` (Deno);
  - `src/lib/fixtures/orcamento-mes-vectors.json`;
  - `src/lib/orcamento-mes-parity.test.ts` (Vitest).
- Modificar: `supabase/functions/_shared/credit-card-cycle.ts` (o helper novo) e `supabase/functions/evaluate-budgets/index.ts`.

**Interfaces:**
- Produz em `credit-card-cycle.ts`: `export function statementCloseYmdForPurchaseYmd(purchase: Ymd, closingDay: number): Ymd`. Espelha `statementCloseYmdForPurchaseDate` do cliente (`src/lib/credit-card-billing.ts:137`): o primeiro fechamento no dia da compra ou depois.
- Produz em `orcamento-mes.ts`: `export function gastoDaCategoriaNoMes(rows: CardTxRow[], categoryId: string, ym: string, closingDayByCard: Record<string, number>): number`.
  - A despesa fora do cartão conta pelo dia.
  - A despesa no cartão conta pelo mês do fechamento.
  - A receita no cartão (estorno) dessa categoria abate pelo mês do fechamento.
  - O arquivo só importa de `./credit-card-cycle.ts`.
- **`evaluate-budgets`:**
  - o mês do orçamento da compra no cartão passa a ser o do fechamento (`statementCloseYmdForPurchaseYmd`);
  - a soma do mês passa a ser `gastoDaCategoriaNoMes`, lendo as transações da categoria com uma folga de um mês antes e um depois e os `closing_day` dos cartões da carteira;
  - o resto (faixas, `threshold_*`, entrega) não muda.
- **Os vetores dourados** (`orcamento-mes-vectors.json`): pelo menos 8 casos com o resultado esperado. São eles:
  - a compra no dia do fechamento;
  - o dia seguinte ao fechamento;
  - o fechamento no 31 em fevereiro;
  - o estorno;
  - a despesa no Pix;
  - a categoria diferente;
  - dois cartões;
  - a virada de ano.

  O teste Deno lê o JSON com `Deno.readTextFile` e compara com `gastoDaCategoriaNoMes`. O Vitest compara o mesmo JSON com o `postedTotal` de `buildCategoryCommitmentsForMonth` (ou com a função que a tela de Categorias usa para o gasto postado da categoria) **e** com `gastoDaCategoriaNoMes`, importado direto do `_shared`.

- [ ] **Passo 1: os vetores e os dois testes, que falham.**
- [ ] **Passo 2:** `npm run test:edge && npx vitest run src/lib/orcamento-mes-parity.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** implementar os helpers e a mudança na Edge.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(previsao): aviso de orçamento pelo mês do fechamento`.

### Tarefa 8: Alerta de fatura alta (`cc_invoice_trending_high`)

**Arquivos:**
- Criar:
  - `supabase/functions/_shared/fatura-tendencia.ts` e `fatura-tendencia.test.ts` (Deno);
  - `src/lib/fixtures/fatura-tendencia-vectors.json`;
  - `src/lib/fatura-tendencia-parity.test.ts` (Vitest).
- Modificar:
  - `supabase/functions/credit-card-calendar-alerts/index.ts`;
  - `supabase/functions/_shared/notification-copy.ts` (`trendingHighCopy`);
  - o cliente que traduz `metadata.kind` em texto e destino, se existir (procure `cc_payment_due_soon` em `src/`).

**Interfaces:**
- Produz em `fatura-tendencia.ts`:
  ```ts
  export type PlanoNoCartao = { id: string; payment_credit_card_id: string; next_billing_date: string
    installment_amount: number; final_installment_amount: number | null; total_installments: number
    generated_count: number; billing_anchor_day: number | null }
  export function parcelasProjetadasNaJanela(cardId: string, janela: OpenWindow, planos: PlanoNoCartao[], rows: CardTxRow[]): number
  export function avaliarTendencia(abertaPrevista: number, ultimasFechadas: number[]): { dispara: boolean; media: number; acima: number; percentual: number }
  ```
  - `parcelasProjetadasNaJanela` espelha `sumProjectedCreditCardInstallmentsInWindow` do cliente: as parcelas ainda não lançadas, com as datas pelo dia âncora e o último dia do mês quando ele não existe. Confira os nomes reais das colunas de `workspace_installment_plans` em `src/types/database.ts` e ajuste o tipo.
  - `avaliarTendencia` dispara só com 3 fechadas, quando `abertaPrevista > 1.2 × média`. O resultado traz `acima = aberta − média` e `percentual` arredondado.
- **No cron**, para cada cartão ativo:
  - `abertaPrevista = cardInvoiceNetInWindow(janela aberta) + parcelasProjetadasNaJanela`;
  - as 3 últimas fechadas vêm de `cardInvoiceNetInWindow` com `escolherTotal` (o total do banco);
  - o dedupe é `cal:trending_high:{closeYmd}:c:{cardId}`, por pessoa, como os outros eventos do arquivo;
  - a preferência é `notify_credit_cards`, e `metadata` leva `{ kind: 'cc_invoice_trending_high', credit_card_id, href: '/previsao' }`.
- **`trendingHighCopy(nome, prevista, percentual, acima)`:**
  - título: "Fatura do {nome} acima do normal";
  - corpo: "A fatura prevista é {R$ prevista}, {percentual}% acima da média das últimas 3 ({R$ acima} a mais). Veja quanto ainda sobra no mês do vencimento em Previsão.".
- **Os vetores:** pelo menos 6 casos, entre eles:
  - a parcela já lançada;
  - o dia âncora 31;
  - o plano em outro cartão;
  - só 2 fechadas (não dispara);
  - exatamente 120% (não dispara);
  - 121% (dispara).

  O Vitest compara `parcelasProjetadasNaJanela` com `sumProjectedCreditCardInstallmentsInWindow` sobre o mesmo JSON.

- [ ] **Passo 1: os vetores e os testes, que falham.** O teste de fonte do cron confere o dedupe `trending_high` e o `notify_credit_cards`.
- [ ] **Passo 2:** `npm run test:edge && npx vitest run src/lib/fatura-tendencia-parity.test.ts`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm run test:edge && npx tsc --noEmit && npm run lint && npm run test:unit`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat(previsao): alerta de fatura acima do normal`.

### Tarefa 9: Roteiro de publicação, jornadas e Atlas

**Arquivos:**
- Criar: `supabase/BLOCO_5_DEPLOYMENT.md`
- Modificar: `docs/JORNADAS.md`, `docs/atlas/template.html`, `docs/atlas/atlas-jornadas.html` (gerado)

**O roteiro**, no estilo do `supabase/BLOCO_4_DEPLOYMENT.md`:
1. Aplicar a migração e conferir:
   - o `kind` padrão das assinaturas que já existem: todas são `'expense'`;
   - quantas linhas de orçamento ficaram com `repeats = true`: só o mês corrente;
   - o cron `orcamentos-do-mes`.
2. O deploy de `evaluate-budgets` e de `credit-card-calendar-alerts`, mais o redeploy de toda Edge que importa `_shared/credit-card-cycle.ts` ou `_shared/notification-copy.ts`. A lista sai do fecho dos imports.
3. A conferência pós-deploy, só leitura, de que a primeira cobrança de assinatura do dia seguinte saiu `expense`.

**As jornadas:**
- **"Previsão":** Painel (cartão do seguro) → `/previsao`; o quadro de impacto no formulário Parcelado, na frase e no detalhe; o alerta de fatura alta → `/previsao`.
- **As mudanças nas jornadas existentes:** a assinatura de receita; o orçamento que se repete; o RPC ao abrir o Painel e Categorias; o aviso de orçamento pelo mês do fechamento.
- **As regras técnicas:** `fluxoDoMes`, `seguroParaGastar`, `faturaPrevista`, `copiar_orcamentos_do_mes` e `gastoDaCategoriaNoMes`.
- **As lacunas:**
  - o "em aberto" do Painel não traz as assinaturas do cartão; a "prevista" traz;
  - o alerta não diz quanto sobra.

**O Atlas:** a mesma jornada, as rotas (`/previsao`), o backend e a capa. Depois, `python3 docs/atlas/build.py`.

- [ ] **Passo 1:** escrever o roteiro.
- [ ] **Passo 2:** atualizar `JORNADAS.md` e `template.html`, e rodar `python3 docs/atlas/build.py`. Esperado: o HTML gerado, sem erro.
- [ ] **Passo 3:** `npx tsc --noEmit && npm run lint && npm run test:unit && npm run build`. Esperado: PASS.
- [ ] **Passo 4:** commit `docs(previsao): roteiro do Bloco 5, jornadas e Atlas`.
