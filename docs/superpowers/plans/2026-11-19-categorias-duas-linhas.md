# Categorias em duas linhas — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a tela de Categorias passa a ter só duas linhas antes dos cartões. A contagem vai para a linha das abas, a ordem e o mês ficam à direita, e as contagens de Categorias e de Transações descem até o pé da linha.

**Architecture:** a linha "N categorias com gasto em … · Maior gasto" (`CategoriasDoMesCabecalho`) é quebrada em duas peças, `ContagemDoMes` e `OrdemDasCategorias`. O `CategoriesToolbar` as recebe por slot e a página as liga. A `FilterBar` ganha `self-end` na contagem.

**Tech Stack:** React 19, Tailwind v4, Vitest (`renderToStaticMarkup`, testes de fonte com `lerFonte`/`semComentarios`).

**Spec:** `docs/superpowers/specs/2026-11-19-categorias-duas-linhas-design.md`

## Global Constraints

- **Desktop:** a linha de baixo tem, nesta ordem, as abas, a contagem ("10 categorias" / "1 categoria", `text-sm text-muted-foreground`), a ordem (`Select size="sm"`) e o mês.
- **Telefone:** a contagem não aparece. A ordem é `Button variant="floating" size="icon-md"` com `DropdownMenu` de rádio, com as mesmas opções e o `aria-label="Ordenar categorias"`.
- **Opções da ordem:** "Maior gasto" (ou "Maior receita"), "Nome" e "Variação", com os valores `maior`, `nome` e `variacao`.
- **Quando aparecem:** a contagem e a ordem só aparecem com `numerosProntos` e com `comMovimento.length > 0` na aba ativa.
- **Contagem rente ao pé:** `self-end` na contagem de Categorias e no `data-slot="filter-bar-count"` da `FilterBar`. A mudança em `src/components/ui/filter-bar.tsx` foi autorizada pelo dono.
- **Não muda:** `SemMovimentoNoMes`, `mesNaFrase`, os cartões, o critério e o mês.
- **Ícones:** só Heroicons, no conjunto do tamanho (o ícone do `icon-md` sem tamanho é `24/outline` ou `20/solid`, como os vizinhos de ⋯).
- **Arquivos alheios:** não faça stage de `CLAUDE.md`, de `graphify-out/graph.json`, de `src/components/layout/transicao-de-subpagina.*` nem de `docs/superpowers/plans/2026-11-16-*` e `2026-11-17-*`.
- **Commits sem push.** Cada commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Trocar de aba com zero movimento:** em Receitas sem nada no mês, a contagem e a ordem somem e não ficam com o número de Despesas.
2. **Enquanto carrega:** com `numerosProntos` falso, a barra não mostra "0 categorias".
3. **Barra estreita no desktop (768–1000px):** a linha não estoura. A contagem pode sair antes de a ordem ou o mês quebrarem.
4. **Convidado (sem Nova categoria):** a ordem continua lá no telefone.
5. **FilterBar empilhada (`@max-md`, sem `overflow="menu"`):** o `self-end` não desalinha a contagem quando a barra vira coluna.

---

### Task 1: as peças `ContagemDoMes` e `OrdemDasCategorias`

**Files:**
- Modify: `src/components/categories/categorias-do-mes.tsx`, para trocar `CategoriasDoMesCabecalho` pelas duas peças
- Test: `src/components/categories/categorias-do-mes.test.ts`, para trocar o describe `CategoriasDoMesCabecalho`

**Interfaces:**
- Produces:
  - `ContagemDoMes({ quantidade, className }: { quantidade: number; className?: string })`: um `<p>` com "N categorias" ou "1 categoria", em `text-sm text-muted-foreground nums self-end`.
  - `OrdemDasCategorias({ tipo, criterio, onCriterioChange, compacta }: { tipo: "expense" | "income"; criterio: CriterioDeOrdem; onCriterioChange: (c: CriterioDeOrdem) => void; compacta?: boolean })`. Sem `compacta`, é o `Select size="sm"` de hoje. Com `compacta`, é o botão de ícone com `DropdownMenuRadioGroup`.

- [ ] **Step 1: testes.**
  - `ContagemDoMes` com 10 contém "10 categorias" e não contém "com gasto".
  - Com 1, contém "1 categoria".
  - O `<p>` tem `self-end`.
  - `OrdemDasCategorias` compacta: o markup tem `aria-label="Ordenar categorias"` e `data-slot="dropdown-menu-trigger"` (ou o slot que o `DropdownMenuTrigger` escreve).
  - Fonte: o trecho de `OrdemDasCategorias` contém `"Maior receita"`, `"Maior gasto"`, `"Nome"` e `"Variação"`.
  - Fonte: `CategoriasDoMesCabecalho` não existe mais no arquivo.
