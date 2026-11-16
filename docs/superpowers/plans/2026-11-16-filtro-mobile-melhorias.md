# Filtro de Transações no telefone — melhorias — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar o filtro de Transações no telefone sem mudar a forma: vazio colorido sem abas nem cartão, contagem no ícone, valor e "Limpar tudo" na lista, editor com voltar/Pronto, teclado no mesmo toque.

**Architecture:** O leque colorido é uma variante do `EmptyStateIcon` (`tint="vivid"`). O `DataTable` passa a mostrar o vazio solto (sem cartão nem cabeçalho de tabela) abaixo do `md` quando tem gêmeo do telefone, com `emptyPhone` opcional. A contagem viaja no `PageChromeFilter`. As mudanças da gaveta moram no `ListaDeCampos` e no `EditorDeValor` do `filter-bar.tsx`, só quando `naGaveta` (o `useIsMobile()` que eles já leem).

**Tech Stack:** Next 16, React 19, Tailwind v4, Radix, vitest (`renderToStaticMarkup` e testes de fonte com `lerFonte`/`semComentarios` de `src/test/fonte.ts`).

**Spec:** `docs/superpowers/specs/2026-11-16-filtro-mobile-melhorias-design.md`

## Global Constraints

- Desktop (≥ 768px) não muda: toda mudança de 4 a 8 vale só na gaveta/telefone (`naGaveta`, `max-md:`/`md:`).
- Texto do vazio: título `Nada por aqui`; descrição `Nenhum lançamento com o filtro ligado.` (1) / `Nenhum lançamento com os N filtros ligados.` (N ≥ 2). Ações: `Limpar filtros` (`primary`) e `Editar filtros` (`tertiary`).
- Cores do leque: `coral`, `azul`, `violeta` da `TILE_PALETTE`, nessa ordem (esquerda, meio, direita), superfície `tile-vivid`.
- Rótulos da gaveta: `Filtros` (voltar, com chevron à esquerda), `Pronto`, `Remover filtro`, `Limpar tudo`.
- `enterKeyHint`: `search` na Descrição, `done` no Valor.
- Sem `#hex`/`rgb()`/classe crua de paleta na tela; ícones Heroicons pela régua do tamanho (AGENTS.md).
- `npm run ds:audit -- <arquivos>`, `npx tsc --noEmit`, `npm run lint`, `npm run test:unit` verdes no fim de cada tarefa.
- Nunca `git add graphify-out/graph.json`; commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push.
- O banco de dev é produção: verificar no navegador só lendo (filtros mudam a URL, não gravam).

## Review Focus

1. Filtro novo (rascunho) aberto pela lista e "‹ Filtros" tocado sem escolher valor: o rascunho some, nenhum filtro vazio fica na URL. → teste no Task 6.
2. Filtro booleano ("A conferir") ligado: a lista mostra `Ligado` como valor, e o editor dele mostra "Remover filtro". → Task 5 e 6.
3. Vazio por filtro com a aba Despesas/Receitas ativa: abas somem, "Limpar filtros" zera filtros e busca mas mantém o tipo. → Task 4.
4. Carregando ou com erro: o vazio colorido não aparece (só sem linhas, sem `loading`, sem `error`). → Task 2.
5. Movimento reduzido: o leque já aparece aberto, sem animar. → Task 1 (fonte: transição dentro de `motion-safe:`).

---

### Task 1: `EmptyStateIcon` com leque colorido

**Files:**
- Modify: `src/components/ui/empty-state.tsx` (`emptyStateIconVariants`, `TILE_POSICAO`, `EmptyStateIcon`)
- Modify: `src/app/designsystem/docs/empty-state.tsx` (o eixo/interruptor "Colorido" na seção do leque)
- Modify: `AGENTS.md` (bullet `EmptyState`: "`tint="vivid"` pinta o leque com coral, azul e violeta da paleta de ladrilhos, e as cartas se abrem ao montar")
- Test: `src/components/ui/empty-state.test.ts`

