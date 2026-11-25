# Lançamentos da categoria com a tabela de Transações — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O bloco "Lançamentos do mês" de `/categories/[id]` passa a ser a `TransacoesTabela` de Transações, alimentada pelas linhas do mês que a página já tem.

**Architecture:** A `TransacoesTabela` troca o tipo `TelaDeTransacoes` por um contrato estreito `FonteDaTabela` (Transações segue passando o `tela`). O detalhe monta uma fonte em memória (`useLancamentosDaCategoria`) que filtra, ordena e pagina no cliente com funções puras que espelham o `aplicarFiltros` do banco. Detalhe, edição e exclusão seguem nos diálogos que a página já monta pelo controlador.

**Tech Stack:** Next.js (App Router, ver `node_modules/next/dist/docs/`), React, TanStack Query, `DataTable` (TanStack Table), Vitest (testes puros e de fonte com `@/test/fonte`; não há Testing Library).

**Spec:** `docs/superpowers/specs/2026-11-24-lancamentos-da-categoria-design.md`

## Global Constraints

- Só peças do design system atual; nenhuma `TransactionsTable`, `TransactionsToolbar` nem `TransactionsActiveFiltersChips` no detalhe da categoria.
- Nenhum componente declarado em `src/app/`.
- Transações (`src/app/(app)/transactions/page-client.tsx`) não muda de comportamento.
- A lista usa as mesmas linhas do total da página: despesa = `expenseMonthRows`; receita = `bundle.txs`.
- Campos da `FilterBar` no detalhe: os de `useCamposDeFiltro(tipo)` menos `categoria` e `periodo`.
- O dev usa o banco de produção: conferir sem salvar nem excluir.
- Textos em português; rótulo do bloco segue "Lançamentos do mês".
- Ao fim de cada task: `npx tsc --noEmit && npm run lint && npm run test:unit`.
- Depois de mexer em código: `graphify update .`.

## Review Focus

1. Trocar de mês com filtro ligado → o filtro e a página zeram (Task 3, `estadoDoMes`).
2. Filtro sem resultado no telefone → a barra do bloco continua à vista e "Editar filtros" abre o "+ Filtro" dela (Task 2, teste de fonte).
3. Linha projetada (`isProjectedTransactionRow`) → nunca entra em seleção nem abre detalhe; o filtro "conferir" e o de valor não a quebram (Task 1, teste).
4. Mês sem nenhum lançamento na categoria e sem filtro → "Nenhum lançamento em <mês>", não "Nenhum lançamento com esses filtros" (Task 4, teste de fonte).
5. "Ver Abastecimento" com outro filtro já ligado → o token `descricao` substitui o `descricao` anterior e mantém os outros (Task 3, `comDescricao`).

---

### Task 1: Filtro, ordem e página em memória

**Files:**
- Create: `src/lib/transactions/filtrar-na-memoria.ts`
- Test: `src/lib/transactions/filtrar-na-memoria.test.ts`

**Interfaces:**
- Consumes: `EstadoDaLista`, `PARCELADAS_TODAS`, `SEM_CATEGORIA` de `@/lib/transactions/filtros`; `approxRange` de `@/components/ui/filter-bar`; `PAGE_SIZE` de `@/lib/queries/fetch-transactions-list-page`.
- Produces:
  - `filtrarNaMemoria(linhas: Transaction[], estado: Pick<EstadoDaLista, "type" | "q" | "filtros">): Transaction[]`
  - `ordenarNaMemoria(linhas: Transaction[], sort: EstadoDaLista["sort"]): Transaction[]` (cópia; não muta)
  - `paginarNaMemoria(linhas: Transaction[], page: number): Transaction[]` (page 1-based, `PAGE_SIZE`)

- [ ] **Step 1: Write the failing tests** — `describe("filtrarNaMemoria")`, um `it` por campo, mesma semântica do `aplicarFiltros` (`src/lib/queries/transacoes-filtradas.ts:36-118`):

