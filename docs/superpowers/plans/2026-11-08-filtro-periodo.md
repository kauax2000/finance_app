# Filtro de período por unidade — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o editor de período do `FilterBar` ganha abas Dias · Meses · Ano, grade de meses em intervalo, resumo do intervalo e rótulo do token por unidade, com totais de despesa por mês na tela de transações.

**Architecture:** a conta pura de períodos (classificar, rotular, resumir) mora num arquivo novo de `lib/`; o `MonthGrid` (em `date-picker.tsx`) ganha `mode="range"` e `caption`; o `EditorDeValor` do `filter-bar.tsx` compõe `Tabs` + `Calendar` + `MonthGrid` + lista de anos; a tela de transações passa os totais pelo campo `period`.

**Tech Stack:** Next 16, React 19, TypeScript, Tailwind v4, Radix, react-day-picker, React Query, Supabase, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-08-filtro-periodo-design.md`

## Global Constraints

- Leia o `AGENTS.md` da raiz antes de escrever: design system, tokens, Heroicons, `Tabs` como trilho, nada de `isMobile` trocando árvore, nenhum componente novo em `src/components/ui/`.
- O valor do filtro continua `[atalho]` ou `[deYmd, ateYmd]`; `filterPeriodRange` continua a única tradução para a consulta. URLs antigas (`este-mes`, `mes-passado`, pares de datas) continuam abrindo.
- Grava ao vivo, nunca o incompleto (regra do `FilterBar`).
- O `DatePicker` e o `DATE_RANGE_PRESETS` não mudam.
- Não rode prettier (o estilo do repo não é o dele). Rode só `npx vitest run <arquivos>`, `npx tsc --noEmit`, `npx eslint <arquivos>`.
- O banco de desenvolvimento é produção: nada que grave dados.
- Componente alterado atualiza a página do catálogo e o `<comp>-versions.test.ts` na mesma mudança.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push.
- Hoje, nos testes, é 08/11/2026 (`vi.setSystemTime(new Date(2026, 10, 8, 12))`).

## Review Focus

1. Intervalo de meses atravessando o ano (nov/2025 a fev/2026): classificado como meses, rótulo "nov 2025 – fev 2026", aba Meses ao abrir. → Task 1 e Task 2.
2. Fevereiro e meses de 30 dias: "inteiro" exige o último dia certo (28/29/30/31). → Task 1.
3. Segundo toque num mês anterior à âncora: o intervalo sai ordenado. → Task 2.
4. URL antiga `periodo:is:este-mes` abre na aba Dias, rótulo "Este mês", sem botão aceso. → Task 3.
5. Totais cortados pelo teto: nenhum total aparece (nunca um total parcial). → Task 5.

---

## Mapa de arquivos

| Arquivo | Papel |
| --- | --- |
| `src/lib/period-range.ts` (novo) | classificar, rotular e resumir um intervalo `YYYY-MM-DD` |
| `src/lib/period-range.test.ts` (novo) | testes da conta |
| `src/components/ui/date-picker.tsx` | `MonthGrid` com `mode="range"` e `caption` |
| `src/components/ui/date-picker-versions.test.ts` | trava do `MonthGrid` em intervalo |
| `src/app/designsystem/docs/date-picker.tsx` | o `MonthGrid` em intervalo na página |
| `src/components/ui/filter-bar.tsx` | atalhos do filtro, rótulo do token, editor em abas |
| `src/components/ui/filter-bar-versions.test.ts` | travas do período |
| `src/app/designsystem/docs/filter-bar.tsx` | o período em abas na página |
| `src/lib/queries/transacoes-filtradas.ts` | `fetchDespesasPorMes` |
| `src/components/transactions/use-campos-de-filtro.ts` | liga os totais ao campo `periodo` |

---

### Task 1: A conta do período (`lib/period-range.ts`)

**Files:**
- Create: `src/lib/period-range.ts`
- Test: `src/lib/period-range.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type PeriodKind =
    | { kind: "year"; year: number }
    | { kind: "months"; from: { year: number; month: number }; to: { year: number; month: number } } // month 0–11
    | { kind: "days" }
  export function classifyPeriod(from: string, to: string): PeriodKind
  export function monthRangeYmd(a: { year: number; month: number }, b: { year: number; month: number }): { from: string; to: string } // ordena; dia 1 ao último dia
  export function yearRangeYmd(year: number): { from: string; to: string }
  export function periodLabel(from: string, to: string): { rotulo: string; falado: string; operador: "é" | "entre" }
  export function periodSummary(from: string, to: string): string
  ```

- [ ] **Step 1: Escreva os testes** (`describe("period-range")`):
  - `classifyPeriod("2025-01-01","2025-12-31")` → `{kind:"year",year:2025}`
  - `classifyPeriod("2026-11-01","2026-11-30")` → months nov–nov 2026
  - `classifyPeriod("2025-11-01","2026-02-28")` → months de `{2025,10}` a `{2026,1}`
  - `classifyPeriod("2024-02-01","2024-02-29")` → months (bissexto); `classifyPeriod("2026-02-01","2026-02-27")` → days
  - `classifyPeriod("2026-08-01","2026-10-15")` → days
  - `monthRangeYmd({year:2026,month:9},{year:2026,month:7})` → `{from:"2026-08-01",to:"2026-10-31"}`
  - `yearRangeYmd(2025)` → `{from:"2025-01-01",to:"2025-12-31"}`
  - `periodLabel("2026-11-01","2026-11-30").rotulo` → `"nov 2026"`; operador `"é"`
  - `periodLabel("2026-08-01","2026-10-31").rotulo` → `"ago – out 2026"`
  - `periodLabel("2025-11-01","2026-02-28").rotulo` → `"nov 2025 – fev 2026"`
  - `periodLabel("2025-01-01","2025-12-31").rotulo` → `"2025"`
  - `periodLabel("2026-11-08","2026-11-08")` → rótulo de um dia igual a `formatTransactionCompactPtBr("2026-11-08")`, operador `"é"`
  - `periodLabel("2026-08-01","2026-08-15")` → `rotulo` = `` `${formatTransactionCompactPtBr(de)} e ${formatTransactionCompactPtBr(ate)}` ``, operador `"entre"`, `falado` com `formatDateLongPtBr` (o comportamento de hoje do `FilterBar`)
  - `periodSummary("2026-08-01","2026-10-31")` → `"1 ago – 31 out · 3 meses"`
  - `periodSummary("2026-11-01","2026-11-30")` → `"1 nov – 30 nov · 1 mês"`
  - `periodSummary("2025-01-01","2025-12-31")` → `"2025 · ano inteiro"`
  - `periodSummary("2026-11-02","2026-11-08")` → `"2 nov – 8 nov · 7 dias"`; `periodSummary("2026-11-08","2026-11-08")` → `"8 nov · 1 dia"`
  - `periodSummary("2025-12-20","2026-01-10")` → `"20 dez 2025 – 10 jan 2026 · 22 dias"` (ano aparece só quando as pontas têm anos diferentes)
  - `falado` dos meses e do ano por extenso: `"novembro de 2026"`, `"agosto a outubro de 2026"`, `"novembro de 2025 a fevereiro de 2026"`, `"2025"`.
- [ ] **Step 2:** `npx vitest run src/lib/period-range.test.ts` → FAIL (módulo não existe).
- [ ] **Step 3:** Implemente com `parseYmdLocal` e os formatadores de `lib/transaction-date.ts` (mês curto em minúscula, sem ponto: "nov", "ago"). Nada de `cva`. Datas sempre locais, nunca `new Date("YYYY-MM-DD")` (UTC).
- [ ] **Step 4:** testes passam; `npx tsc --noEmit` limpo.
- [ ] **Step 5:** commit `feat(periodo): a conta do intervalo por unidade`.

### Task 2: `MonthGrid` em intervalo e com legenda

**Files:**
- Modify: `src/components/ui/date-picker.tsx` (`MonthGrid`, ~L690)
- Modify: `src/components/ui/date-picker-versions.test.ts`
- Modify: `src/app/designsystem/docs/date-picker.tsx` (o eixo "forma" ganha `intervalo`)

**Interfaces:**
- Produces (props novas; o modo atual continua igual e é o padrão):
  ```ts
  type MonthGridProps =
    | { mode?: "single"; value?: Date; onChange: (month: Date) => void; ...comuns }
    | { mode: "range"; value?: { from: Date; to: Date }; onChange: (range: { from: Date; to: Date }) => void; ...comuns }
  // comuns: min, max, showToday, className, caption?: (month: Date) => React.ReactNode
  ```
  `from` e `to` são o dia 1 de cada mês; quem chama converte para o último dia.

- [ ] **Step 1: Testes** em `date-picker-versions.test.ts`, `describe("MonthGrid em intervalo")`:
  - render estático com `mode:"range", value:{from:new Date(2026,7,1), to:new Date(2026,9,1)}`: ago e out com `aria-pressed="true"` e `data-range="start"`/`"end"`; set com `data-range="middle"`; jul sem `data-range`.
  - `caption: (m) => \`T${m.getMonth()}\`` aparece dentro do botão de cada mês (`T0`…`T11`) com `data-slot="month-grid-caption"`.
  - Lógica de toque, exportada como função pura para testar sem DOM: `export function proximoIntervaloDeMes(ancora: Date | null, tocado: Date): { range: { from: Date; to: Date }; ancora: Date | null }`
    - `(null, out/2026)` → range out–out, âncora out
    - `(out/2026, ago/2026)` → range ago–out, âncora null
    - `(nov/2025, fev/2026)` → range nov/2025–fev/2026, âncora null
