# Cartões de Categorias (B2·b) — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** trocar os cartões da tela Categorias pelo desenho B2·b. Cada cartão mostra:
- total e variação contra o mês anterior;
- lançado + previsto;
- faísca de 6 meses na cor da categoria, com a média tracejada;
- barra com o previsto tracejado e o ritmo;
- frase de estado.

**Architecture:** o design system ganha duas props autorizadas: `Progress.projected` e `ChartSparkline.reference`. A lógica de texto e números mora em funções puras (`lib/categoria-situacao.ts`). A série de 6 meses vem de um hook com React Query, que não bloqueia a tela. Os cartões só recebem números prontos; a página faz a ligação.

**Tech Stack:** Next.js (ler `node_modules/next/dist/docs/` antes de mexer em rota), React 19, TanStack Query, Recharts (por `chart.tsx`), Radix Progress, Tailwind v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-18-lista-de-categorias-design.md`

## Global Constraints

- **`src/components/ui/`:** só `progress.tsx` e `chart.tsx` mudam, e `globals.css` só se o tracejado pedir `@utility`. Isso foi autorizado pelo dono; o resto de `ui/` não muda.
- **Tokens:** nenhum `#hex`, `rgb()` nem classe crua da paleta (`text-green-600`). A tinta da média é `--color-muted-foreground`.
- **Dinheiro:** sempre com `currencyBRL` (`@/lib/formatters`).
- **Cor da categoria:** passa por `tileColorFor(category.color) ?? TILE_EXPENSE_DEFAULT` na despesa e `?? TILE_INCOME_DEFAULT` na receita. Ela só pinta traço e área da faísca, nunca fica sob texto.
- **Textos exatos:**
  - variação: `↑ N% vs out.`, `↓ N% vs out.`, `= out.`, `novo`;
  - previsto da despesa: `R$ X lançado + R$ Y previsto`; da receita: `R$ X recebido + R$ Y previsto`;
  - frase com limite: `R$ X acima do limite de R$ Y`, `Faltam R$ X de R$ Y · acima do ritmo`, `Faltam R$ X de R$ Y · no ritmo`;
  - frase sem limite: `N% das despesas do mês`, `N% das receitas do mês`;
  - grade: `N categorias com gasto em <mês>`, `Sem gasto em <mês>: A, B`, `Sem receita em <mês>: A, B`, `Nenhum gasto em <mês>`.
- **Estável:** a variação é "estável" com ±5% (`isMomFlat`). "Acima do ritmo" é a fração gasta passar o ritmo em mais de 10 pontos.
- **Ritmo:** no mês atual, dia de hoje ÷ dias do mês × 100; em mês passado, 100; em mês futuro, nenhum.
- **Média:** a dos 5 meses anteriores, com os meses sem gasto contando como 0.
- **Faísca:** `variant="area"`, altura entre 32 e 44px.
- **Ordenação:** `Maior gasto` · `Nome` · `Variação`. Abre em Maior gasto e fica só em memória.
- **Grade:** 3 colunas no `xl`, 2 no `md`, 1 no telefone.
- **Escrita:** o ⋯ e o menu de contexto só aparecem com `podeEscrever`.
- **Commit:** cada task termina com `npx tsc --noEmit`, `npm run lint` e os testes da task verdes, depois um commit.
- **Ao fim de cada task que mexe em código, rodar `graphify update .`.**
- **Não commitar** `src/components/categories/categories-toolbar.tsx` nem `month-nav.test.ts`: é o teste do botão do mês sem fundo, que o dono ainda não decidiu.

## Review Focus

1. **Mês com gasto negativo** (estorno maior que as compras): o total, a barra e a variação leem como zero; nada de `-R$` nem `NaN%`. Teste na Task 3.
2. **Total do mês zero na aba** (a frase de participação divide por zero): sai `0% das despesas do mês`. Teste na Task 3.
3. **Previsto que passa do limite com lançado abaixo dele:** o tracejado para no fim do trilho, a pastilha de excesso aparece e o tom é de perigo. Teste na Task 1.
4. **Série ainda carregando ou com erro:** o cartão mostra o esqueleto da faísca e o resto inteiro, sem quebrar. Teste na Task 5.
5. **Categoria sem nenhum histórico** (média 0): não há linha de média, porque `reference` 0 ou ausente não desenha. Teste na Task 2.

