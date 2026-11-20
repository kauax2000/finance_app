# Detalhe da categoria — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir `/categories/[categoryId]` como o raio-X de uma categoria: mês, comparações, 12 meses, onde e quem, para onde vai, comprometido, peso e lançamentos — análise à esquerda e lançamentos à direita no desktop, abas Resumo · Lançamentos no telefone.

**Architecture:** Mesma RPC (`useCategoryDetailBundleQuery`), sem migração. As contas novas são funções puras em `src/lib/categoria-detalhe.ts`, testadas com vitest. A tela compõe blocos novos em `src/components/categories/detail/`, cada um feito só de peças do design system. A lista de lançamentos reaproveita `CategoryEmbeddedTransactions`, que ganha uma forma `lista` (de `Item`) para a coluna estreita.

**Tech Stack:** Next.js (ler `node_modules/next/dist/docs/` antes de mexer em rota), React 19, TanStack Query, Recharts via `@/components/ui/chart`, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-20-detalhe-da-categoria-design.md` — leia inteiro antes de qualquer task.

## Global Constraints

- Regras do `AGENTS.md` valem todas: componente não nasce em `src/app/`; zero literais de cor/medida; `success`/`destructive` ≠ `income`/`expense`; Heroicons só (`16/solid` ≤ size-4, `20/solid` size-5, `24/outline` size-6+); dinheiro por `MoneyDisplay` / `currencyBRL`; datas por `src/lib/transaction-date.ts`; `bg-clip-padding` em caixa com borda.
- **Proibido mexer em `src/components/ui/`, `src/app/globals.css` e `src/app/designsystem/`.** Se faltar peça, PARE e reporte (o dono decide). Esperar não é dissolver.
- Nenhum banco, RPC ou migração muda.
- Total do topo (despesa) = `postedTotal` de `buildCategoryCommitmentsForMonth`; previsto = `projectedInstallmentsTotal + projectedSubscriptionsTotal`. Receita = `receitasDoMesPorCategoria(...)[categoryId]` (`recebido`, `previsto`).
- Convidado (`isAdulto === false`) não vê editar, excluir nem limite.
- Antes de cada commit: `npx tsc --noEmit && npm run lint && npm run test:unit` verdes; `npm run ds:audit -- <arquivos da task>` sem violação nova.
- Depois de mudar código: `graphify update .`.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Branch `finance-app-2.0`; nunca push sem pedido.

## Review Focus

1. Categoria sem nenhum lançamento em 13 meses → cada bloco mostra vazio curto, sem `NaN`, sem "R$ 0 (0%)" em gráfico vazio, sem média.
2. Mês passado aberto (`?month=2026-08`) → comparação é mês inteiro contra mês inteiro ("vs julho"), sem "previsto", sem projeção.
3. Estorno no cartão (receita `credit_card`) numa categoria de despesa → abate o total, a série, a divisão por pagamento e por membro; nunca aparece como "maior gasto".
4. Lançamento sem `paid_by` nem membro no diretório (membro que saiu) → agrupa em "Outros", não quebra nem some do total.
5. Categoria de receita → sem limite, sem barra de orçamento, divisões e comparações pela receita; o texto não diz "gasto".

---

### Task 1: Contas puras da tela

**Files:**
- Create: `src/lib/categoria-detalhe.ts`
- Test: `src/lib/categoria-detalhe.test.ts`

**Interfaces:**
- Consumes: `transactionCountsInExpenseMonth`, `buildCreditCardClosingLookup`, `sinalNaDespesa`, `CreditCardClosingLookup` (`@/lib/expense-month-attribution`); `shiftYearMonth` (`@/lib/budget-month`); `transactionLocalYmd` (`@/lib/transaction-date`); `paymentMethodLabel` (`@/lib/payment-methods`); `MemberDirectoryRow` (`@/lib/queries/use-member-directory`).
- Produces (todos em reais, números finitos):
  ```ts
  export type LinhaDeValor = Pick<Transaction, "date" | "amount" | "type" | "payment_method" | "payment_credit_card_id">
  export type TipoDaCategoria = "expense" | "income"
  /** Soma com sinal (estorno abate na despesa); `ateDia` corta pela data da compra (dia ≤ ateDia). */
  export function totalNoMes(rows: LinhaDeValor[], tipo: TipoDaCategoria, yearMonth: string, lookup: CreditCardClosingLookup, ateDia?: number): number
  export function serieDosMeses(rows: LinhaDeValor[], tipo: TipoDaCategoria, yearMonth: string, lookup: CreditCardClosingLookup, meses?: number /* 12 */): { yearMonth: string; total: number }[] // mais antigo primeiro, termina em yearMonth
  export type Comparacao = { mesAnterior: string; anterior: number; atual: number; variacao: number | null /* fração, null se anterior = 0 */; mesmoPonto: boolean }
  export function comparacaoComMesAnterior(args: { rows: LinhaDeValor[]; tipo: TipoDaCategoria; yearMonth: string; hojeYmd: string; lookup: CreditCardClosingLookup }): Comparacao
  export function mediaDosMeses(args: { rows: LinhaDeValor[]; tipo: TipoDaCategoria; yearMonth: string; lookup: CreditCardClosingLookup; criadaEm: string /* ISO */; meses?: number /* 6 */ }): number | null
  export type Fatia = { chave: string; nome: string; valor: number }
  export function divisaoPorPagamento(txs: Transaction[], tipo: TipoDaCategoria, cartoes: Pick<CreditCard, "id" | "name">[]): Fatia[] // maior primeiro
  export function divisaoPorMembro(txs: Transaction[], tipo: TipoDaCategoria, membros: MemberDirectoryRow[]): Fatia[] // maior primeiro
  export function maioresLancamentos(txs: Transaction[], tipo: TipoDaCategoria, n?: number /* 5 */): Transaction[]
  export function descricoesRepetidas(txs: Transaction[], tipo: TipoDaCategoria, n?: number /* 3 */): { descricao: string; vezes: number; total: number }[]
  ```
  `txs` aqui são os lançamentos do mês já atribuídos (o `bundle.txs`).

Regras que os testes pinçam:
- `comparacaoComMesAnterior`: se `hojeYmd` está dentro de `yearMonth` → `mesmoPonto: true`, `ateDia = dia de hojeYmd` nos dois meses; senão mês inteiro nos dois.
- `mediaDosMeses`: os `meses` completos **antes** de `yearMonth`, só os ≥ mês de `criadaEm`; mês sem lançamento conta 0; menos de 2 meses elegíveis → `null`.
- `divisaoPorPagamento`: chave = id do cartão quando `payment_method === "credit_card"` (nome do cartão; sem cartão achado → "Cartão"), senão o `payment_method` com `paymentMethodLabel`; sem método → "Sem forma".
- `divisaoPorMembro`: chave = `paid_by ?? created_by`; nome = `full_name ?? email` do diretório; não achado → chave `"outros"`, nome "Outros". Fatias zero ou negativas saem.
- `maioresLancamentos`/`descricoesRepetidas` ignoram estorno e o tipo oposto. `descricoesRepetidas` agrupa por `description.trim().toLocaleLowerCase("pt-BR")`, mostra a grafia mais frequente, só `vezes ≥ 2`, ordena por `vezes` e depois `total`.

- [ ] **Step 1: Escrever os testes**, um `describe` por função, com estes casos mínimos (fixtures inline, cartão `{id:"c1", closing_day: 10, name:"Nubank"}`):
  - `totalNoMes`: compra no cartão em 15/out conta em nov (fechamento dia 10) e não em out; estorno no cartão de 20 em out abate 20 da despesa de nov; `ateDia: 5` exclui compra do dia 6.
  - `serieDosMeses(…, "2026-11", …, 3)` → `[{2026-09},{2026-10},{2026-11}]` com zeros nos meses vazios.
  - `comparacaoComMesAnterior` com `hojeYmd "2026-11-12"` → `mesmoPonto true`, `anterior` só até 12/out; com `yearMonth "2026-08"` → `mesmoPonto false`, `mesAnterior "2026-07"`; `anterior 0` → `variacao null`.
  - `mediaDosMeses`: criada em 2026-09-20, aberto 2026-11 → 1 mês elegível → `null`; criada em 2025 com gastos 100, 0, 200 nos 3 anteriores e `meses: 3` → `100`.
  - `divisaoPorPagamento`: Pix + Nubank + cartão desconhecido → nomes "Pix", "Nubank", "Cartão", ordenado por valor.
  - `divisaoPorMembro`: membro ausente → "Outros"; `paid_by` vence `created_by`.
  - `maioresLancamentos` não traz estorno; `descricoesRepetidas` junta "iFood " e "ifood" (vezes 2) e descarta único.
- [ ] **Step 2:** `npx vitest run src/lib/categoria-detalhe.test.ts` → FAIL (módulo não existe).
- [ ] **Step 3:** Implementar `src/lib/categoria-detalhe.ts` com as assinaturas acima. Receita: `sinal = t.type === "income" && t.payment_method !== "credit_card" ? 1 : 0` (mesma regra de `receitasDoMesPorCategoria`); despesa: `sinalNaDespesa(t)`; o mês por `transactionCountsInExpenseMonth`.
- [ ] **Step 4:** `npx vitest run src/lib/categoria-detalhe.test.ts` → PASS.
- [ ] **Step 5:** Commit `feat(categoria): contas do detalhe da categoria`, incluindo o spec e este plano (`docs/superpowers/specs/2026-11-20-detalhe-da-categoria-design.md`, `docs/superpowers/plans/2026-11-20-detalhe-da-categoria.md`).

---

### Task 2: Blocos de análise

**Files (todos novos, `src/components/categories/detail/`):**
- `resumo-do-mes.tsx` — itens 1 e 7 (topo)
- `comparacoes.tsx` — item 2
- `historico-dos-meses.tsx` — item 3
- `onde-e-quem.tsx` — item 4
- `para-onde-vai.tsx` — item 5
- `comprometido.tsx` — item 6

**Interfaces:**
- Consumes: tipos e funções da Task 1; `CategoryCommitmentTotals`; `WorkspaceInstallmentPlan`, `WorkspaceSubscription`.
- Produces (props; nenhum bloco busca dado):
  ```ts
  ResumoDoMes({ tipo, yearMonth, lancado: number, previsto: number, limite: number | null, pesoNoTotal: number | null /* fração */, aberto: boolean /* mês corrente */ })
  Comparacoes({ tipo, comparacao: Comparacao, media: number | null })
  HistoricoDosMeses({ tipo, serie: {yearMonth: string; total: number}[], limite: number | null })
  OndeEQuem({ tipo, porPagamento: Fatia[], porMembro: Fatia[] })
  ParaOndeVai({ tipo, maiores: Transaction[], repetidas: {descricao; vezes; total}[], onAbrir: (t: Transaction) => void })
  Comprometido({ tipo, yearMonth, parcelas: WorkspaceInstallmentPlan[], assinaturas: WorkspaceSubscription[], previstoNoMes: number })
  ```

Peças e textos decididos:
- `ResumoDoMes`: o número grande com `MoneyDisplay`; com limite, `Progress` com `value` = lançado/limite, `projected` = previsto/limite, `bands={BUDGET_BANDS}` (`lib/budget-bands`) e `marker` = fração do mês decorrida quando `aberto`; frase "Sobra R$ X de R$ Y" ou "Passou R$ X do limite de R$ Y"; se lançado ≤ limite < lançado + previsto: "Com o previsto, passa R$ Z". Receita: "Entrou R$ X" + "Ainda vem R$ Y". Peso: "N% do gasto da carteira" / "da receita".
- `Comparacoes`: `StatCardGroup` de dois `StatCard size="sm"`; o primeiro com `StatCardDelta current previous better` (`better="lower"` na despesa, `"higher"` na receita) e a legenda "vs mesmo dia de outubro" ou "vs outubro"; o segundo "Média de 6 meses", oculto com `media === null`.
- `HistoricoDosMeses`: `Card` + `ChartContainer` com barras (mês curto por `shortLabelYearMonthPt`), barra do mês aberto destacada, `ChartReferenceLine` no limite rotulada "Limite atual"; série toda zero → `EmptyState` inline "Sem movimento nos últimos 12 meses". Barras em `--chart-1` (a exceção da cor da categoria vale só para traço e área da faísca, não para barras); a prop `cor` sai da interface.
- `OndeEQuem`: dois `ChartBarList share` ("Por forma de pagamento", "Por pessoa"); "Por pessoa" some com uma fatia só.
- `ParaOndeVai`: `ItemGroup` com os maiores (descrição, data `formatDatePtBr`, valor) clicáveis (`onAbrir`) e, abaixo, as repetidas ("iFood · 14× · R$ 612").
- `Comprometido`: parcelas ativas da categoria ("3/10 · R$ 120/mês") e assinaturas ativas, com o total previsto do mês no cabeçalho; vazio → não renderiza.
- Seções com `PageSection` + `PageSectionTitle` (sem `size`), painéis com `Card`.

- [ ] **Step 1:** Implementar os seis arquivos. Nenhum `className` com cor/medida crua.
- [ ] **Step 2:** `npm run ds:audit -- src/components/categories/detail` → sem violação nova nos seis arquivos. Faltou peça → PARE e reporte.
- [ ] **Step 3:** `npx tsc --noEmit && npm run lint` → verdes.
- [ ] **Step 4:** Commit `feat(categoria): blocos de análise do detalhe`.

---

### Task 3: Lista de lançamentos para a coluna estreita

**Files:**
- Modify: `src/components/categories/detail/category-embedded-transactions.tsx`

**Interfaces:**
- Produces: prop nova `forma?: "tabela" | "lista"` (padrão `"tabela"`, comportamento atual intacto).

Com `forma="lista"`: no lugar de toolbar + chips + `TransactionsTable` + paginação, um `Card padding="none"` com título "Lançamentos (N)", os lançamentos (`displayTransactions`) agrupados por dia (`groupByLocalDay` + `formatDayHeadingPtBr`, `ItemGroupLabel sticky`), cada um um `Item` clicável (descrição, legenda forma de pagamento, `MoneyDisplay`) que chama `openTransactionDetail(t)`; previsto (linhas projetadas) marcado com `Badge` "Previsto"; no pé, `Button` "Ver em Transações" com o mesmo `href` que a forma tabela já monta. Vazio: o mesmo `EmptyState` de hoje. O `TransactionDetailSheet` e os diálogos continuam montados nas duas formas.

- [ ] **Step 1:** Implementar `forma` sem duplicar a lógica de dados (só o trecho de render muda).
- [ ] **Step 2:** `npm run ds:audit -- src/components/categories/detail/category-embedded-transactions.tsx`; `npx tsc --noEmit && npm run lint && npm run test:unit` → verdes.
- [ ] **Step 3:** Commit `feat(categoria): lista de lançamentos para a coluna do detalhe`.

---

### Task 4: A tela, o esqueleto e a limpeza

**Files:**
- Modify: `src/app/(app)/categories/[categoryId]/page-client.tsx` (render e derivações; manter queries, diálogos, salvar/excluir/limite, mês da URL)
- Modify: `src/app/(app)/categories/[categoryId]/loading.tsx`, `page.tsx` (esqueleto novo)
- Create: `src/components/categories/detail/category-detail-layout.tsx` — o casco (duas colunas / abas)
- Rewrite: `src/components/categories/detail/category-detail-skeleton.tsx`
- Delete: `category-detail-hero.tsx`, `category-detail-summary-section.tsx`, `category-detail-trends.tsx`; em `category-detail-utils.ts` apagar o que ficar sem uso (`buildDailySeries`, `buildMonthlySeries`, `computeAmountStats`, `hexToRgba`… conferir com grep e ajustar `category-detail-utils.test.ts`).

**Interfaces:**
- Consumes: Tasks 1–3; `useMemberDirectoryQuery(workspaceId)`; `receitasDoMesPorCategoria`; `useMonthInHeader` / `MonthNav` como hoje; `PageHeader collapse` com `PageHeaderTitle asChild` e ⋯ (`DropdownMenu`: Editar, Definir limite/Editar limite → abre o mesmo diálogo de edição com o limite aberto, Excluir) e "+ Lançar" (`Button primary`, abre `TransactionFormDialog` com a categoria — usar o caminho que o `EmptyState` da lista já usa).
- Produces: `CategoryDetailLayout({ resumo: ReactNode; analise: ReactNode; lancamentos: (forma: "tabela" | "lista") => ReactNode; totalLancamentos: number })`.

Casco: abaixo de `md` (`useIsMobile()` — exceção consciente: troca o arranjo, não a superfície), `resumo` e depois `Tabs` (padrão do DS) com `TabsContent` "Resumo" (`analise`) e "Lançamentos (N)" (`lancamentos("tabela")`). De `md` para cima, grade `md:grid-cols-5`: `resumo` + `analise` em `col-span-3`; `lancamentos("lista")` em `col-span-2`, `sticky` em `top-(--top-bar-bottom)` com altura `calc(100dvh_-_var(--top-bar-bottom))` e rolagem própria (via `ScrollArea`).

Ordem da análise: Comparações → Histórico → Onde e quem → Para onde vai → Comprometido. O peso vai dentro do `ResumoDoMes`.

Esqueleto: `SkeletonGroup` com a mesma forma (topo + abas no telefone; duas colunas no desktop), peças `Skeleton shape="surface"`/`text`/`control`.

- [ ] **Step 1:** Escrever `category-detail-layout.tsx` e o esqueleto novo.
- [ ] **Step 2:** Reescrever o render do `page-client.tsx`; derivações via `React.useMemo` com as funções da Task 1 (`lookup = buildCreditCardClosingLookup(bundle.creditCards)`, `hojeYmd = localYmdFromDate(new Date())`, cartões com nome vindos de `txController.creditCards`).
- [ ] **Step 3:** Apagar os arquivos antigos e o código morto; `rtk grep -rn "CategoryDetailHero\|CategoryDetailSummarySection\|CategoryDetailTrends" src` → nada.
- [ ] **Step 4:** `npm run ds:audit -- "src/app/(app)/categories/[categoryId]" src/components/categories/detail`; `npx tsc --noEmit && npm run lint && npm run test:unit` → verdes (inclui `adiar-montagem.test.ts`).
- [ ] **Step 5:** Verificar no navegador do app (dev server já roda em :3000 fora da sessão; usar o `dev-attach` do `.claude/launch.json`), **sem gravar dados** (banco de produção): uma categoria de despesa com limite, uma de receita, `?month=` de um mês passado, a 375px e a 1280px, tema claro e escuro; abrir um lançamento pela coluna e pela aba. Screenshot das duas larguras.
- [ ] **Step 6:** Commit `feat(categoria): novo detalhe da categoria`.

---

### Task 5: Jornada e Atlas

**Files:**
- Modify: `docs/JORNADAS.md` §9 (fluxograma do detalhe: `summary`/`trend` viram os blocos novos; telefone com abas Resumo/Lançamentos; lista do desktop com "Ver em Transações" e detalhe; ⋯ com Definir limite; "+ Lançar")
- Modify: `docs/atlas/template.html` (mesma jornada, data e contagens da capa)
- Generated: `docs/atlas/atlas-jornadas.html` via `python3 docs/atlas/build.py`
- Modify: `AGENTS.md` só se alguma regra nova de tela surgiu (provável: nenhuma)

- [ ] **Step 1:** Atualizar os dois documentos; diagramas com `%%{init}%%` e sem ids reservados.
- [ ] **Step 2:** `python3 docs/atlas/build.py` → sem erro.
- [ ] **Step 3:** Republicar `docs/atlas/atlas-jornadas.html` no URL do Atlas (https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL) com a ferramenta de Artifact (quem orquestra faz isso).
- [ ] **Step 4:** `graphify update .`; commit `docs(jornadas): novo detalhe da categoria`.
