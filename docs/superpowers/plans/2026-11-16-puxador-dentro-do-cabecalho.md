# Puxador dentro do fundo do cabeçalho Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Na gaveta, o fundo do cabeçalho translúcido sobe e cobre também a faixa do puxador. O conteúdo que rola passa por trás do puxador e só some na borda de cima da gaveta, e não mais na linha de baixo do puxador.

**Architecture:** Hoje o `DrawerContent` (`src/components/ui/drawer.tsx` ~663) desenha o `DragHandle` (~26px: `h-1.5` + `my-2.5`) e, logo depois, o cabeçalho com `@utility dialog-header-translucent` (`src/app/globals.css` ~4185). O `::before` dessa regra pinta a placa (`--dialog-header-tint`) só na caixa do cabeçalho. O corpo sobe por `margin-top: calc(var(--dialog-header-h) * -1)` só até o topo do cabeçalho. A mudança:
1. O `DrawerContent` publica a altura do puxador numa variável CSS (`--drawer-handle-h`, 26px, igual à soma `h-1.5 + 2×my-2.5`). O puxador ganha `relative` e um `z` acima do cabeçalho (`z-20`).
2. Na regra `dialog-header-translucent`, quando o cabeçalho vem logo depois do puxador (`[data-slot="drag-handle"] + &`):
   - o `::before` começa em `top: calc(var(--drawer-handle-h) * -1)`, com a altura somando a do puxador;
   - o corpo seguinte recebe `margin-top: calc((var(--dialog-header-h) + var(--drawer-handle-h)) * -1)`, e o `padding-top` e o `scroll-padding-block-start` também somam `--drawer-handle-h`.

   Com isso, a primeira linha do corpo fica no mesmo lugar de hoje.

**Tech Stack:** Tailwind v4 (`@utility` em `globals.css`), vaul, vitest (testes de fonte).

**Spec (design curto, aprovado pelo dono em 16/11/2026):**
- **O que muda:** o fundo do cabeçalho inclui a faixa do puxador, e o conteúdo some só na borda da gaveta.
- **O que não muda:** espaçamentos e posição do puxador, do título e do conteúdo; o degradê de 56px; a cor da placa.
- **Onde vale:** toda gaveta com cabeçalho translúcido logo depois do puxador. Fora disso (sem `DialogHeader`, `translucent={false}`, desktop), nada muda.

## Global Constraints

- `globals.css` e `ui/`: OK do dono dado neste pedido.
- `--drawer-handle-h` tem um valor só e mora no `DrawerContent` (ou no CSS da gaveta). Não reescreva 26px em dois lugares sem relação: se o puxador mudar de tamanho, a variável muda junto. De preferência, derive-a das mesmas medidas do `dragHandleClassName`.
- `view-transition-name` e vidro: não introduzir `backdrop-filter` novo, porque o cabeçalho de vidro foi recusado em 12/11.
- **CSS só conta servido:** confira a regra nova em `.next/dev/static/chunks/`; se faltar, `touch src/app/globals.css`.
- Sem prettier. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **Posição sem rolagem:** com o corpo no topo, a primeira linha fica no mesmo pixel de antes. Meça o `getBoundingClientRect().top` antes e depois.
- **Arrastar:** o puxador continua arrastável e por cima do fundo. O toque nele não cai no conteúdo de trás.
- **Teclado do iOS:** o `rolarSobOTeclado` rola o campo focado para o topo do corpo, e o `scroll-padding` novo não pode jogar o campo para trás do puxador.
- **Sem cabeçalho:** a gaveta só com o meio (`data-drawer-meio`) não muda.

---

### Task 1: O fundo do cabeçalho cobre o puxador

**Files:**
- Modify: `src/components/ui/drawer.tsx` (variável e `z` do puxador)
- Modify: `src/app/globals.css` (`@utility dialog-header-translucent`)
- Test: `src/components/ui/drawer-versions.test.ts` (e/ou o teste que já tranca o `dialog-header-translucent`; procure com `grep -rn "dialog-header-translucent" src --include=*.test.ts`)

- [ ] **Step 1: Teste que falha** (fonte):
  - `globals.css`, dentro do bloco `@utility dialog-header-translucent` (use `blocoCss` de `@/test/fonte`), contém `[data-slot="drag-handle"] + &`, `var(--drawer-handle-h)` no `::before` e `var(--drawer-handle-h)` no `margin-top` do corpo;
  - `drawer.tsx` publica `--drawer-handle-h` e o puxador tem `relative` e `z-20`.
- [ ] **Step 2: Rodar** o teste. Esperado: FALHA.
- [ ] **Step 3: Implementar** como na Architecture.
- [ ] **Step 4: Rodar** `npx vitest run src/components/ui/drawer src/components/ui/dialog` e o teste que tranca a regra do cabeçalho, mais `npx tsc --noEmit`. Esperado: PASSA. Confira a regra no CSS servido.
- [ ] **Step 5: Commit** com `fix(drawer): o fundo do cabeçalho translúcido cobre o puxador, e o conteúdo some na borda da gaveta`.