- [ ] **Step 2:** rode o arquivo de teste → FAIL.
- [ ] **Step 3:** implemente. Pintura: pontas `variant="primary"`; meio com a faixa do intervalo do `Calendar` (mesmo token que o `Calendar` usa para `range_middle`; procure em `calendar.tsx`); mês atual sem escolha continua `secondary`. A âncora vive em estado interno e sobrevive à troca de ano. A legenda vai numa segunda linha do botão, `text-2xs text-muted-foreground` (`text-primary-foreground`/a tinta da tecla nas pontas); com `caption` o botão cresce em altura (não fixe `h-*` à mão além do piso de toque que já existe).
- [ ] **Step 4:** página do catálogo: o eixo "forma" ganha `intervalo` (`MonthGrid mode="range"` com uma legenda de exemplo realista, "R$ 4,1 mil"), e a nota diz o que o toque faz (primeiro toque = um mês, segundo = até ele). Testes passam; `tsc` limpo; `npx vitest run src/app/designsystem` passa.
- [ ] **Step 5:** commit `feat(month-grid): intervalo de meses e legenda por mês`.

### Task 3: Atalhos do filtro e rótulo do token

**Files:**
- Modify: `src/components/ui/filter-bar.tsx` (`intervaloDoAtalho` ~L150, rótulo `case "period"` ~L264, `normalizar`)
- Modify: `src/components/ui/filter-bar-versions.test.ts`

