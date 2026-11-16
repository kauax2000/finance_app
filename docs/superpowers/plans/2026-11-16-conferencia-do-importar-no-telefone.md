# Conferência do Importar no telefone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar a opção B na conferência do Importar no telefone: o ⋯ no cabeçalho, as abas sozinhas, a busca pelo ⋯, uma linha só nas duas vistas e o Total acima do botão, tudo com as transições animadas.

**Architecture:** `importar-extrato-dialog.tsx` (D) monta o cabeçalho; `conferir-importacao.tsx` (C) monta abas, barra, lista, tabela e Saldo. No telefone (`useIsMobile()`), D põe um `DialogHeaderRow` com `endAdornment` = ⋯. O estado da busca e o "abrir busca" sobem para D, ou para o hook `use-importar-extrato.ts`, se for mais limpo. C esconde no telefone a barra "Colunas", a lupa e o "Ações" da linha das abas. O desktop não muda.

**Tech Stack:** Next 16, React, Tailwind v4, DataTable (TanStack), vitest (testes de fonte com `lerFonte`/`semComentarios`).

**Spec:** docs/superpowers/specs/2026-11-16-conferencia-do-importar-no-telefone-design.md

## Global Constraints

- Só no telefone (`useIsMobile()`, que C já usa como `celular`). O desktop fica idêntico.
- Só peças do design system. Nada novo em `src/components/ui/`. Se precisar, pare e reporte (BLOCKED).
- O gatilho ⋯ é `Button variant="tertiary" size="icon-md"`, sem `size-*` nem ícone com tamanho (regra do ⋯ no `AGENTS.md`), e leva `aria-label="Mais ações"`.
- Movimento: os presets de `importar/movimento.ts` e os utilitários do sistema. Nada de keyframe novo na tela. Com movimento reduzido, nada anima.
- Sem prettier. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Comentários em português.

## Review Focus

- **OFX (sem CSV):** o ⋯ não mostra Inverter nem Ajustar.
- **Ações das visíveis com a busca ativa:** agem sobre as linhas filtradas, como hoje.
- **⋯ com a gaveta "feito":** o ⋯ só existe no passo Conferir.
- **Total nas duas vistas:** o valor bate com o que o Saldo mostrava (entradas − saídas das que entram).
- **Leitor de tela:** o ⋯ tem nome, o título continua o `DialogTitle` e a busca aberta recebe o foco.

---

### Task 1: O ⋯ no cabeçalho e as abas sozinhas

**Files:** Modify `importar-extrato-dialog.tsx`, `conferir-importacao.tsx`. Test: `importar-extrato-dialog.test.ts`.

- [ ] **Step 1: Teste de fonte que falha.** Ele confere:
  - D usa `DialogHeaderRow` com `endAdornment` no telefone, contendo `DropdownMenu` e o gatilho `aria-label="Mais ações"`;
  - os itens "Buscar", "Inverter sinal" e "Ajustar colunas" ficam no menu, e os dois últimos são condicionados ao CSV;
  - em C, a barra "Colunas" e o `AcoesDasVisiveis` da linha das abas ficam só fora do telefone (`!celular`).
- [ ] **Step 2: Rodar** o teste. Esperado: FALHA.
- [ ] **Step 3: Implementar.**
  - Mova as ações das visíveis (Pôr categoria, Deixar fora, Trazer) para dentro do menu do ⋯, reaproveitando a lógica do `AcoesDasVisiveis`. Extraia os itens para um componente que os dois usem, sem duplicar.
  - Suba o estado da busca para D, para o item "Buscar" abri-la.
  - No telefone, as abas ficam `scrollable` na linha só delas.
  - O "Ver menos" vai para o pé da lista, onde fica o "Ver todos".
- [ ] **Step 4: Rodar** `npx vitest run src/components/transactions/importar` e `npx tsc --noEmit`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(importar): no telefone, as ações da conferência vão para o ⋯ do cabeçalho e as abas ficam sozinhas`.

### Task 2: Busca pelo ⋯, linha única e Total

**Files:** Modify `conferir-importacao.tsx` (e `busca-que-abre.tsx`, se preciso). Test: `importar-extrato-dialog.test.ts`.

- [ ] **Step 1: Teste de fonte que falha.** Ele confere:
  - no telefone, a busca aberta é uma linha abaixo das abas, nas duas vistas;
  - a linha do resumo põe a data (dd/mm) embaixo do valor, à direita, e embaixo do título fica "categoria · estorno";
  - as colunas da tabela no telefone (`meta.mobile`) põem a data no mesmo lugar, e a tabela no telefone fica sem borda de tabela (a variante do `DataTable` que já existe para isso; procure `mobileRow`);
  - o "Saldo" vira a linha "Total" no telefone, presente também com `expandido`.
- [ ] **Step 2: Rodar.** Esperado: FALHA.
- [ ] **Step 3: Implementar**, só com peças do sistema. Se o `DataTable` não tiver como pôr a data embaixo do valor no telefone, pare e reporte (BLOCKED) com a lacuna.
- [ ] **Step 4: Rodar** os mesmos testes e o `tsc`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(importar): no telefone, uma linha só nas duas vistas, a busca pelo ⋯ e o Total acima do botão`.

### Task 3: Transições animadas

**Files:** Modify `conferir-importacao.tsx` (e `movimento.ts`, só se faltar um preset composto dos utilitários que já existem). Test: `importar-extrato-dialog.test.ts`.

- [ ] **Step 1: Teste de fonte que falha.** Ele confere:
  - a lista do resumo remonta por aba (`key` com o filtro) e veste `ESCADA_DA_LISTA`;
  - o campo de busca veste um utilitário de brotar do sistema (`field-bloom` ou `menu-morph`) e tem `motion-reduce`;
  - o Ver todos e o Ver menos continuam com `VISTA_QUE_SAI` e a escada.
- [ ] **Step 2: Rodar.** Esperado: FALHA.
- [ ] **Step 3: Implementar.** Ao trocar de aba, a lista chega em escada. A busca brota da linha das abas ao abrir e some ao fechar (`menu-unmorph`, ou só esmaecendo).
- [ ] **Step 4: Rodar** os mesmos testes e o `tsc`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(importar): as transições da conferência no telefone (aba, busca, ver todos)`.
