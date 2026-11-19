# Ações da direita (mês com setas, ordem em ícone) — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** no desktop, o mês vira a pílula ‹ Novembro de 2026 › e a ordem de Categorias vira um ícone ⇅ sem fundo.

**Architecture:** o `MonthNavPicker` (`src/components/categories/categories-toolbar.tsx`, l.~44) é o botão do mês no desktop em todas as telas: Categorias, Painel, o detalhe da categoria e a fatura. Ele ganha as setas numa pílula `ButtonGroup`. A `OrdemDasCategorias` (`src/components/categories/categorias-do-mes.tsx`) troca o gatilho de texto do desktop por um ícone.

**Tech Stack:** React 19, Tailwind v4, Vitest (`renderToStaticMarkup`, `lerFonte`/`semComentarios`).

**Spec:** `docs/superpowers/specs/2026-11-19-acoes-da-direita-design.md`

## Global Constraints

- **Pílula do mês:** `ButtonGroup` com três `Button variant="floating"`:
  - ‹ (`size="icon-lg"`, `aria-label="Mês anterior"`, `ChevronLeftIcon`);
  - o nome do mês, que abre o `Popover` com o `MonthNavPanel` de hoje e mantém o `aria-label` atual;
  - › (`size="icon-lg"`, `aria-label="Próximo mês"`, `ChevronRightIcon`).
- **Setas:** chamam `onBudgetMonthYmChange(shiftYearMonth(budgetMonthYm, -1 | +1))` (`src/lib/budget-month.ts`).
- **Fatura no telefone:** com `fullWidth` (`mobileTriggerFullWidth`), o picker continua como hoje, sem setas.
- **A ordem no desktop:** `Button variant="tertiary" size="icon-lg"`, com `BarsArrowDownIcon` e `aria-label={`Ordenar categorias: ${atual.label}`}`, dentro de `Tooltip` "Ordenar". Se o `Button` já aceitar uma prop de dica, use-a. Abre o mesmo `DropdownMenu` de rádio.
- **A ordem no telefone (`compacta`):** não muda.
- **Ícones:** só Heroicons, no conjunto do tamanho (o auditor, regra G, decide).
- **Componentes:** só os do sistema. Nada em `src/components/ui/`, nada de `#hex` ou valor arbitrário.
- **Arquivos alheios:** não faça stage de `CLAUDE.md`, de `graphify-out/graph.json`, de `src/components/layout/transicao-de-subpagina.tsx` nem de `docs/superpowers/plans/2026-11-16-*` e `2026-11-17-*`.
- **Commits:** sem push, e cada commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Seta que cruza o ano:** de dezembro, a seta › vai a janeiro do ano seguinte, e a grade aberta depois mostra esse ano.
2. **Teclado:** Tab passa por ‹, mês e ›, e cada um tem nome.
3. **Painel e detalhe da categoria:** a pílula cabe na barra deles sem quebrar a linha a 1280px.
4. **Fatura no telefone:** continua com o botão de faixa inteira, sem setas.
5. **Ordem no desktop:** o menu abre alinhado ao ícone e mostra a ordem atual marcada.

---

### Task 1: o mês vira a pílula com setas

**Files:**
- Modify: `src/components/categories/categories-toolbar.tsx` (`MonthNavPicker`)
- Test: `src/components/categories/categories-toolbar.test.ts`. Se o arquivo não existir, crie-o, seguindo o estilo de `categorias-do-mes.test.ts`.
- Modify: `AGENTS.md`, no parágrafo do mês do `PageHeader` ("O mês das telas que o têm…"). Acrescente: "no desktop, o mês é a pílula ‹ mês › (`MonthNavPicker`): as setas andam um mês e o nome abre a grade (19/11/2026)".

- [ ] **Step 1: teste de fonte do trecho `function MonthNavPicker(`.**
  - Contém `ButtonGroup`, `aria-label="Mês anterior"`, `aria-label="Próximo mês"` e `shiftYearMonth(budgetMonthYm, -1)` / `shiftYearMonth(budgetMonthYm, 1)`.
  - O ramo `fullWidth` não renderiza as setas.
- [ ] **Step 2:** `npx vitest run src/components/categories/categories-toolbar.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** implementar segundo as Global Constraints.
- [ ] **Step 4:** os testes passam (PASS). Rodar `npx tsc --noEmit`, `npm run lint` e `npm run ds:audit -- src/components/categories`.
- [ ] **Step 5:** commit `feat(mes): no desktop o mês é a pílula com setas`.

### Task 2: a ordem vira ícone no desktop

**Files:**
- Modify: `src/components/categories/categorias-do-mes.tsx` (`OrdemDasCategorias`)
- Test: `src/components/categories/categorias-do-mes.test.ts`

- [ ] **Step 1: teste.** Sem `compacta` e com `criterio: "nome"`, o markup:
  - contém `aria-label="Ordenar categorias: Nome"` e `data-variant="tertiary"`;
  - não contém o texto visível "Nome" fora do `aria-label` (o gatilho é só o ícone). Com `compacta`, o teste de hoje continua passando.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** implementar, com o `Tooltip` "Ordenar" em volta do gatilho do desktop.
- [ ] **Step 4:** os testes passam (PASS). Rodar `npx tsc --noEmit` e `npm run ds:audit -- src/components/categories/categorias-do-mes.tsx`.
- [ ] **Step 5:** `graphify update .` e commit `feat(categorias): a ordem vira um ícone sem fundo ao lado do mês`.
