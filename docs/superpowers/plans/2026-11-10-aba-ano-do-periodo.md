# Aba Ano do filtro de período — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a lista de rádios da aba Ano do `FilterBar` (editor de período) por atalhos de ano em cima e uma grade de anos 3 × 2, no padrão da grade de Meses, com intervalo de anos e totais corretos.

**Architecture:** Três atalhos novos entram em `FILTER_PERIOD_PRESETS` (valor por id, que rola com o tempo, como "ultimos-7"). A grade de anos é uma função privada do `filter-bar.tsx`, `GradeDeAnos`, com os mesmos `Button` e estados da `MonthGrid` (`primary` nas pontas, `bg-muted` no meio, `secondary` no ano atual), e o mesmo gesto de dois toques (`proximoIntervaloDeMes`). Um intervalo de anos inteiros é gravado como `[AAAA-01-01, BBBB-12-31]`; `period-range.ts` passa a nomeá-lo "2024 – 2026".

**Tech Stack:** Next 16, React 19, Tailwind v4, Vitest (testes de fonte com `lerFonte`).

**Spec:** escolha do dono na conversa de 2026-11-10 — mockup "A com os atalhos da C" (`scratchpad/ano/opcoes.png`): atalhos "Este ano", "Ano passado", "Últimos 12 meses"; abaixo, grade 3 × 2 dos seis últimos anos com o gasto de cada um; ano sem lançamento apagado com "sem lançamentos"; o ano atual soma até hoje.

## Global Constraints

- `src/components/ui/filter-bar.tsx` é do design system: o dono aprovou esta mudança (escolheu a opção). Não criar componente novo em `ui/`, não mexer em `globals.css`, não mexer na `MonthGrid`.
- Tokens só (nada de `#hex`, `text-gray-*`, `p-[13px]`). Ícones Heroicons, se houver.
- Rótulos e textos em português, exatamente: `Este ano`, `Ano passado`, `Últimos 12 meses`, `sem lançamentos`, `Atalhos de ano`, `Anos`.
- Sem `prettier`. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `git add` só dos arquivos da tarefa (outra sessão edita este checkout). Nunca `git push`.
- Verificação de cada tarefa: `npx vitest run <arquivos>`, `npx tsc --noEmit`, `npx eslint <arquivos>`.

## Review Focus

1. **Ano atual com total:** os meses futuros chegam `null`; o total do ano atual soma os meses até o atual, e só fica sem total se algum desses for `null`. Os anos passados continuam exigindo os 12.
2. **Ano sem lançamento:** total `0` num ano passado mostra `sem lançamentos` e o ladrilho fica em tinta apagada (`text-muted-foreground`), mas continua clicável.
3. **Atalho por id:** "Este ano" é `["este-ano"]` (1º jan → hoje), não `[2026-01-01, 2026-12-31]`; reabrir o editor com um atalho de ano abre na aba Ano, com o atalho aceso e nenhum ladrilho em ponta.
4. **Intervalo de anos:** dois toques em 2024 e 2026 gravam `["2024-01-01","2026-12-31"]`; o token mostra `2024 – 2026`; reabrir abre em Ano com 2024 e 2026 em ponta e 2025 no meio.
5. **Âncora:** um valor que muda por fora (atalho, Remover) apaga a âncora, como na `MonthGrid`.

---

### Task 1: Intervalo de anos em `period-range`

**Files:**
- Modify: `src/lib/period-range.ts`
- Test: `src/lib/period-range.test.ts`

**Interfaces:**
- Produces: `export function wholeYears(from: string, to: string): { from: number; to: number } | null` — anos de `from` a `to` quando `from` é 1º de janeiro e `to` é 31 de dezembro (um ou mais anos); senão `null`.

- [ ] **Step 1: Testes que falham** (em `period-range.test.ts`):

```ts
it("wholeYears", () => {
  expect(wholeYears("2024-01-01", "2026-12-31")).toEqual({ from: 2024, to: 2026 })
  expect(wholeYears("2025-01-01", "2025-12-31")).toEqual({ from: 2025, to: 2025 })
  expect(wholeYears("2024-02-01", "2026-12-31")).toBeNull()
  expect(wholeYears("2024-01-01", "2026-11-30")).toBeNull()
})

it("intervalo de anos no rótulo e no resumo", () => {
  expect(periodLabel("2024-01-01", "2026-12-31")).toEqual({ rotulo: "2024 – 2026", falado: "de 2024 a 2026", operador: "é" })
  expect(periodSummary("2024-01-01", "2026-12-31")).toBe("2024 – 2026 · 3 anos")
  // Um ano só segue como antes.
  expect(periodLabel("2025-01-01", "2025-12-31").rotulo).toBe("2025")
  expect(periodSummary("2025-01-01", "2025-12-31")).toBe("2025 · ano inteiro")
})
```