---

### Task 1: `Progress` ganha `projected`

**Files:**
- Modify: `src/components/ui/progress.tsx`
- Modify: `src/app/designsystem/docs/progress.tsx` (exemplo + interruptor "Previsto")
- Modify: `src/components/ui/progress.test.ts`, `src/components/ui/progress-versions.test.ts`
- Modify: `AGENTS.md`: no bullet do `Progress`, acrescentar "`projected` é o trecho tracejado do previsto, depois do cheio, e o tom e a pastilha contam o total".
- Modify, se precisar: `src/app/globals.css` (`@utility progress-projected` com o `repeating-linear-gradient` de `currentColor`).

**Interfaces:**
- Produces: `Progress` aceita `projected?: number` (na unidade do `value`). O ramo `variant: "brand"` declara `projected?: never`. A prop é ignorada em tempo de execução com `segments`, `zones` e `brand`.

- [ ] **Step 1: escrever os testes** (em `progress.test.ts`, com `renderToStaticMarkup` como os de `marker`):
  - `"desenha o previsto depois do cheio"`: com `{ value: 60, max: 100, projected: 20 }`, o HTML contém `data-slot="progress-projected"`, `left:\s*60%` e `width:\s*20%`.
  - `"o previsto para no fim do trilho"`: com `{ value: 90, max: 100, projected: 40, bands: [85, 100] }`, o resultado tem largura `10%`, `data-tone="destructive"` e `data-slot="progress-over"`.
  - `"sem tracejado com o cheio no teto"`: com `{ value: 120, max: 100, projected: 10 }`, não aparece `progress-projected`.
  - `"ignora com segments e zones"`: com `{ value: 2, max: 5, segments: 5, projected: 1 }`, e também com `{ value: 50, bands: [85,100], zones: true, projected: 10 }`, não aparece `progress-projected`.
  - `"aria-valuetext diz lançado e previsto"`: com `{ value: 60, max: 100, projected: 20 }`, o HTML contém `aria-valuetext="60% lançado, mais 20% previsto"`.
  - Em `progress-versions.test.ts`: a fonte de `docs/progress.tsx` contém `projected`.
- [ ] **Step 2:** rodar `npx vitest run src/components/ui/progress` e ver os testes novos falharem.
- [ ] **Step 3: implementar.** O tracejado é um `<span data-slot="progress-projected" aria-hidden>`, absoluto e na tinta do tom (`currentColor` do indicador, com `text-*` correspondente ao `TOM_FUNDO`). Ele fica antes da cesura e do marcador no DOM.
  - `total = value + (projected ?? 0)`.
  - `excedeu` e `bruto` da pastilha passam a ler `total`.
  - O tom com `bands` sai de `progressToneForBands(totalPct, bands)`, e o estouro (`total > max`) dá `destructive`.
  - O indicador continua medindo só `value`.
  - Com `projected > 0`, o `aria-valuetext` é `` `${round(value/max*100)}% lançado, mais ${round(min(projected, max-value)/max*100)}% previsto` ``. Quando também excede, vale o mesmo texto.
- [ ] **Step 4:** rodar `npx vitest run src/components/ui/progress` (PASS) e `npm run ds:audit -- src/components/ui/progress.tsx` (sem regra nova reprovando).
- [ ] **Step 5:** na página do catálogo, acrescentar um `Interruptores` "Previsto" no mostrador e um exemplo "Orçamento com previsto". O exemplo usa `value={1180} projected={220} max={1500} bands={BUDGET_BANDS} marker={63}`.
- [ ] **Step 6:** commit `feat(progress): projected, o trecho tracejado do previsto`.

### Task 2: `ChartSparkline` ganha `reference`

**Files:**
- Modify: `src/components/ui/chart.tsx` (`ChartSparkline`, ~l.3098)
- Modify: `src/app/designsystem/docs/chart.tsx` (exemplo da faísca com média e cor própria)
- Modify: `src/components/ui/chart-versions.test.ts`
- Modify: `AGENTS.md`, bullet do `Chart`: "`ChartSparkline reference` é a linha tracejada da média, em `--color-muted-foreground`, atrás da série. A faísca de Categorias pinta na cor da categoria (`tileColorFor`), a exceção do dono à cor da pessoa só no ladrilho: só traço e área, nunca sob texto."