**Interfaces:**
- Consumes: `periodLabel` (Task 1).
- Produces: `export const FILTER_PERIOD_PRESETS: (DatePickerRangePreset & { id: string })[]` = `DATE_RANGE_PRESETS` + `{ id: "hoje", label: "Hoje" }` (hoje–hoje) + `{ id: "ultimos-90", label: "Últimos 90 dias" }` (hoje −89 a hoje). `export const FILTER_PERIOD_DAY_PRESET_IDS = ["hoje", "ultimos-7", "ultimos-30", "ultimos-90"] as const` (os botões da aba Dias, nessa ordem).

- [ ] **Step 1: Testes** (com a data fixa):
  - `filterPeriodRange(["hoje"])` → `{from:"2026-11-08",to:"2026-11-08"}`; `["ultimos-90"]` → from `"2026-08-11"`.
  - `filterPeriodRange(["este-mes"])` e `["mes-passado"]` continuam resolvendo (regressão).
  - `parseFilters("periodo:is:ultimos-90", CAMPOS)` mantém o valor; `"periodo:is:amanha"` continua vazio.
  - rótulo do token (render da barra com `defaultValue`): `["2026-08-01","2026-10-31"]` mostra `ago – out 2026` e o operador `é`; `["2025-01-01","2025-12-31"]` mostra `2025`; `["ultimos-90"]` mostra `Últimos 90 dias`; `["2026-08-01","2026-08-15"]` continua com `entre`.
  - o `DatePicker` não mudou: `lerFonte("src/components/ui/date-picker.tsx")` não contém `ultimos-90`.