```ts
const tx = (p: Partial<Transaction>) => ({ id: p.id ?? "x", type: "expense", amount: 10, date: "2026-11-07", created_at: "2026-11-07T10:00:00Z", ...p }) as Transaction
const f = (field: string, operator: string, values: string[]) => ({ field, operator, values }) as FilterValue

it("descricao: contém, sem diferenciar caixa (como o ilike)", () => {
  const l = [tx({ id: "a", description: "Abastecimento" }), tx({ id: "b", description: "Seguro" })]
  expect(filtrarNaMemoria(l, { type: "all", q: "", filtros: [f("descricao", "is", ["abast"])] }).map((t) => t.id)).toEqual(["a"])
})
it("q também filtra a descrição", ...)                         // q: "seg" → ["b"]
it("type diferente de all filtra o tipo", ...)
it("valor: lte, gte, between, eq e approx (approxRange)", ...)   // values "100" / "100","300"
it("pagamento, cartao, pessoa, pagou, projeto: é e não é", ...)   // colunas payment_method, payment_credit_card_id, user_id, paid_by, project_id
it("conferir: só needs_review", ...)
it("parcelada: Todas, ids, e não é", ...)                        // PARCELADAS_TODAS; não é + ids mantém as sem parcela
it("recorrente e assinatura", ...)                               // is_recurring; subscription_id === values[0]
it("periodo e categoria são ignorados (a página fixa os dois)", ...)
it("linha projetada passa pelos filtros sem quebrar", ...)        // id com PROJECTED_TRANSACTION_ID_PREFIX, campos nulos
describe("ordenarNaMemoria", () => {
  it("data desc desempata por created_at e id", ...)
  it("valor asc e desc", ...)
  it("não muta a entrada", ...)
})
describe("paginarNaMemoria", () => {
  it("fatia PAGE_SIZE na página 1-based", ...)
})
```

- [ ] **Step 2: Run** `npx vitest run src/lib/transactions/filtrar-na-memoria.test.ts` — Expected: FAIL (module not found).
- [ ] **Step 3: Implement** as três funções. Valores do `FilterBar` são decimais com ponto (`Number(v)`); `amount` compara cru, como o banco. Desempate da data: `date`, depois `created_at`, depois `id`, no mesmo sentido.
- [ ] **Step 4: Run** the test — Expected: PASS.
- [ ] **Step 5: Commit** `feat(transacoes): filtro, ordem e página em memória com a regra do banco`

---

### Task 2: `TransacoesTabela` com contrato estreito

**Files:**
- Modify: `src/components/transactions/transacoes-tabela.tsx` (tipo de props, L86-L98; corpo L397-L713)
- Test: `src/components/transactions/transacoes-tabela.test.ts`

**Interfaces:**
- Produces (exportados de `transacoes-tabela.tsx`):

```ts
export type FonteDaTabela = {
  estado: EstadoDaLista
  setEstado: (patch: Partial<EstadoDaLista>) => void
  pagina: { transactions: Transaction[]; totalCount: number; isLoading: boolean; isFetching: boolean; error: unknown; refetch: () => unknown }
  workspaceAux?: { invoicePayments?: InvoicePaymentRow[]; workspaceHasTransactions?: boolean } | null
  categories: Category[]
  detalhe: { abrir: (t: Transaction, o?: { editar?: boolean }) => void }
  invalidar: () => Promise<unknown>
  pedidosDeAbertura?: { setImportar: (aberto: boolean) => void }
}
```
  (Use os tipos reais que `useTransacoesDaTela` devolve; o requisito é `TelaDeTransacoes` ser atribuível a `FonteDaTabela` sem cast.)
- Novas props de `TransacoesTabelaProps`: `tela: FonteDaTabela` · `id?: string` (padrão `"transactions"`) · `ariaLabel?: string` (padrão `"Transações"`) · `semCategoria?: boolean` (tira a coluna só-telefone `categoria`) · `filtroNaBarra?: boolean` (não aplica `max-md:hidden` à barra no vazio por filtro) · `onEditarFiltros?: () => void` (vence o `usePageChromeFilterFor`) · `vazio?: React.ReactNode` (vence o vazio padrão quando não há filtro nem busca).
- Sem `tela.pedidosDeAbertura`, o vazio "Seu primeiro lançamento" não mostra "Importar extrato".

- [ ] **Step 1: Write the failing tests** (de fonte, com `lerFonte`/`semComentarios`):

```ts
it("a tabela lê a FonteDaTabela, não a TelaDeTransacoes", () => {
  const src = semComentarios(lerFonte("src/components/transactions/transacoes-tabela.tsx"))
  expect(src).toMatch(/export type FonteDaTabela/)
  expect(src).not.toMatch(/tela:\s*TelaDeTransacoes/)
})
it("filtroNaBarra segura a barra à vista no vazio por filtro", ...)   // a classe max-md:hidden depende de !filtroNaBarra
it("onEditarFiltros vence o filtro publicado no cabeçalho", ...)
```
  E um teste de tipo: `expectTypeOf<TelaDeTransacoes>().toMatchTypeOf<FonteDaTabela>()`.