**Interfaces:**
- Produces: `ChartSparkline` aceita `reference?: number` (na unidade de `y`). Ela desenha só quando é finita e maior que 0, nas variantes `line` e `area`.

- [ ] **Step 1: escrever os testes** (de fonte, como os vizinhos de `chart-versions.test.ts`, com `lerFonte`/`semComentarios`):
  - `"reference: a média tracejada da faísca"`: o trecho de `function ChartSparkline(` contém `reference?: number`, `<ReferenceLine`, `strokeDasharray` e `var(--color-muted-foreground)`.
  - `"a linha da média vem antes da série"`: no trecho, o índice de `<ReferenceLine` é menor que o de `<Area` e o de `<Line`.
  - `"zero ou ausente não desenha"`: o trecho contém uma guarda com `Number.isFinite(reference)` e `reference > 0`.
  - A página `docs/chart.tsx` contém `reference=`.
- [ ] **Step 2:** rodar `npx vitest run src/components/ui/chart-versions.test.ts` e ver FAIL.
- [ ] **Step 3: implementar.**
  - `<ReferenceLine y={reference} stroke="var(--color-muted-foreground)" strokeDasharray="4 4" strokeWidth={1} ifOverflow="extendDomain" />`, primeiro filho dentro de `AreaChart` e `LineChart`, só com a guarda.
  - Na variante `bars`, a prop é ignorada.
  - Importar `ReferenceLine` de `recharts`, como os outros imports do arquivo.
- [ ] **Step 4:** rodar `npx vitest run src/components/ui/chart` (PASS) e `npm run ds:audit -- src/components/ui/chart.tsx`.
- [ ] **Step 5:** no catálogo, acrescentar o exemplo "Com a média". Ele usa `variant="area"`, `reference` com a média dos 5 primeiros pontos e `config` com `color: "var(--chart-2)"`.
- [ ] **Step 6:** commit `feat(chart): reference na faísca, a média tracejada`.

### Task 3: funções puras da situação

**Files:**
- Create: `src/lib/categoria-situacao.ts`
- Create: `src/lib/categoria-situacao.test.ts`

**Interfaces:**
- Produces (exatos):
  ```ts
  export type Variacao =
    | { kind: "up" | "down"; pct: number }
    | { kind: "flat" | "novo" | "nenhum" }
  export function variacaoDoMes(atual: number, anterior: number): Variacao
  export function rotuloDaVariacao(v: Variacao, anteriorYm: string): string | null
  export function ritmoDoMes(ym: string, hojeYmd: string): number | null
  export type Situacao = { texto: string; tom: "neutro" | "aviso" | "perigo" }
  export function situacaoDaDespesa(a: {
    total: number; limite: number; totalDoMes: number; ritmo: number | null
  }): Situacao
  export function participacao(total: number, totalDoMes: number, tipo: "expense" | "income"): string
  export function mediaDosMeses(valores: number[]): number
  export type CriterioDeOrdem = "maior" | "nome" | "variacao"
  export function ordenarCategorias<T extends { nome: string; total: number; anterior: number }>(
    itens: T[], criterio: CriterioDeOrdem,
  ): T[]
  ```