- [ ] **Step 2:** rode → FAIL.
- [ ] **Step 3:** troque toda busca de atalho do filtro (`intervaloDoAtalho`, rótulo, `onSelect` do editor) para `FILTER_PERIOD_PRESETS`; o `case "period"` do rótulo delega a `periodLabel` para pares de datas.
- [ ] **Step 4:** testes passam; `tsc`, `eslint src/components/ui/filter-bar.tsx` limpos.
- [ ] **Step 5:** commit `feat(filter-bar): atalhos Hoje e 90 dias, rótulo do período por unidade`.

### Task 4: O editor em abas

**Files:**
- Modify: `src/components/ui/filter-bar.tsx` (`EditorDeValor`, bloco `campo.type === "period"` ~L1436; tipo `FilterField` ~L114)
- Modify: `src/components/ui/filter-bar-versions.test.ts`
- Modify: `src/app/designsystem/docs/filter-bar.tsx`

**Interfaces:**
- Consumes: `classifyPeriod`, `monthRangeYmd`, `yearRangeYmd`, `periodSummary` (Task 1); `MonthGrid mode="range"` + `caption` (Task 2); `FILTER_PERIOD_PRESETS`, `FILTER_PERIOD_DAY_PRESET_IDS` (Task 3).
- Produces: o campo `period` aceita `totals?: (year: number, signal: AbortSignal) => Promise<(number | null)[]>` (12 posições, despesa de cada mês; `null` = sem total). Tipo: `(FieldBase & { type: "period"; totals?: … }) | (FieldBase & { type: "money" | "text" | "boolean" })`. `export function abaInicialDoPeriodo(valores: string[]): "dias" | "meses" | "ano"`.

- [ ] **Step 1: Testes**:
  - `abaInicialDoPeriodo([])` → `"meses"`; `(["2025-01-01","2025-12-31"])` → `"ano"`; `(["2025-11-01","2026-02-28"])` → `"meses"`; `(["este-mes"])` → `"dias"`; `(["ultimos-7"])` → `"dias"`; `(["2026-08-01","2026-08-15"])` → `"dias"`.
  - Fonte (`CODIGO`): o bloco do período usa `<Tabs` com três `TabsTrigger` de valores `dias`, `meses`, `ano`, `<MonthGrid` com `mode="range"`, e `presets={` recebe os atalhos de `FILTER_PERIOD_DAY_PRESET_IDS`; não contém `isMobile ?` trocando componente.
  - Fonte: o `Calendar` do Dias recebe `defaultMonth` que, sem valor, é o mês anterior ao atual (procure `getMonth() - 1`) — os dois meses do desktop terminam no mês atual.
  - A linha de resumo usa `periodSummary(` e tem `data-slot="filter-bar-period-summary"`.
  - Os testes antigos do período (`size={naGaveta ? "lg" : "md"}`, recuo) continuam passando.