- [ ] **Step 2: Run** `npx vitest run src/components/transactions/transacoes-tabela.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** o tipo e as props. Nada muda quando as props novas não vêm.
- [ ] **Step 4: Run** the test + `npx tsc --noEmit` — Expected: PASS, sem erro em `transactions/page-client.tsx`.
- [ ] **Step 5: Commit** `refactor(transacoes): a tabela aceita qualquer fonte com o contrato dela`

---

### Task 3: Fonte da categoria

**Files:**
- Create: `src/components/categories/detail/use-lancamentos-da-categoria.ts`
- Create: `src/components/categories/detail/lancamentos-da-categoria-regras.ts`
- Test: `src/components/categories/detail/lancamentos-da-categoria-regras.test.ts`

**Interfaces:**
- Consumes: Task 1 (as três funções); Task 2 (`FonteDaTabela`); `useCamposDeFiltro`; `escreverFiltrosNaUrl`; `invalidateWorkspaceData`.
- Produces (regras puras):
  - `estadoDoMes(): EstadoDaLista` → `{ type: "all", q: "", filtros: [], sort: { key: "date", dir: "desc" }, page: 1 }`
  - `comDescricao(filtros: FilterValue[], nome: string): FilterValue[]` → tira todo `descricao` e põe `{ field: "descricao", operator: "is", values: [nome] }` no fim.
  - `camposDaCategoria(campos: FilterField[]): FilterField[]` → sem `categoria` e `periodo`.
  - `hrefDeTransacoes(o: { categoryId: string; yearMonth: string; tipo: "income" | "expense"; filtros: FilterValue[] }): string` → `/transactions?type=<tipo>&f=periodo:is:<AAAA-MM-01>:<AAAA-MM-último>,categoria:is:<id>,<filtros>` pelo `escreverFiltrosNaUrl` (mesmo formato do link de "Quem gastou", `docs/JORNADAS.md` seção 9).
- Produces (hook):

```ts
export function useLancamentosDaCategoria(o: {
  linhas: Transaction[]          // expenseMonthRows ou bundle.txs
  tipo: "income" | "expense"
  yearMonth: string
  carregando: boolean
  categories: Category[]
  invoicePayments: InvoicePaymentRow[]
  abrirDetalhe: (t: Transaction, o?: { editar?: boolean }) => void
}): {
  fonte: FonteDaTabela
  campos: FilterField[]
  filtrarPorDescricao: (nome: string) => void   // comDescricao + page 1
  ordenarPorValor: () => void                   // sort amount desc + page 1
}
```
  Estado local com `useState(estadoDoMes)`; volta a `estadoDoMes()` quando `yearMonth` muda. `pagina.transactions` = paginar(ordenar(filtrar(linhas))); `totalCount` = filtradas.length; `isFetching` false; `error` null. `invalidar` = `invalidateWorkspaceData(queryClient, ws, { domains: ["transactions"] })` (já recarrega o pacote da categoria). `workspaceHasTransactions: true` (o vazio do mês é do bloco, Task 4).

- [ ] **Step 1: Write the failing tests** para `estadoDoMes`, `comDescricao` (substitui o anterior e mantém `valor`), `camposDaCategoria` e `hrefDeTransacoes` (nov/2026 → `periodo:is:2026-11-01:2026-11-30`; fevereiro bissexto não, 2026 → `2026-02-28`; filtros da lista entram depois de `categoria`).
- [ ] **Step 2: Run** `npx vitest run src/components/categories/detail/lancamentos-da-categoria-regras.test.ts` — FAIL.
- [ ] **Step 3: Implement** regras e hook.
- [ ] **Step 4: Run** — PASS; `npx tsc --noEmit` limpo.
- [ ] **Step 5: Commit** `feat(categoria): fonte dos lançamentos do mês em memória`

---

### Task 4: O bloco na tela e quem mexe nele

**Files:**
- Modify (reescrita): `src/components/categories/detail/category-embedded-transactions.tsx`
- Modify: `src/app/(app)/categories/[categoryId]/page-client.tsx` (L221-L237 controlador; L540-L584 `onAcaoDoInsight`; L740-L750 `onVer`; L778-L784 o bloco)
- Test: `src/components/categories/detail/category-embedded-transactions.test.ts` (novo, de fonte)

**Interfaces:**
- Consumes: Tasks 2 e 3.
- `CategoryEmbeddedTransactions` novas props: `{ categoryId: string; categoryName: string; categoryType: "income" | "expense"; yearMonth: string; linhas: Transaction[]; carregando: boolean; controller: ReturnType<typeof useTransactionsListController>; lancamentos: ReturnType<typeof useLancamentosDaCategoria> }`. O hook roda no `page-client` (ele precisa de `filtrarPorDescricao`/`ordenarPorValor`) e desce pronto.
- `LANCAMENTOS_DO_MES_ID` continua exportado.

- [ ] **Step 1: Write the failing source tests:**

```ts
const src = semComentarios(lerFonte("src/components/categories/detail/category-embedded-transactions.tsx"))
it("usa a TransacoesTabela e nenhuma peça antiga", () => {
  expect(src).toMatch(/<TransacoesTabela/)
  for (const velho of ["TransactionsTable", "TransactionsToolbar", "TransactionsActiveFiltersChips", "forma"]) expect(src).not.toMatch(new RegExp(`\\b${velho}\\b`))
})
it("a barra fica à vista e o vazio do mês é do bloco", () => {
  expect(src).toMatch(/filtroNaBarra/)
  expect(src).toMatch(/semCategoria/)
  expect(src).toMatch(/Nenhum lançamento em/)
})
```
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** o bloco:
  - `<section id={LANCAMENTOS_DO_MES_ID} aria-label="Lançamentos do mês">` com a `TransacoesTabela` (`id="lancamentos-da-categoria"`, `ariaLabel={\`Lançamentos de ${categoryName}\`}`, `semCategoria`, `filtroNaBarra`, `membros` de `useMemberDirectoryQuery`, `divide` pelo `split_mode`, `onEditar={(t) => controller.openTransactionDetail(t, { edit: true })}`, `onExcluir={(ids) => controller.setPendingDelete({ mode: "bulk", ids })}` — ou `single` com um id).
  - `barra`: o rótulo "Lançamentos do mês" (`text-2xs font-medium uppercase tracking-wide text-muted-foreground`, como hoje), a `FilterBar` (`fields={campos}`, `value={fonte.estado.filtros}`, `onValueChange`, `count`, `noun={["lançamento","lançamentos"]}`, `overflow="menu"`) num `ref` para `onEditarFiltros` clicar o `[data-slot=filter-bar-add]` (o mesmo atalho do `transacoes-toolbar.tsx:47-51`), e `<Button asChild variant="secondary"><Link href={hrefDeTransacoes(...)}>Ver em Transações</Link></Button>` com o `ArrowTopRightOnSquareIcon`.
  - `vazio`: `EmptyState` "Nenhum lançamento em <mês por extenso>" com `Button variant="secondary"` "Nova transação" → `controller.openDialog()`.
  - Ficam: `TransactionDetailSheet`, `TransactionFormDialog`, `ExcluirLancamentosDialog` (o `bulk` acha as linhas em `linhas`, não mais em `displayTransactions`).
  - Saem do arquivo todo o estado de filtro antigo, a forma `lista`, `PAGE_SIZE` local e imports mortos.