**Interfaces:**
- Produces: `EmptyStateIcon` aceita `tint?: "vivid"` (só com `variant="stack"`; nos outros é ignorado). Cada `[data-slot=empty-state-icon-tile]` com `tint="vivid"` leva a classe `tile-vivid`, `bg-(--tile-surface) text-(--tile-ink)`, sem `border`/`bg-card`, e `style={{ "--tile-color": <hex da TILE_PALETTE> }}`.

- [ ] **Step 1: Write the failing test** (em `empty-state.test.ts`)

```ts
it("o leque colorido pinta as três cartas com coral, azul e violeta", () => {
  const html = renderToStaticMarkup(
    h(EmptyStateIcon, { variant: "stack", tint: "vivid" }, h("i"), h("i"), h("i"))
  )
  expect(html.match(/tile-vivid/g)?.length).toBe(3)
  const cor = (n: string) => TILE_PALETTE.find((p) => p.nome === n)!.hex
  const ordem = [cor("coral"), cor("azul"), cor("violeta")].map((c) => html.indexOf(`--tile-color:${c}`))
  expect(ordem.every((i) => i >= 0)).toBe(true)
  expect([...ordem].sort((a, b) => a - b)).toEqual(ordem)
  expect(html).not.toMatch(/brand|rainbow/)
})

it("sem tint o leque segue neutro", () => {
  const html = renderToStaticMarkup(h(EmptyStateIcon, { variant: "stack" }, h("i"), h("i"), h("i")))
  expect(html).not.toContain("tile-vivid")
  expect(html).toContain("bg-card")
})

it("as cartas se abrem ao montar só com movimento permitido", () => {
  const src = semComentarios(lerFonte("src/components/ui/empty-state.tsx"))
  expect(src).toMatch(/motion-safe:starting:/)
})
```

(Importar `TILE_PALETTE` de `@/lib/tile-palette` e `semComentarios` de `@/test/fonte`; use o corte de comentário que o arquivo já usar, se usar.)

- [ ] **Step 2: Run** `npx vitest run src/components/ui/empty-state.test.ts` — Expected: FAIL (`tint` ignorado, sem `tile-vivid`).

- [ ] **Step 3: Implement** em `empty-state.tsx`: `tint` no `EmptyStateIcon`; com `tint="vivid"` e leque, cada carta troca `border border-border bg-card` por `tile-vivid bg-(--tile-surface) text-(--tile-ink)` e recebe `--tile-color` da `TILE_PALETTE` (coral, azul, violeta). A abertura ao montar: `motion-safe:starting:rotate-0 motion-safe:starting:translate-x-0 motion-safe:starting:translate-y-0` nas cartas (a transição de `rotate,translate` na mola já existe). A sombra das cartas coloridas sobe a `shadow-md`.

- [ ] **Step 4: Run** o teste — Expected: PASS. Depois `npm run ds:audit -- src/components/ui/empty-state.tsx`.

- [ ] **Step 5: Página do catálogo**: em `docs/empty-state.tsx`, na prévia do leque, um interruptor "Colorido" (nos `Controles` de `ds-doc.tsx`, como os vizinhos) que passa `tint="vivid"`. Rodar `npx vitest run src/app/designsystem` (o `doc-pages.test.ts` tranca a forma).

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/empty-state.tsx src/components/ui/empty-state.test.ts src/app/designsystem/docs/empty-state.tsx AGENTS.md
git commit -m "feat(empty-state): o leque colorido (tint vivid) que se abre ao montar"
```

---

### Task 2: `DataTable` mostra o vazio solto no telefone

**Files:**
- Modify: `src/components/ui/data-table.tsx` (props ~`:554`, render ~`:1248-1395`)
- Test: `src/components/ui/data-table-vazio.test.ts` (novo)

**Interfaces:**
- Produces: prop `emptyPhone?: React.ReactNode` no `DataTable`. Quando há gêmeo (`temGemeo`) e `vazio && !loading && !error`: abaixo do `md` renderiza `<div data-slot="data-table-empty-phone" className="md:hidden flex flex-col items-center justify-center py-20">{emptyPhone ?? empty ?? <o texto padrão de hoje>}</div>` **fora** do `Card` do painel; o `Card` (e a tabela com o cabeçalho) fica `max-md:hidden` nesse estado. A barra (`toolbar`) continua onde está.

- [ ] **Step 1: Write the failing test**

```ts
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { DataTable } from "./data-table"