- [ ] **Step 2:** rode → FAIL.
- [ ] **Step 3:** implemente:
  - `Tabs` (padrão, `stretch`) com `defaultValue={abaInicialDoPeriodo(valores)}`, abaixo do cabeçalho, no recuo `recuo`.
  - **Dias**: o `Calendar` de hoje com `presets` = os quatro de `FILTER_PERIOD_DAY_PRESET_IDS`; `onSelect` igual ao de hoje, mas casando atalho só contra esses quatro (assim "Este mês" escolhido à mão vira datas, não o atalho escondido).
  - **Meses**: `MonthGrid mode="range"`; `value` vem de `classifyPeriod` quando `kind === "months"`; `onChange` grava `["is", [from, to]]` de `monthRangeYmd`. `caption` só quando o campo tem `totals`: carregue por ano com React Query (`useQuery({ queryKey: ["filter-bar-period-totals", campo.id, ano], queryFn: ({signal}) => campo.totals!(ano, signal) })`); o `MonthGrid` precisa expor o ano visível — **se** não expõe, adicione `onYearChange?: (year: number) => void` ao `MonthGrid` (registre na página do catálogo). Legenda = `currencyCompactBRL(v)`; `null` ou carregando → nada.
  - **Ano**: os 6 anos (atual e 5 para trás), escolha única com o componente de lista de escolha do catálogo (`RadioGroup variant="chip"` ou `ToggleGroup`; não escreva `Button aria-pressed`), cada linha com o total do ano (soma dos 12, só se nenhum for `null`) à direita. Tocar grava `yearRangeYmd(ano)`.
  - **Resumo**: abaixo do painel, se `filterPeriodRange(valores)` existe, `<p data-slot="filter-bar-period-summary" className="text-xs text-muted-foreground …">{periodSummary(from, to)}</p>` no recuo.
  - Na gaveta (`naGaveta`), nada muda de árvore: os alvos de 44 vêm dos componentes.
  - Página do catálogo do `FilterBar`: o exemplo do período mostra as abas; uma nota cita a aba inicial pela tabela da spec.
- [ ] **Step 4:** testes do arquivo e `npx vitest run src/components/ui src/app/designsystem` passam; `tsc`, `eslint` limpos.
- [ ] **Step 5:** commit `feat(filter-bar): período em abas Dias, Meses e Ano`.

### Task 5: Totais por mês na tela de transações

**Files:**
- Modify: `src/lib/queries/transacoes-filtradas.ts`
- Modify: `src/lib/queries/transacoes-filtradas.test.ts`
- Modify: `src/components/transactions/use-campos-de-filtro.ts`

**Interfaces:**
- Consumes: `totals` do campo `period` (Task 4).
- Produces: `export async function fetchDespesasPorMes(args: { workspaceId: string; year: number; signal?: AbortSignal }): Promise<(number | null)[]>`.

- [ ] **Step 1: Testes** (o mock de `supabase` do arquivo já existe):
  - linhas `{date:"2026-01-15T12:00:00Z", amount: 100}`, `{date:"2026-01-20T12:00:00Z", amount: 50}`, `{date:"2026-03-02T12:00:00Z", amount: 10}` → resultado `[150, 0, 10, 0, …]` (12 posições).
  - mais de `LIMITE_DE_SOMA` linhas → doze `null` (cortado nunca dá total).
  - a seleção pede só `date, amount` (`h.selects` contém `"date, amount"` ou equivalente sem `*`).
- [ ] **Step 2:** rode → FAIL.
- [ ] **Step 3:** implemente no padrão das funções vizinhas do arquivo: workspace, `type = "expense"`, `date` entre `filterRangeStartIso("YYYY-01-01")` e `filterRangeEndIso("YYYY-12-31")`, as mesmas regras de exclusão que a lista usa para linhas que não são gasto (copie o que `fetchTransacoesPagina` aplica além dos filtros, se houver), páginas de `range` até o teto; agrupe pelo mês **local** da data (`groupByLocalDay` ou `parseYmdLocal` do `lib/transaction-date.ts`).
  - Em `use-campos-de-filtro.ts`, o campo `periodo` ganha `totals: (year, signal) => fetchDespesasPorMes({ workspaceId, year, signal })` quando há `workspaceId`.
- [ ] **Step 4:** testes passam (`npx vitest run src/lib/queries src/components/transactions`); `tsc`, `eslint` limpos.
- [ ] **Step 5:** commit `feat(transacoes): total de despesas por mês no filtro de período`.

---

## Depois das tarefas

- `npm run ds:audit -- src/components/ui/filter-bar.tsx src/components/ui/date-picker.tsx`.
- `graphify update .`
- Conferir no navegador (`localhost:3000/transactions`): abrir "+ Filtro → Período", as três abas, intervalo de meses com totais, ano, o rótulo do token, e a 375px (gaveta). Sem gravar dados.