- [ ] **Step 4: Implement** no `page-client`: `skipListQuery: true`; `useLancamentosDaCategoria` com `linhas = category.type === "expense" ? expenseMonthRows ?? [] : txs`; `onVer` e o `case "filtrar"` chamam `lancamentos.filtrarPorDescricao(nome)` + `rolarParaLancamentos()`; `case "ordenar-por-valor"` chama `lancamentos.ordenarPorValor()` + rolar. Sai a desestruturação `setFilterDescriptionQuery, setSortKey, setSortDir, setPage`.
- [ ] **Step 5: Run** testes + `npx tsc --noEmit && npm run lint && npm run test:unit` + `npm run ds:audit -- src/components/categories/detail/category-embedded-transactions.tsx` — PASS, sem violação nova.
- [ ] **Step 6: Conferir no navegador** (dev em :3000, `dev-attach`): `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`, desktop e 375px — a lista por dia com total, sem colunas Categoria/Tipo; filtro de valor reduz e a contagem acompanha; "Ver Abastecimento" da Leitura filtra e rola; clicar na linha abre o detalhe; o link "Ver em Transações" abre Transações com mês e categoria. Não salvar nem excluir. Uma categoria de receita também abre.
- [ ] **Step 7: Commit** `feat(categoria): os lançamentos do mês com a tabela de Transações`

---

### Task 5: Documentos e limpeza

**Files:**
- Modify: `docs/JORNADAS.md` (seção 9: aresta `phoneTabs -->|"Ver em Transações"|` passa a `/transactions?type=…&f=periodo:is:…,categoria:is:<id>`; linha "Detalhe" descreve a tabela de Transações e os filtros)
- Modify: `docs/atlas/template.html` (a mesma jornada, data e contagens da capa)
- Modify: `AGENTS.md` (a frase "No detalhe da categoria o mês leva o cabeçalho, e o filtro dos lançamentos fica na barra (`TransactionsToolbar headerFilter={false}`)" passa a dizer `FilterBar` do bloco, com `filtroNaBarra`)
- Possível Delete: arquivos que ficarem sem importador — conferir cada um com `grep -rn "<nome>" src` antes. `TransactionsTable` **fica** (o Painel ainda usa).

- [ ] **Step 1:** Atualizar os três documentos.
- [ ] **Step 2:** `python3 docs/atlas/build.py` — gera `docs/atlas/atlas-jornadas.html` sem erro.
- [ ] **Step 3:** `graphify update .`
- [ ] **Step 4: Commit** `docs(jornadas): lançamentos da categoria com a tabela de Transações`
- [ ] **Step 5:** Republicar `docs/atlas/atlas-jornadas.html` no URL do Atlas (https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL) com a ferramenta de Artifact — feito pela sessão principal, não pelo subagente.