- [ ] **Step 2:** `npx vitest run src/lib/period-range.test.ts` → FAIL (`wholeYears` não existe).
- [ ] **Step 3:** Implementar `wholeYears`; em `periodLabel` e `periodSummary`, logo depois do caso `kind === "year"`, tratar `wholeYears` com `to > from` como acima. `classifyPeriod` não muda.
- [ ] **Step 4:** Mesmo comando → PASS; `npx tsc --noEmit`.
- [ ] **Step 5:** Commit `feat(periodo): intervalo de anos inteiros vira "2024 – 2026"`.

### Task 2: Aba Ano com atalhos e grade de anos

**Files:**
- Modify: `src/components/ui/filter-bar.tsx` (presets ~165–177; `abaInicialDoPeriodo` ~182; `totalDoAno` ~1822; `EditorDePeriodo` aba "ano" ~1971–1992)
- Modify: `src/app/designsystem/docs/filter-bar.tsx` (textos das linhas 556 e 565: a aba Ano)
- Modify: `AGENTS.md` (bullet `FilterBar`: uma frase sobre a aba Ano)
- Test: `src/components/ui/filter-bar-versions.test.ts`

**Interfaces:**
- Consumes: `wholeYears` (Task 1); `proximoIntervaloDeMes(ancora: Date | null, tocado: Date)` de `@/components/ui/date-picker` (já exportado; serve para anos com datas de 1º de janeiro).
- Produces:
  - `FILTER_PERIOD_PRESETS` ganha, no fim, `{ id: "este-ano", label: "Este ano" }` (1º jan do ano atual → hoje), `{ id: "ano-passado", label: "Ano passado" }` (1º jan → 31 dez do ano anterior), `{ id: "ultimos-12-meses", label: "Últimos 12 meses" }` (hoje − 1 ano + 1 dia → hoje).
  - `export const FILTER_PERIOD_YEAR_PRESET_IDS = ["este-ano", "ano-passado", "ultimos-12-meses"] as const`
  - `export function anosDaGrade(valores: string[]): { from: number; to: number } | undefined` — os anos que a grade pinta: só valor de datas (`length === 2`) com `wholeYears`; atalho ou dias → `undefined`.
  - `export function totalDoAno(meses: (number | null)[] | undefined, ano: number, hoje?: Date): number | null` — passado: os 12 conhecidos; ano atual: soma de jan até o mês de `hoje` (todos conhecidos); futuro: `null`.

- [ ] **Step 1: Testes que falham** (em `filter-bar-versions.test.ts`, no `describe("o período em abas")`, com `vi.setSystemTime(new Date(2026, 10, 8, 12))`):

```ts
it("os atalhos de ano são ids e resolvem na data de hoje", () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 8, 12))
  expect(FILTER_PERIOD_YEAR_PRESET_IDS).toEqual(["este-ano", "ano-passado", "ultimos-12-meses"])
  expect(filterPeriodRange(["este-ano"])).toEqual({ from: "2026-01-01", to: "2026-11-08" })
  expect(filterPeriodRange(["ano-passado"])).toEqual({ from: "2025-01-01", to: "2025-12-31" })
  expect(filterPeriodRange(["ultimos-12-meses"])).toEqual({ from: "2025-11-09", to: "2026-11-08" })
  for (const id of FILTER_PERIOD_YEAR_PRESET_IDS) expect(abaInicialDoPeriodo([id])).toBe("ano")
  expect(abaInicialDoPeriodo(["2024-01-01", "2026-12-31"])).toBe("ano")
})

it("a grade de anos pinta anos inteiros, um ou vários", () => {
  expect(anosDaGrade(["2024-01-01", "2026-12-31"])).toEqual({ from: 2024, to: 2026 })
  expect(anosDaGrade(["2025-01-01", "2025-12-31"])).toEqual({ from: 2025, to: 2025 })
  expect(anosDaGrade(["ano-passado"])).toBeUndefined()
  expect(anosDaGrade(["2025-03-01", "2025-12-31"])).toBeUndefined()
})

it("o ano atual soma até o mês de hoje; o passado pede os doze", () => {
  const hoje = new Date(2026, 10, 8)
  const atual = [...Array(11).fill(10), null]
  expect(totalDoAno(atual, 2026, hoje)).toBe(110)
  expect(totalDoAno([null, ...Array(11).fill(10)], 2026, hoje)).toBeNull()
  expect(totalDoAno(Array(12).fill(0), 2023, hoje)).toBe(0)
  expect(totalDoAno([...Array(11).fill(1), null], 2025, hoje)).toBeNull()
  expect(totalDoAno(undefined, 2025, hoje)).toBeNull()
})
```

Trocar, no teste "Dias · Meses · Ano no Tabs…", as três linhas do `RadioGroup` (o comentário, `toContain("<RadioGroup")` e `not.toContain("aria-pressed")`) por:

```ts
expect(BLOCO).toContain("<GradeDeAnos")
expect(CODIGO).toMatch(/function GradeDeAnos[\s\S]*?proximoIntervaloDeMes\(/)
expect(CODIGO).toContain('aria-label="Atalhos de ano"')
expect(CODIGO).toContain("sem lançamentos")
```

E no teste dos ids de `FILTER_PERIOD_PRESETS` (linha ~386), acrescentar os três ids novos ao fim da lista esperada.

- [ ] **Step 2:** `npx vitest run src/components/ui/filter-bar-versions.test.ts` → FAIL.

- [ ] **Step 3: Presets, aba inicial, `anosDaGrade`, `totalDoAno`.** `abaInicialDoPeriodo`: id de ano → `"ano"`; datas com `wholeYears` → `"ano"` (antes da regra de meses). `totalDoAno` substitui o atual; quem o chama passa o ano.

- [ ] **Step 4: `GradeDeAnos`** (função privada no `filter-bar.tsx`, perto do `EditorDePeriodo`), props `{ anos: number[]; value: { from: number; to: number } | undefined; onChange: (r: { from: number; to: number }) => void; legenda: (ano: number) => { texto: string; vazio: boolean } | null }`.
  - Âncora e "valor que muda por fora apaga a âncora": copiar o padrão da `MonthGrid` (`visto`/`emitido`), com `proximoIntervaloDeMes(ancora, new Date(ano, 0, 1))` e convertendo de volta com `getFullYear()`.
  - `<div role="group" aria-label="Anos" className="grid grid-cols-3 gap-1">`; cada ano um `Button type="button" size="sm"` com a mesma régua de variante, `aria-pressed`, `aria-current="date"` (ano atual), `data-range`, `font-normal`/`font-semibold` e a classe de legenda (`h-auto flex-col gap-0 py-1 …`) da `MonthGrid` (date-picker.tsx 800–845). A legenda é `text-2xs leading-tight nums`; com `vazio`, o botão fora de intervalo e não escolhido leva `text-muted-foreground`.
  - A ordem é a de `anos` (atual primeiro, decrescente), como na lista de hoje.

- [ ] **Step 5: A aba Ano no `EditorDePeriodo`.** O `TabsContent value="ano"` passa a ter, dentro do `div` com `recuo`:
  1. `<ul aria-label="Atalhos de ano" className="grid grid-cols-3 gap-1">` com um `Button size="sm"` por `FILTER_PERIOD_YEAR_PRESET_IDS` (o rótulo do preset), `variant` `"primary"` quando `valores[0] === id` e `"outline"` senão (a régua dos atalhos do `Calendar`), `aria-pressed`, classe `w-full justify-center font-normal pointer-coarse:h-11`, e `onClick={() => onGravar([id])}`.
  2. `<GradeDeAnos anos={anos} value={anosDaGrade(valores)} onChange={(r) => onGravar([`${r.from}-01-01`, `${r.to}-12-31`])} legenda={…} />` com `legenda` vinda de `totalDoAno(totais[ano], ano)`: `null` → sem legenda; `0` com ano < atual → `{ texto: "sem lançamentos", vazio: true }`; senão `{ texto: currencyCompactBRL(total), vazio: false }`.
  3. Remover o `RadioGroup` da aba e o import dele se ficar sem uso.
  - Os totais continuam vindo de `useTotaisPorAno(totals, aba === "ano" ? anos : …)`, sem mudança.

- [ ] **Step 6:** `npx vitest run src/components/ui src/lib/period-range.test.ts` → PASS; `npx tsc --noEmit`; `npx eslint src/components/ui/filter-bar.tsx src/components/ui/filter-bar-versions.test.ts`; `npm run ds:audit -- src/components/ui/filter-bar.tsx` sem violação nova.

- [ ] **Step 7: Docs.** Em `src/app/designsystem/docs/filter-bar.tsx`, linha 556: trocar "Ano são os seis últimos, numa escolha única" por "Ano são três atalhos (Este ano, Ano passado, Últimos 12 meses) e a grade dos seis últimos anos, em intervalo como a de Meses"; linha 565: "Um ano inteiro (…) abre em Ano" vira "Anos inteiros (de 1º de janeiro a 31 de dezembro, um ou vários) e os atalhos de ano abrem em Ano", e "os anos são linhas de 44" vira "os anos sobem a 44"; acrescentar "o ano atual soma até o mês corrente, e um ano passado sem despesa diz sem lançamentos". `AGENTS.md`, bullet `FilterBar`: acrescentar a frase "A aba Ano do período são três atalhos por id (`este-ano`, `ano-passado`, `ultimos-12-meses`) e a grade de anos em intervalo (`GradeDeAnos`), na régua da `MonthGrid`."

- [ ] **Step 8:** Commit `feat(filter-bar): a aba Ano com atalhos e a grade de anos em intervalo` com `filter-bar.tsx`, `filter-bar-versions.test.ts`, a página de docs e `AGENTS.md`.