const colunas = [{ id: "t", header: "Descrição", accessorKey: "t", meta: { mobile: "title" } }]

it("vazio com gêmeo: o telefone ganha o vazio solto e o cartão some abaixo do md", () => {
  const html = renderToStaticMarkup(
    h(DataTable, { columns: colunas, data: [], getRowId: (r: any) => r.t, "aria-label": "x",
      empty: h("p", null, "desktop"), emptyPhone: h("p", null, "telefone") })
  )
  expect(html).toMatch(/data-slot="data-table-empty-phone"[^>]*md:hidden/)
  expect(html).toContain("telefone")
  expect(html).toMatch(/data-slot="table-panel"[^>]*max-md:hidden/)
})

it("sem gêmeo nada muda", () => {
  const html = renderToStaticMarkup(
    h(DataTable, { columns: [{ id: "t", header: "D", accessorKey: "t" }], data: [], getRowId: (r: any) => r.t, "aria-label": "x" })
  )
  expect(html).not.toContain("data-table-empty-phone")
})

it("carregando ou com erro, o vazio solto não aparece", () => {
  const base = { columns: colunas, data: [], getRowId: (r: any) => r.t, "aria-label": "x", emptyPhone: "t" }
  expect(renderToStaticMarkup(h(DataTable, { ...base, loading: true }))).not.toContain("data-table-empty-phone")
  expect(renderToStaticMarkup(h(DataTable, { ...base, error: { message: "e" } }))).not.toContain("data-table-empty-phone")
})
```

(Ajuste os nomes de prop ao tipo real do `DataTable` se diferirem — `loading`, `error`; o teste é a régua.)

- [ ] **Step 2: Run** `npx vitest run src/components/ui/data-table-vazio.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** a regra acima. O `TablePanel` recebe a classe de esconder no `Card` por uma prop interna (`cardClassName?: string`) — não exportada para telas.
- [ ] **Step 4: Run** o teste e `npx vitest run src/components/ui` — Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src/components/ui/data-table.tsx src/components/ui/data-table-vazio.test.ts
git commit -m "fix(data-table): no telefone o vazio sai do cartão e da tabela"
```

---

### Task 3: Contagem no ícone do filtro

**Files:**
- Modify: `src/components/layout/page-chrome-provider.tsx` (`PageChromeFilter`)
- Modify: `src/components/layout/app-header.tsx:~170` (`botaoDoFiltro`)
- Modify: `src/components/transactions/transacoes-toolbar.tsx:41` (publica `count: n`)
- Test: `src/components/layout/page-chrome-filter.test.ts`

**Interfaces:**
- Produces: `PageChromeFilter.count?: number` — "quantos filtros ligados; com ele, o número no canto no lugar do ponto".

- [ ] **Step 1: Write the failing test**

```ts
it("com contagem o canto mostra o número, e sem ela o ponto", () => {
  const src = semComentarios(lerFonte("src/components/layout/app-header.tsx"))
  expect(src).toMatch(/filtro\.count/)
  expect(src).toMatch(/<Badge[^>]*aria-hidden/)
  const barra = semComentarios(lerFonte("src/components/transactions/transacoes-toolbar.tsx"))
  expect(barra).toMatch(/count:\s*n\b/)
})
```

- [ ] **Step 2: Run** `npx vitest run src/components/layout/page-chrome-filter.test.ts` — FAIL.
- [ ] **Step 3: Implement**: no cabeçalho, `filtro.count > 0` desenha `<Badge aria-hidden size="xs" className="nums absolute top-1 right-1 …">{count}</Badge>` (o `Badge` de `ui/badge`, sem `variant` novo); senão, `filtro.active` segue com o `ToolbarFilterIndicator`. O `label` publicado já diz "Filtros: 2 ativos" e fica.
- [ ] **Step 4: Run** o teste — PASS.
- [ ] **Step 5: Commit**

```bash
git add src/components/layout/page-chrome-provider.tsx src/components/layout/app-header.tsx src/components/transactions/transacoes-toolbar.tsx src/components/layout/page-chrome-filter.test.ts
git commit -m "feat(cabecalho): o filtro mostra quantos estão ligados"
```

---

### Task 4: O vazio de Transações no telefone

**Files:**
- Modify: `src/components/transactions/transacoes-tabela.tsx:~499-546` (o `vazio`) e `:~560` (`toolbar`)
- Modify: `src/components/layout/page-chrome-provider.tsx` (só se faltar um leitor do filtro publicado: `usePageChromeFilterValue(): PageChromeFilter | null`)
- Test: `src/components/transactions/transacoes-vazio.test.ts` (novo)

**Interfaces:**
- Consumes: `EmptyStateIcon tint="vivid"` (Task 1); `DataTable emptyPhone` (Task 2); o `onOpen` publicado pelo `TransacoesToolbar` (Task 3 não muda ele).
- Produces: nada para outras tarefas.

- [ ] **Step 1: Write the failing test** (fonte)

```ts
const src = semComentarios(lerFonte("src/components/transactions/transacoes-tabela.tsx"))
it("o vazio do filtro no telefone é o leque colorido com o texto e as duas ações", () => {
  expect(src).toMatch(/emptyPhone=/)
  expect(src).toMatch(/tint="vivid"/)
  expect(src).toContain("Nada por aqui")
  expect(src).toContain("filtros ligados")
  expect(src).toContain("Editar filtros")
  expect(src).toMatch(/variant="primary"[\s\S]{0,200}Limpar filtros/)
})
it("sem resultado por filtro, a barra das abas some no telefone", () => {
  expect(src).toMatch(/max-md:hidden/)
})
```

- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement**:
  - `vazioPorFiltro = !pagina.isLoading && !pagina.error && pagina.totalCount === 0 && (estado.filtros.length > 0 || estado.q)` e fora dos dois outros ramos (primeiro lançamento, conferir).
  - `emptyPhone` (só nesse ramo): `EmptyState variant="plain"` com `EmptyStateIcon variant="stack" tint="vivid"` (os três ícones de hoje, em `24/outline`), `EmptyStateTitle` "Nada por aqui", `EmptyStateDescription` com a frase da contagem, `EmptyStateActions` com `Limpar filtros` (`primary`, `setEstado({ filtros: [], q: "" })`) e `Editar filtros` (`tertiary`, chama o `onOpen` do filtro publicado).
  - O `empty` do desktop fica como está.
  - `toolbar={{ start: vazioPorFiltro ? <div className="contents max-md:hidden">{barra}</div> : barra }}`. Conferir no navegador (Task 7) que a faixa vazia da barra não sobra no telefone; se sobrar, esconder pela `TablePanelToolbar` via `className` no mesmo estado.
- [ ] **Step 4: Run** o teste — PASS; `npm run ds:audit -- src/components/transactions/transacoes-tabela.tsx`.
- [ ] **Step 5: Commit**

```bash
git add src/components/transactions/transacoes-tabela.tsx src/components/transactions/transacoes-vazio.test.ts src/components/layout/page-chrome-provider.tsx
git commit -m "feat(transacoes): no telefone o vazio do filtro ocupa a tela, colorido e sem abas"
```

---

### Task 5: A lista "Filtrar por…" mostra o valor e "Limpar tudo"

**Files:**
- Modify: `src/components/ui/filter-bar.tsx` (`ListaDeCampos` ~`:1638`, a chamada ~`:1384`, `descrever` ~`:337`)
- Test: `src/components/ui/filter-bar-gaveta.test.ts` (novo)

**Interfaces:**
- Produces: `export function valorNaLista(campo: FilterField, f: Pick<FilterValue, "operator" | "values">, opcao: (v: string) => FilterOption | undefined): string` — `descrever(...).rotulo` mais ` +N` quando `resto > 0`; `boolean` → `"Ligado"`; texto sem aspas tipográficas.
- `ListaDeCampos` ganha `valorDe: (campoId: string) => string | undefined` e `onLimparTudo: () => void`.

- [ ] **Step 1: Write the failing test**

```ts
import { valorNaLista } from "./filter-bar"
const enumCampo = { id: "cat", label: "Categoria", type: "enum", options: [{ value: "1", label: "Carro" }, { value: "2", label: "Casa" }] } as any
const op = (v: string) => enumCampo.options.find((o: any) => o.value === v)
it("enum: o primeiro nome e o resto", () => {
  expect(valorNaLista(enumCampo, { operator: "is", values: ["1"] }, op)).toBe("Carro")
  expect(valorNaLista(enumCampo, { operator: "is", values: ["1", "2"] }, op)).toBe("Carro +1")
})
it("período por atalho", () => {
  expect(valorNaLista({ id: "periodo", label: "Período", type: "period" } as any, { operator: "is", values: ["ultimos-7"] }, () => undefined)).toBe("Últimos 7 dias")
})
it("booleano ligado e texto sem aspas", () => {
  expect(valorNaLista({ id: "c", label: "A conferir", type: "boolean" } as any, { operator: "is", values: [] }, () => undefined)).toBe("Ligado")
  expect(valorNaLista({ id: "d", label: "Descrição", type: "text" } as any, { operator: "contains", values: ["uber"] }, () => undefined)).toBe("uber")
})
it("a gaveta não diz mais 'editar' e tem Limpar tudo", () => {
  const src = semComentarios(lerFonte("src/components/ui/filter-bar.tsx"))
  expect(src).not.toMatch(/>\s*editar\s*</)
  expect(src).toContain("Limpar tudo")
})
```

(Se o rótulo do atalho `ultimos-7` em `FILTER_PERIOD_PRESETS` for outro texto, use o texto de lá: o teste copia o preset, não inventa.)

- [ ] **Step 2: Run** `npx vitest run src/components/ui/filter-bar-gaveta.test.ts` — FAIL.
- [ ] **Step 3: Implement**: `valorNaLista` ao lado de `descrever`; no `ListaDeCampos`, `CommandItemMeta` mostra `valorDe(f.id)` (truncado, `max-w-40`) na gaveta e `editar` fica só no desktop (`naGaveta ? valor : "editar"`); o chevron (`ChevronRightIcon` 16/solid) só na gaveta. "Limpar tudo": na gaveta, com `usados.length > 0`, um `Button variant="tertiary"` no fim da lista (fora do `CommandList`), que chama `onLimparTudo` — o `FilterBar` emite `onValueChange([])` e mantém a lista aberta.
- [ ] **Step 4: Run** — PASS. `npx vitest run src/components/ui/filter-bar` (versões) verde.
- [ ] **Step 5: Commit**

```bash
git add src/components/ui/filter-bar.tsx src/components/ui/filter-bar-gaveta.test.ts
git commit -m "feat(filter-bar): na gaveta a lista mostra o valor e tem Limpar tudo"
```

---

### Task 6: O editor da gaveta: voltar, Pronto, Remover no pé, teclado

**Files:**
- Modify: `src/components/ui/filter-bar.tsx` (`EditorDeValor` ~`:1680-1830`, `EditorDeDinheiro` ~`:1884`, a chamada ~`:1389`)
- Test: `src/components/ui/filter-bar-gaveta.test.ts`

**Interfaces:**
- Consumes: a lista do Task 5.
- Produces: `EditorProps` ganha `existia: boolean` (o token não era rascunho ao abrir — o `FilterBar` passa `!tokenAberto.rascunho` capturado no `setAberto`) e `onVoltar?: () => void` (só na gaveta: descarta o rascunho como o `fechar` faz e volta a `{ tipo: "campos" }` sem fechar a gaveta).

- [ ] **Step 1: Write the failing test** (fonte, porque o editor é interno)

```ts
const src = semComentarios(lerFonte("src/components/ui/filter-bar.tsx"))
it("o editor da gaveta tem voltar, Pronto e Remover filtro só para o que existia", () => {
  expect(src).not.toMatch(/Editar \{campo\.label/)
  expect(src).toContain("Pronto")
  expect(src).toContain("Remover filtro")
  expect(src).toMatch(/existia\s*&&[\s\S]{0,300}Remover filtro/)
  expect(src).toMatch(/onVoltar/)
})
it("Descrição e Valor pedem o teclado na gaveta", () => {
  expect(src).toMatch(/enterKeyHint="search"/)
  expect(src).toMatch(/enterKeyHint="done"/)
  expect(src).toMatch(/autoFocus=\{[^}]*naGaveta/)
})
it("voltar com rascunho não deixa filtro vazio", () => {
  expect(src).toMatch(/onVoltar[\s\S]{0,400}setRascunho\(null\)|const voltar[\s\S]{0,400}setRascunho\(null\)/)
})
```

- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement**:
  - Desktop (`!naGaveta`): o cabeçalho de hoje fica igual ("Editar x" e "remover").
  - Gaveta: `PopoverHeader` em três colunas — `Button variant="tertiary"` com `ChevronLeftIcon` + "Filtros" (`onVoltar`), `PopoverTitle` com `campo.icon` + `campo.label`, `Button variant="tertiary"` "Pronto" (`onConcluir`). No fim do editor, com `existia`, `Button variant="tertiary"` "Remover filtro" em `text-destructive` (`onRemover`).
  - Texto: `autoFocus={!dedo || naGaveta}`, `enterKeyHint="search"`. Dinheiro: o primeiro campo recebe `autoFocus` também na gaveta e todos `enterKeyHint="done"`.
- [ ] **Step 4: Run** — PASS; `npm run ds:audit -- src/components/ui/filter-bar.tsx`; `npx vitest run src/components/ui`.
- [ ] **Step 5: Commit**

```bash
git add src/components/ui/filter-bar.tsx src/components/ui/filter-bar-gaveta.test.ts
git commit -m "feat(filter-bar): na gaveta o editor volta, conclui e abre o teclado"
```

---

### Task 7: Jornada, docs e verificação no telefone

**Files:**
- Modify: `docs/JORNADAS.md` (seção de Transações: o vazio por filtro no telefone tem "Editar filtros", que abre a gaveta do filtro)
- Modify: `docs/atlas/template.html` (a mesma jornada e a data da capa)
- Generate: `docs/atlas/atlas-jornadas.html` via `python3 docs/atlas/build.py`
- Modify: `docs/design/HISTORICO-DESIGN-SYSTEM.md` (rodada: leque colorido e vazio solto do `DataTable`)

- [ ] **Step 1:** Atualizar os docs e rodar `python3 docs/atlas/build.py` — Expected: escreve `docs/atlas/atlas-jornadas.html` sem erro.
- [ ] **Step 2:** `npx tsc --noEmit && npm run lint && npm run test:unit` — Expected: verde.
- [ ] **Step 3:** `graphify update .`
- [ ] **Step 4:** No navegador do app, `localhost:3000/transactions` a 375px (`resize_window mobile`), só lendo: aplicar um filtro que não acha nada pela gaveta (ex.: Descrição "zzzz"); conferir sem abas, sem cartão, leque colorido, contagem "1" no ícone, valor na lista, "‹ Filtros"/"Pronto", teclado (foco no campo). Captura de tela como prova. Voltar a `desktop`.
- [ ] **Step 5: Commit** e republicar o Atlas (controlador, com a ferramenta de Artifact, no URL do AGENTS.md).

```bash
git add docs/JORNADAS.md docs/atlas/template.html docs/atlas/atlas-jornadas.html docs/design/HISTORICO-DESIGN-SYSTEM.md
git commit -m "docs(transacoes): o vazio do filtro no telefone no mapa de jornadas"
```