- [ ] **Step 1: escrever os testes** em `categoria-situacao.test.ts`:
  - **`variacaoDoMes`:**
    - `(1200, 1000)` → `{kind:"up", pct:20}`;
    - `(800, 1000)` → `{kind:"down", pct:20}`;
    - `(1040, 1000)` → `{kind:"flat"}`;
    - `(300, 0)` → `{kind:"novo"}`;
    - `(0, 0)` → `{kind:"nenhum"}`;
    - `(-50, 100)` → `{kind:"down", pct:100}`, porque o negativo vale zero.
  - **`rotuloDaVariacao`** com `"2026-10"`:
    - up 20 → `"↑ 20% vs out."`;
    - down 8 → `"↓ 8% vs out."`;
    - flat → `"= out."`;
    - novo → `"novo"`;
    - nenhum → `null`.
  - **`ritmoDoMes`:**
    - `("2026-11", "2026-11-15")` → `50`;
    - `("2026-10", "2026-11-15")` → `100`;
    - `("2026-12", "2026-11-15")` → `null`.
  - **`situacaoDaDespesa`:**
    - `{total:1752.78, limite:1500, totalDoMes:5000, ritmo:60}` → texto `"R$ 252,78 acima do limite de R$ 1.500,00"`, tom `"perigo"`;
    - `{total:900, limite:1000, totalDoMes:5000, ritmo:50}` → `"Faltam R$ 100,00 de R$ 1.000,00 · acima do ritmo"`, `"aviso"`;
    - `{total:550, limite:1000, totalDoMes:5000, ritmo:50}` → `"Faltam R$ 450,00 de R$ 1.000,00 · no ritmo"`, `"neutro"`;
    - `{total:550, limite:1000, totalDoMes:5000, ritmo:null}` → `"Faltam R$ 450,00 de R$ 1.000,00"`, `"neutro"`;
    - `{total:500, limite:0, totalDoMes:2000, ritmo:50}` → `"25% das despesas do mês"`, `"neutro"`.
    - Os valores com `R$` usam `currencyBRL`; se o helper usar espaço não separável, o teste compara por `currencyBRL(x)`.
  - **`participacao`:**
    - `(500, 0, "expense")` → `"0% das despesas do mês"`;
    - `(-20, 100, "expense")` → `"0% das despesas do mês"`;
    - `(250, 1000, "income")` → `"25% das receitas do mês"`.
  - **`mediaDosMeses`:** `([100, 0, 200, 0, 200])` → `100`; `([])` → `0`.
  - **`ordenarCategorias`:**
    - `"maior"` ordena por `total` decrescente;
    - `"nome"` usa `localeCompare` pt-BR, com "Água" antes de "Banco";
    - `"variacao"` ordena por `total - anterior` decrescente;
    - empate mantém a ordem de entrada.
- [ ] **Step 2:** rodar `npx vitest run src/lib/categoria-situacao.test.ts` e ver FAIL (módulo não existe).
- [ ] **Step 3: implementar.**
  - Valores negativos são limitados a 0 antes de qualquer conta.
  - "Estável" é `|Δ|/anterior ≤ 0,05`: mover `isMomFlat` do cartão para cá e exportar.
  - O mês do rótulo é `formatMonthShortPtBr(new Date(ano, mes-1, 1))` + `"."`.
  - O ritmo usa `Math.round`.
  - "Acima do ritmo" é `total/limite*100 > ritmo + 10`.
- [ ] **Step 4:** rodar `npx vitest run src/lib/categoria-situacao.test.ts` (PASS).
- [ ] **Step 5:** commit `feat(categorias): as contas da situação do cartão`.

### Task 4: a série de 6 meses

**Files:**
- Create: `src/hooks/use-serie-das-categorias.ts`
- Create: `src/hooks/use-serie-das-categorias.test.ts`

**Interfaces:**
- Consumes: `buildMonthlySeries` (`src/components/categories/detail/category-detail-utils.ts`), `shiftYearMonth` e `periodBoundsFromYearMonth` (os mesmos imports da `page-client.tsx`).
- Produces:
  ```ts
  /** Os 5 meses anteriores a `ym`, do mais antigo ao mais novo, por categoria. */
  export function historicoPorCategoria(a: {
    ym: string
    txs: Pick<Transaction, "date"|"amount"|"type"|"category_id"|"payment_method"|"payment_credit_card_id">[]
    creditCards: { id: string; closing_day: number }[]
    categorias: { id: string; type: "income" | "expense" }[]
  }): Record<string, number[]>
  export function useSerieDasCategorias(
    workspaceId: string | null, ym: string, categorias: { id: string; type: "income" | "expense" }[],
  ): { historico: Record<string, number[]> | undefined }
  ```

- [ ] **Step 1: escrever o teste de `historicoPorCategoria`.**
  - Entrada, com `ym: "2026-11"`:
    - uma despesa de 100 em `2026-06-10` na categoria `a`;
    - uma de 50 em `2026-10-03` em `a`;
    - uma receita de 300 em `2026-09-01` na categoria `r`;
    - uma de 999 em `2026-11-02` em `a`.
  - Esperado: `a` → `[100, 0, 0, 0, 50]` (o mês da tela fica fora) e `r` → `[0, 0, 0, 300, 0]`.
