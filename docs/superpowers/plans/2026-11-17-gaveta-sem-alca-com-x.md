# Gaveta sem alça quando tem o ✕ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A alça da gaveta (`DragHandle`) não aparece quando a gaveta tem um ✕ (`[data-slot=dialog-close-button]`) e não tem `snapPoints`; nas outras ela continua.

**Architecture:** Só CSS, decidido no `DrawerContent` de `src/components/ui/drawer.tsx`.
- Sem degraus, o `DragHandle` recebe a classe `group-has-[[data-slot=dialog-close-button]]/dialog-content:invisible`.
- Com degraus (`raiz?.degraus`), a classe não entra.
- `invisible` guarda o lugar da alça (26px, `--drawer-handle-h`). Assim nada se mexe na barra da gaveta (o ✕ em `top-2.5`, o título com `-mt-8`) e só a peça some.
- O arraste segue pela gaveta inteira (o vaul).

**Tech Stack:** React, Tailwind v4, vaul, vitest (testes de fonte).

**Spec:** pedido do dono, 17/11/2026, depois da barra das folhas do iOS (rodada 379): "sim, faça assim". A proposta aprovada:
- O `DrawerContent` deixa de desenhar a alça quando a gaveta tem cabeçalho com ✕ e não tem `snapPoints`.
- Nas gavetas com degraus e nas sem ✕ (folha de ações, menus no telefone, seletor de data), a alça fica.

## Global Constraints

- Mudança em `src/components/ui/`: o dono já aprovou (17/11/2026). O `showHandle` e o `DragHandle` continuam existindo, e nenhuma tela muda.
- Na mesma mudança:
  - o bullet do `Drawer` em `AGENTS.md` ("A alça é da superfície…") ganha a regra;
  - a página `src/app/designsystem/docs/drawer.tsx` (o parágrafo da alça, ~linha 229) diz o mesmo;
  - `docs/design/HISTORICO-DESIGN-SYSTEM.md` ganha a "Rodada 380 — a gaveta com ✕ perde a alça".
- Sem prettier. Comentários em português. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Depois do commit, `graphify update .`.
- Sem navegador no subagente (o banco é de produção). Quem confere a tela é o controlador.

## Review Focus

- **Arrastar para baixo continua fechando** (pedido do dono, 17/11/2026: "mantenha a ação de poder arrastar para baixo para fechar"). O vaul arrasta pela gaveta inteira enquanto ninguém passa `handleOnly`, e a alça escondida não pode virar a única área de arraste. O teste trava que `drawer.tsx` não contém `handleOnly`.
- **Gaveta com degraus e ✕:** a alça fica. A classe não pode entrar quando `degraus` é verdadeiro.
- **Gaveta aninhada:** o `has` olha os descendentes do `DrawerContent`, e a gaveta de dentro é portalizada. O ✕ dela não pode esconder a alça da de fora. Confira que o seletor fica preso ao `group/dialog-content` da própria superfície.
- **Gaveta de cima** (`direction="top"`): a alça é a borda de baixo (`order-last`). Sem ✕, ela continua.

---

### Task 1: A alça some quando a gaveta tem ✕ e não tem degraus

**Files:**
- Modify: `src/components/ui/drawer.tsx` (o `DrawerContent`, ~linha 747: `{showHandle ? <DragHandle /> : null}`)
- Modify: `AGENTS.md`, `src/app/designsystem/docs/drawer.tsx`, `docs/design/HISTORICO-DESIGN-SYSTEM.md`
- Test: `src/components/ui/drawer-versions.test.ts`

- [x] **Step 1: Teste de fonte que falha** (`semComentarios(CODIGO)`), em `it("com ✕ e sem degraus a alça some, guardando o lugar")`:
  - contém `group-has-[[data-slot=dialog-close-button]]/dialog-content:invisible`;
  - não contém `handleOnly` (o arraste para fechar é da gaveta inteira, não só da alça);
  - casa `/<DragHandle className=\{degraus \? undefined : "group-has-\[\[data-slot=dialog-close-button\]\]\/dialog-content:invisible"\} \/>/`.
- [x] **Step 2: Rodar** `npx vitest run src/components/ui/drawer-versions.test.ts`. Esperado: FALHA.
- [x] **Step 3: Implementar** no `DrawerContent` exatamente a forma do teste, com um comentário de uma linha dizendo o porquê (o ✕ já é a saída, e `invisible` guarda os 26px da barra). Depois, a documentação das Global Constraints.
- [x] **Step 4: Rodar** `npx vitest run src/components/ui src/app/designsystem`, `npx tsc --noEmit` e `npx eslint src/components/ui/drawer.tsx`. Esperado: PASSA.
- [x] **Step 5: Commit** com `feat(drawer): a gaveta com ✕ e sem degraus não mostra a alça`.
