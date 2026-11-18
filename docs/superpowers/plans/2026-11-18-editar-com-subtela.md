# Editar o lançamento com o gesto da subtela Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No detalhe do lançamento, no telefone, tocar em Editar empurra o formulário pela direita, como uma subpágina. Cancelar ou salvar volta ao detalhe pela esquerda.

**Architecture:**
- **O gesto já existe:** é a subtela do Importar (`useTransicaoDaSubtela`, em `src/components/transactions/importar/transicao-da-subtela.ts`, com o CSS `html[data-subtela]` em `globals.css`). Ela usa a View Transitions API, com o nome `subtela-conteudo` só durante a troca, no elemento `[data-subtela-conteudo]`.
- **O que muda:** o detalhe (`transaction-detail-sheet.tsx`) troca `setDetailMode` por essa mesma transição.
- **Como reaproveitar:** o hook espera o `passo` do Importar mudar. Ele passa a ter uma forma genérica, sem espera, que o detalhe usa. O CSS não muda.

**Tech Stack:** React 19, View Transitions API, Tailwind v4, vitest.

**Spec:** pedido do dono (18/11/2026): "melhore a transição e a animação da tela quando eu clico em editar". Escolha dele: "use a animação que você já está usando em outras transições de tela", que é o gesto da subpágina e da subtela do app.

## Global Constraints

- **Mesmo gesto e mesmo CSS da subtela do Importar:**
  - `data-subtela="entra"` ao abrir a edição e `"volta"` ao sair dela;
  - `data-subtela-conteudo` no invólucro que troca dentro do `SheetContent`;
  - nada de keyframe ou seletor novo em `globals.css`.
- **Só no telefone** (`isMobile`), como a subtela e a subpágina. Fica seco no computador, sem View Transitions, com movimento reduzido ou com uma troca já em curso (`raiz.dataset.subtela`).
- **Todos os caminhos de entrada e saída animam:**
  - **entra:** o Editar do menu ⋯, o do card "A conferir" e o `abrir(t, { editar: true })`, mas só quando o detalhe já está aberto;
  - **volta:** o Cancelar do formulário, o `onClose` do formulário e o `onSuccess` (salvou).
- **O `view-transition-name` nunca fica permanente:** a regra do `AGENTS.md` e de `transicao-de-subpagina.test.ts` continua valendo, e o nome só existe sob `html[data-subtela]`.
- **Abrir o detalhe já em edição** (vindo da lista com "Editar") não anima a entrada: a gaveta é que abre.
- **A refatoração do hook não muda o Importar:** o comportamento dele continua o mesmo (`importar-extrato-dialog.test.ts` passa).
- Sem prettier. Comentários em português. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Depois, `graphify update .`.
- Sem navegador no subagente: o banco é de produção.

## Review Focus

- **Fechar a gaveta no meio da troca:** o `data-subtela` sai do `<html>` (o `finished.finally` já faz isso), e a próxima troca não fica travada.
- **Salvar com erro** (`onSuccess` não chamado): continua no formulário, sem gesto.
- **Duas trocas seguidas rápidas:** a segunda fica seca, sem quebrar.

---

### Task 1: O detalhe troca para a edição com o gesto da subtela

**Files:**
- Modify: `src/components/transactions/importar/transicao-da-subtela.ts`, que exporta também a forma genérica
- Modify: `src/components/transactions/transaction-detail-sheet.tsx` (`editar` ~linha 337, `onClose`/`onSuccess` do `useTransactionForm` ~linha 227, `onCancel` ~linha 650 e o invólucro do conteúdo ~linha 639)
- Test: `src/components/transactions/transaction-detail-sheet.test.ts`

**Interfaces:**
- Produces:
  - `export function useTrocaDeSubtela(ativo: boolean): (direcao: "entra" | "volta", acao: () => void) => void`, no mesmo arquivo. A troca é síncrona: `startViewTransition(() => flushSync(acao))`, sem espera. Ela guarda as mesmas saídas secas e o mesmo `finished.finally` do `useTransicaoDaSubtela`, que passa a usá-la por dentro ou divide com ela as partes comuns.

- [ ] **Step 1: Testes que falham** (fonte do detalhe, sem comentários):
  - contém `useTrocaDeSubtela(isMobile` e `data-subtela-conteudo`;
  - `editar` chama a troca com `"entra"`;
  - o `onCancel`, o `onClose` e o `onSuccess` chamam a troca com `"volta"`;
  - não sobra `setDetailMode("edit")` fora da troca.
- [ ] **Step 2: Rodar** `npx vitest run src/components/transactions`. Esperado: FALHA.
- [ ] **Step 3: Implementar** como nas Global Constraints. O invólucro com `data-subtela-conteudo` envolve os dois ramos, `edit` e `viewBody`, num elemento `flex min-h-0 flex-1 flex-col`. Ele não pode mudar o layout de hoje: o `viewBody` precisa seguir rolando com o cabeçalho translúcido, então confira a cadeia `[&>*:has(>[data-slot=dialog-body])]` do `SheetContent`/`DrawerContent`.
- [ ] **Step 4: Rodar** `npx vitest run src/components/transactions`, `npx tsc --noEmit`, `npx eslint` nos arquivos tocados e `npm run ds:audit -- src/components/transactions/transaction-detail-sheet.tsx`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(detalhe): no telefone, Editar empurra o formulário como uma subtela, e voltar desliza de volta`.