- [ ] **Step 2:** rodar `npx vitest run src/hooks/use-serie-das-categorias.test.ts` e ver FAIL.
- [ ] **Step 3: implementar `historicoPorCategoria`.** É `buildMonthlySeries(shiftYearMonth(ym, -1), txs, id, type, 5, creditCards).map(p => Math.max(0, p.total))` para cada categoria.
- [ ] **Step 4: implementar o hook com `useQuery`.**
  - Chave: `["categorias-serie", workspaceId, ym]`.
  - `enabled`: só com `workspaceId`.
  - `staleTime`: `60_000`.
  - O `queryFn` busca em paralelo:
    - `transactions`: colunas `type,amount,date,category_id,payment_method,payment_credit_card_id`, com `.in("type", ["expense","income"])`, de `period_start` de `shiftYearMonth(ym,-6)` (um mês a mais para a atribuição por fechamento) até `period_end` de `shiftYearMonth(ym,-1)`;
    - `credit_cards`: colunas `id, closing_day`.
  - Os dois por `workspace_id`.
  - Devolve as linhas.
  - O `select` (ou um `useMemo`) aplica `historicoPorCategoria`.
  - Com erro: `historico` fica `undefined` e `console.error`, sem toast.
- [ ] **Step 5:** rodar o teste (PASS), depois `npx tsc --noEmit`.
- [ ] **Step 6:** commit `feat(categorias): a série dos 5 meses anteriores, sem segurar a tela`.

### Task 5: o cartão de despesa B2·b

**Files:**
- Modify: `src/components/categories/expense-category-card.tsx` (reescrita)
- Modify: `src/components/categories/expense-category-card.test.ts`

**Interfaces:**
- Consumes: as Tasks 1, 2 e 3.
- Produces, com as props novas e as antigas `spent`, `spendRank`, `categoriesWithPositiveSpend` e `totalMonthSpend` removidas:
  ```ts
  export function ExpenseCategoryCard(props: {
    category: { id: string; name: string; icon: string | null; color: string | null }
    lancado: number; previsto: number; anterior: number
    limite: number; totalDoMes: number; maiorTotal: number
    ritmo: number | null; mesYm: string
    historico: number[] | undefined   // undefined = carregando
    href: string; onEdit?: () => void; onDelete?: () => void
  }): JSX.Element
  export function CategoryCardSkeleton(): JSX.Element // o osso do cartão novo, também para a receita
  ```

- [ ] **Step 1: reescrever os testes de fonte** (`lerFonte`/`semComentarios`), cobrando que o arquivo:
  - importa `ChartSparkline` e usa `reference=` e `variant="area"`;
  - usa `projected=` no `Progress`;
  - chama `situacaoDaDespesa`, `rotuloDaVariacao` e `tileColorFor`;
  - não contém `Ver categoria`, `Sem orçamento` nem `MomComparisonBadge`;
  - tem o ⋯ condicionado a `onEdit && onDelete` e com a classe que só mostra no cursor (`[@media(hover:hover)]:opacity-0` + `group-hover`/`focus-within`);
  - tem `historico === undefined` levando a `ChartSkeleton`.
  - Um teste de render (`renderToStaticMarkup`), com `historico={undefined}` e `lancado={-30}`, não contém `NaN` nem `-R$`.
- [ ] **Step 2:** rodar `npx vitest run src/components/categories/expense-category-card.test.ts` e ver FAIL.
- [ ] **Step 3: implementar, de cima para baixo, como no desenho.**
  - **Cabeçalho:** `ColorTile` + `CardTitle` com `CardLink asChild <Link href>`, e o ⋯ (`DropdownMenu` atual) em `CardAction`.
  - **Linha do valor:** `currencyBRL(max(0, lancado+previsto))` em `text-2xl font-bold tabular-nums`, com o rótulo da variação à direita em `text-xs font-medium`:
    - `up` → `text-expense`;
    - `down` → `text-income`;
    - `flat` e `novo` → `text-muted-foreground`;
    - `title` por extenso, como `"↑ 20% vs mês anterior"`.
  - **Linha do previsto:** `R$ X lançado + R$ Y previsto` em `text-xs text-muted-foreground`, só com `previsto > 0`.
  - **Faísca:**
    - `ChartSparkline variant="area" y="total" className="h-10"`;
    - `data = [...historico, total]`, cada ponto `{ name, total }`;
    - `reference = mediaDosMeses(historico)`;
    - `config = { total: { label: category.name, color } }`;
    - `label`: `Gasto em ${nome} nos últimos 6 meses`;
    - `description`: `de R$ min a R$ max; média R$ m`;
    - com `historico === undefined`, `ChartSkeleton` na mesma altura.
  - **Barra:**
    - com limite: `Progress size="sm" value={max(0,lancado)} projected={previsto} max={limite} bands={BUDGET_BANDS} marker={ritmo ?? undefined}`;
    - sem limite: `max={maiorTotal}`, sem `bands` nem `marker`;
    - `aria-label` com nome e frase.
  - **Frase:** `situacaoDaDespesa`. Tom `aviso` → `text-warning-muted-foreground`, `perigo` → `text-destructive`, neutro → `text-muted-foreground`. O texto vai em `<p className="text-xs">`.
  - **`CategoryCardContextMenu`** continua envolvendo o cartão, com `description={`${currencyBRL(total)} no mês`}`.