- [ ] **Step 2:** `npx vitest run src/components/categories/categorias-do-mes.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** implementar as duas peças. A lista de opções fica num lugar só, para o `Select` e o menu.
- [ ] **Step 4:** o mesmo teste passa (PASS). Rodar `npx tsc --noEmit`, que deve falhar só em `page-client.tsx`, ainda importando a peça antiga; a Task 2 resolve. Ou fazer a Task 2 antes de commitar.
- [ ] **Step 5:** commit `refactor(categorias): a contagem e a ordem viram peças soltas`. Se o `tsc` não fechar, junte esta task à Task 2 num commit só.

### Task 2: a barra recebe a contagem e a ordem; a terceira linha sai

**Files:**
- Modify: `src/components/categories/categories-toolbar.tsx` (`CategoriesToolbar`, l.~333)
- Modify: `src/app/(app)/categories/page-client.tsx` (l.~690 e os dois `CategoriasDoMesCabecalho`, l.~753 e ~819)
- Test: `src/app/(app)/categories/page-client.test.ts`

**Interfaces:**
- Consumes: `ContagemDoMes` e `OrdemDasCategorias`, da Task 1.
- Produces: as props novas `contagem?: React.ReactNode` e `ordem?: React.ReactNode` do `CategoriesToolbar`.
  - A `contagem` entra logo depois do `TransactionTypeSegment`, com `max-md:hidden`.
  - A `ordem` entra no `ToolbarActions`, antes do `MonthNav`.

- [ ] **Step 1: teste de fonte em `page-client.test.ts`.**
  - O arquivo não contém `CategoriasDoMesCabecalho`.
  - Ele passa `contagem=` e `ordem=` ao `CategoriesToolbar`.
  - As duas ficam guardadas por `numerosProntos` e por `comMovimento.length > 0` da aba ativa.
  - Ele passa `compacta={isMobile}` à `OrdemDasCategorias`.
- [ ] **Step 2:** `npx vitest run "src/app/(app)/categories/page-client.test.ts"`. Esperado: FAIL.
- [ ] **Step 3: implementar.**
  - A página calcula `const doMes = filterType === "income" ? receitas : despesas` e `const mostrarOrdem = numerosProntos && doMes.comMovimento.length > 0`.
  - Ela passa as duas peças à barra só quando `mostrarOrdem` vale.
  - Os dois `<CategoriasDoMesCabecalho …/>` saem da grade. A grade e os `SemMovimentoNoMes` ficam.
- [ ] **Step 4:** os testes passam (PASS). Rodar `npx tsc --noEmit && npm run lint` e `npm run ds:audit -- src/components/categories "src/app/(app)/categories"`.
- [ ] **Step 5:** conferir no navegador (`dev-attach`, `/categories`) a 1280px e a 375px.
  - Duas linhas no desktop.
  - A contagem rente ao pé das abas.
  - No telefone, o botão de ordem abre o menu.
  - Trocar para Receitas mostra a contagem de Receitas.
- [ ] **Step 6:** commit `feat(categorias): a tela cabe em duas linhas, com a contagem e a ordem na barra`.

### Task 3: a contagem da `FilterBar` desce ao pé da linha

**Files:**
- Modify: `src/components/ui/filter-bar.tsx` (o `motion.span` `data-slot="filter-bar-count"`, l.~1356)
- Test: `src/components/ui/filter-bar-versions.test.ts`
- Modify: `AGENTS.md`, no bullet da **`FilterBar`**: "a contagem assenta no pé da linha (`self-end`) (19/11/2026)"

- [ ] **Step 1: teste de fonte.** A classe do `filter-bar-count` contém `self-end`. Na barra empilhada (`@max-md/filter-bar:`) ela não se estica: o `items-stretch` da coluna não a afeta, porque `self-end` vence. O teste confere só a classe.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** acrescentar `self-end` à classe. Se a 1280px a base do texto não encostar na base dos tokens, ajustar só com um recuo de pé na escala (`pb-*`), nunca com valor arbitrário.
- [ ] **Step 4:** os testes passam (PASS). Rodar `npm run ds:audit -- src/components/ui/filter-bar.tsx` e conferir `/transactions` a 1280px: "N lançamentos" fica rente ao pé da linha.
- [ ] **Step 5:** `graphify update .` e commit `fix(filter-bar): a contagem assenta no pé da linha`.
