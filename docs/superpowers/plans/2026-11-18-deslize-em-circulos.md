# Botões do deslize em círculos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Os botões revelados pelo deslize da linha (`mobileSwipe`) viram círculos de 44px só com ícone, que crescem com o arraste.

**Architecture:**
- **Onde:** no `data-table.tsx`, dentro da linha deslizável (`data-slot="data-table-mobile-swipe"`).
- **Largura das ações:** a constante `LARGURA_DA_ACAO` (72) sai. A largura passa a vir de `larguraDaFaixa(n)` em `src/lib/deslize.ts`.
- **Crescimento:** o `mover(x)` escreve `--deslize` (0 a 1) na faixa das ações, e os círculos leem a variável em `scale` e `opacity`.

**Tech Stack:** React 19, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-18-deslize-em-circulos-design.md`

## Global Constraints

- Círculo de 44px (`size-11 rounded-full`), ícone de 20 (`swipeIcon`, de `20/solid`), sem texto visível, nome no `aria-label`.
- 8px entre os círculos e da borda direita. `larguraDaFaixa(n) = n * 44 + (n + 1) * 8`.
- Excluir em `bg-destructive text-destructive-foreground`; Editar e Confirmar em `bg-secondary text-secondary-foreground`. Sem fundo colorido atrás.
- O crescimento é `scale(calc(0.4 + 0.6 * var(--deslize)))` com `opacity: var(--deslize)`. Ele segue o arraste e não tem transição própria. `--deslize = clamp(0, -x / larguraDaFaixa, 1)`.
- `active:brightness-90` ao pressionar.
- O resto do deslize não muda.
- Sem prettier. Comentários em português. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Depois, `graphify update .`.
- Na mesma mudança: no `AGENTS.md`, a frase do `mobileSwipe` diz "círculos de 44 só com ícone"; em `docs/design/HISTORICO-DESIGN-SYSTEM.md`, a "Rodada 402 — os botões do deslize viram círculos"; e o exemplo do catálogo segue sem mudança de API.
- Sem navegador no subagente: o banco é de produção.

## Review Focus

- **Ação sem `swipeIcon`:** o `icon` de 16 aparece no círculo, centrado.
- **Três ações** (lançamento a conferir): a faixa mede 156px e a linha abre nessa medida.
- **Linha fechada:** `--deslize` volta a 0, e a faixa segue escondida (a correção da rodada 401).

---

### Task 1: Círculos que crescem com o arraste

**Files:**
- Modify: `src/lib/deslize.ts`, `src/lib/deslize.test.ts`
- Modify: `src/components/ui/data-table.tsx` (a linha deslizável, ~linha 1670–1790)
- Modify: `src/components/ui/data-table-deslize.test.ts`, `AGENTS.md`, `docs/design/HISTORICO-DESIGN-SYSTEM.md`

**Interfaces:**
- Produces: `export function larguraDaFaixa(n: number): number` e `export function progressoDoDeslize(x: number, largura: number): number` (de 0 a 1), em `src/lib/deslize.ts`.

- [ ] **Step 1: Testes que falham**
  - `larguraDaFaixa(2)` é `104` e `larguraDaFaixa(3)` é `156`;
  - `progressoDoDeslize(0, 104)` é `0`, `progressoDoDeslize(-52, 104)` é `0.5`, `progressoDoDeslize(-200, 104)` é `1` e `progressoDoDeslize(10, 104)` é `0`;
  - na fonte do `data-table.tsx`: não contém `LARGURA_DA_ACAO`; contém `larguraDaFaixa(` e `size-11 rounded-full`; contém `--deslize`; o botão do deslize não escreve o `a.label` visível (o rótulo fica só no `aria-label`).
- [ ] **Step 2: Rodar** `npx vitest run src/lib/deslize.test.ts src/components/ui/data-table-deslize.test.ts`. Esperado: FALHA.
- [ ] **Step 3: Implementar** como nas Global Constraints. O `mover` escreve `faixa.style.setProperty("--deslize", String(progressoDoDeslize(x, largura)))` junto com a visibilidade. Os círculos ficam centrados (`items-center`), com `gap-2 px-2` na faixa. Por fim, a documentação.
- [ ] **Step 4: Rodar** `npx vitest run src/components src/lib src/app/designsystem`, `npx tsc --noEmit`, `npx eslint src/components/ui/data-table.tsx src/lib/deslize.ts` e `npm run ds:audit -- src/components/ui/data-table.tsx`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(data-table): os botões do deslize viram círculos de 44 só com ícone, que crescem com o arraste`.