- [ ] **Step 4:** rodar o teste (PASS), `npm run ds:audit -- src/components/categories/expense-category-card.tsx` e `npx tsc --noEmit`. O tsc vai acusar a `page-client.tsx`, que a Task 7 conserta. Até lá, adaptar a chamada no mínimo para compilar, com os campos novos vindos dos mesmos estados.
- [ ] **Step 5:** commit `feat(categorias): o cartão de despesa com a faísca, o previsto e o ritmo`.

### Task 6: o cartão de receita B2·b

**Files:**
- Modify: `src/components/categories/income-category-card.tsx`
- Modify: `src/components/categories/income-category-card.test.ts`

**Interfaces:**
- Consumes: as Tasks 2, 3 e 5 (`CategoryCardSkeleton`).
- Produces:
  ```ts
  export function IncomeCategoryCard(props: {
    category: { id: string; name: string; icon: string | null; color: string | null }
    recebido: number; previsto: number; anterior: number
    totalDoMes: number; maiorTotal: number; mesYm: string
    historico: number[] | undefined
    href: string; onEdit?: () => void; onDelete?: () => void
  }): JSX.Element
  ```

- [ ] **Step 1: testes de fonte.** O arquivo:
  - usa `ChartSparkline` com `reference=`;
  - usa `Progress` com `projected=` e sem `bands`/`marker`;
  - chama `participacao(` com `"income"`;
  - leva a variação `up` a `text-income` e `down` a `text-expense`;
  - não contém `Ver categoria`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: implementar.** É a forma da Task 5, com estas diferenças:
  - a linha do previsto é `R$ X recebido + R$ Y previsto`;
  - a barra é `value={recebido} projected={previsto} max={maiorTotal}`;
  - a frase é `participacao(recebido+previsto, totalDoMes, "income")`;
  - o rótulo da faísca é `Receita em ${nome} nos últimos 6 meses`.
- [ ] **Step 4:** testes (PASS), `ds:audit` e `tsc`.
- [ ] **Step 5:** commit `feat(categorias): o cartão de receita na mesma forma`.

### Task 7: a grade, a ligação e o esqueleto

**Files:**
- Create: `src/components/categories/categorias-do-mes.tsx`, com `CategoriasDoMesCabecalho` e `SemMovimentoNoMes`
- Create: `src/components/categories/categorias-do-mes.test.ts`
- Modify: `src/app/(app)/categories/page-client.tsx` (grade das duas abas)
- Modify: `src/components/categories/categories-page-grid-skeleton.tsx` (usa `CategoryCardSkeleton`)
- Modify: `docs/JORNADAS.md` e `docs/atlas/template.html`, depois `python3 docs/atlas/build.py`

**Interfaces:**
- Consumes: as Tasks 3 a 6.
- Produces:
  ```ts
  export function CategoriasDoMesCabecalho(p: {
    quantidade: number; mesYm: string; tipo: "expense" | "income"
    criterio: CriterioDeOrdem; onCriterioChange: (c: CriterioDeOrdem) => void
  }): JSX.Element
  export function SemMovimentoNoMes(p: {
    categorias: { id: string; name: string; href: string }[]; mesYm: string; tipo: "expense" | "income"
  }): JSX.Element | null
  ```

- [ ] **Step 1: escrever os testes** com `renderToStaticMarkup`:
  - `CategoriasDoMesCabecalho` com `quantidade: 5, mesYm: "2026-11", tipo: "expense"` contém `5 categorias com gasto em novembro`. Na receita, `5 categorias com receita em novembro`. Com 1, o singular: `1 categoria com gasto em novembro`.
  - `SemMovimentoNoMes` com duas categorias contém `Sem gasto em novembro:` e dois `href` com os links. Vazio → `""`. Na receita, `Sem receita em novembro:`.
  - Na fonte da `page-client.tsx`: `useSerieDasCategorias(`, `ordenarCategorias(`, `<SemMovimentoNoMes`, `EmptyState` com `variant="stack"` e `Nenhum gasto em`; e não contém `spendRank`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: implementar os dois componentes.**
  - O cabeçalho é uma linha `flex items-center justify-between`, com o texto em `text-sm text-muted-foreground` e um `Select` (`SelectTrigger size="sm"`).
  - As opções do `Select` são `Maior gasto`/`Nome`/`Variação`; na receita, `Maior receita`.
  - O nome do mês vem de `formatYearMonthLongPtBr` ou do helper de mês por extenso que já exista em `transaction-date.ts`. Usar o que existir e escrever só o mês em minúscula, sem o ano no mesmo ano corrente. Na dúvida, mês + ano.
  - `SemMovimentoNoMes` é `<p className="text-sm text-muted-foreground">` com os nomes em `Link` separados por vírgula.
- [ ] **Step 4: ligar na `page-client.tsx`.**
  - `const [criterio, setCriterio] = useState<CriterioDeOrdem>("maior")`.
  - `const { historico } = useSerieDasCategorias(currentWorkspaceId, budgetMonthYm, categories)`.
  - O estado novo `prevIncomeByCategoryId` vem de `receitasDoMesPorCategoria` do `prevYm`, no mesmo `fetchBudgetsAndSpend`.
  - `ritmo = ritmoDoMes(budgetMonthYm, useHojeYmd())`.
  - Por aba, monta os itens `{ categoria, nome, total, anterior, ... }`, separa `total > 0` da lista de sem movimento e ordena com `ordenarCategorias`.
  - `maiorTotal` é o maior `total` da aba e `totalDoMes` é a soma.
  - A ordem do bloco é: `CategoriasDoMesCabecalho` → grade (`grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3`) → `SemMovimentoNoMes`.
  - Quando a aba tem categorias mas nenhuma com movimento, a grade vira `EmptyState variant="stack"` com `EmptyStateTitle` `Nenhum gasto em <mês>` (na receita, `Nenhuma receita em <mês>`), e o rodapé fica abaixo.
  - Os vazios "Nenhuma categoria de despesa/receita" e o de `categories.length === 0` ficam como estão.
- [ ] **Step 5:** o esqueleto da grade passa a usar `CategoryCardSkeleton`, no mesmo número de cartões de hoje.
- [ ] **Step 6: jornada.**
  - **Ruling:** o rodapé "Sem gasto" é link novo para `categoryDetailPath`, então conta como mudança de jornada.
  - Em `docs/JORNADAS.md`, seção Categorias, acrescentar o nó "rodapé Sem gasto → detalhe da categoria" ao fluxograma e uma linha à tabela de regras: a categoria sem movimento no mês sai da grade e vai ao rodapé.
  - No `docs/atlas/template.html`, a mesma explicação em "Como funciona" e a data da capa.
  - Rodar `python3 docs/atlas/build.py`.
  - A republicação do Atlas é do controlador, com a ferramenta de Artifact.
- [ ] **Step 7: verificar** com `npx tsc --noEmit && npm run lint && npm run test:unit` e `npm run ds:audit -- src/components/categories "src/app/(app)/categories"`.
- [ ] **Step 8:** `graphify update .` e commit `feat(categorias): a grade do mês com ordenação, o rodapé sem gasto e o vazio`.

### Verificação final (controlador)

- Abrir `/categories` na prévia (`preview_start` dev-attach ou dev-start):
  - desktop 1280 e 375px;
  - temas claro e escuro;
  - mês atual, um mês passado e um futuro.
- Conferir:
  - faísca com cor e média;
  - tracejado do previsto;
  - traço do ritmo só com limite;
  - o rodapé e a ordenação.
- Não gravar nada no banco: é produção.
- Republicar o Atlas no mesmo URL.
