# Gaveta sem Cancelar quando tem ✕ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No telefone, a gaveta que tem ✕ perde o `FormCancel` do rodapé ("Cancelar", "Agora não", "Voltar"). O Voltar do Importar sobe para o canto esquerdo do cabeçalho, como o ‹ da subtela.

**Architecture:**
- **Task 1, o design system.** O `FormCancel` (`src/components/ui/form.tsx`) ganha uma classe só de CSS. Abaixo de 768px, dentro do `DialogFooter` (`[data-slot=dialog-footer]`) de uma gaveta (`[data-slot=sheet-content]`) que tem um ✕ (`[data-slot=dialog-close-button]`), ele vira `hidden`. Nenhuma tela muda código.
- **Task 2, o Importar.** O ‹ do canto esquerdo (`absolute top-2.5 left-2.5 z-20`, hoje só na subtela) passa a aparecer no telefone em todo passo que tem Voltar no rodapé:
  - na subtela, volta pela transição (`trocarDeTela("volta", imp.voltar)`), com o rótulo "Voltar à conferência";
  - nos outros passos chama `imp.voltar`, com o rótulo "Voltar".

**Tech Stack:** React, Tailwind v4, vitest (testes de fonte).

**Spec:** pedido do dono, 17/11/2026:
- "sim, faça assim": sai o Cancelar do rodapé em toda gaveta do telefone que tem ✕; no desktop fica.
- "o voltar pode ficar do lado esquerdo do header".

## Global Constraints

- Só abaixo de 768px (`max-md:`) e só em gaveta com ✕. O desktop e os diálogos centrados (fora de `sheet-content`) não mudam.
- O `FormCancel` fora do `DialogFooter` não muda. Exemplo: o `FormActions` de edição em linha de `partes-da-despesa.tsx`, que cancela a edição e não fecha a gaveta.
- `src/components/ui/` está autorizado pelo dono (17/11/2026). Atualize na mesma mudança:
  - o bullet do rodapé de diálogo em `AGENTS.md` ("Rodapé de diálogo: uma hierarquia só") com a regra do telefone;
  - a página `src/app/designsystem/docs/form.tsx`, onde o `FormCancel` é documentado, com uma frase;
  - `docs/design/HISTORICO-DESIGN-SYSTEM.md`, com a "Rodada 381 — a gaveta com ✕ não repete o Cancelar".
- Sem prettier. Comentários em português. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. Cada commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Depois de cada commit, `graphify update .`.
- Sem navegador no subagente: o banco é de produção.

## Review Focus

- **Três ações no rodapé** (`TresAcoesContext`): com o `FormCancel` escondido, o rodapé do telefone fica com a ação principal e a do `start`. Ninguém fica sem saída, porque o ✕ continua no topo.
- **Gaveta sem ✕:** o Cancelar continua; o seletor exige o ✕ na mesma `sheet-content`.
- **Gaveta aninhada:** a de dentro é portalizada, e o ✕ dela não esconde o Cancelar da de fora.
- **Importar, passo Arquivo:** sem ‹ (o rodapé de lá tem Cancelar, e não Voltar). Com a importação travada (`travado`), o ‹ fica `disabled`, como o Voltar fazia.

---

### Task 1: O FormCancel some no rodapé da gaveta com ✕

**Files:**
- Modify: `src/components/ui/form.tsx` (`FormCancel`, ~linha 859)
- Modify: `AGENTS.md`, `src/app/designsystem/docs/form.tsx`, `docs/design/HISTORICO-DESIGN-SYSTEM.md`
- Test: `src/components/ui/form-versions.test.ts` (crie, se não existir, com `lerFonte`/`semComentarios` de `@/test/fonte`)

- [x] **Step 1: Teste de fonte que falha.** `semComentarios(lerFonte("src/components/ui/form.tsx"))` contém a classe exata `max-md:[[data-slot=sheet-content]:has([data-slot=dialog-close-button])_[data-slot=dialog-footer]_&]:hidden`.
- [x] **Step 2: Rodar** `npx vitest run src/components/ui/form-versions.test.ts`. Esperado: FALHA.
- [x] **Step 3: Implementar.** No `FormCancel`, passe `className={cn(<a classe>, className)}` (desestruture `className`), com um comentário de uma linha dizendo o porquê. Depois, a documentação.
- [x] **Step 4: Rodar** `npx vitest run src/components/ui src/app/designsystem`, `npx tsc --noEmit` e `npx eslint src/components/ui/form.tsx`. Esperado: PASSA.
- [x] **Step 5: Commit** com `feat(form): na gaveta com ✕, o FormCancel do rodapé some no telefone`.

### Task 2: O Voltar do Importar sobe para o canto esquerdo no telefone

**Files:**
- Modify: `src/components/transactions/importar/importar-extrato-dialog.tsx` (o bloco `{subtela ? (<Button … aria-label="Voltar à conferência" …` logo depois do `</Form>`, ~linha 604)
- Test: `src/components/transactions/importar/importar-extrato-dialog.test.ts`

**Interfaces:**
- Consumes: Task 1 (o Voltar do rodapé, um `FormCancel`, já some sozinho no telefone).

- [x] **Step 1: Teste de fonte que falha** (`semComentarios`):
  - `dialogo` contém `const voltarNoTopo = celular && (imp.passo === "conferir" || imp.passo === "colunas")`;
  - casa `/<\/Form>[\s{}]*\{voltarNoTopo \? \(\s*<Button/`;
  - contém `aria-label={subtela ? "Voltar à conferência" : "Voltar"}`;
  - contém `onClick={() => (subtela ? trocarDeTela("volta", imp.voltar) : imp.voltar())}`.
  - Ajuste a asserção antiga do ‹ da subtela (a que casa `\{subtela \? \(\s*<Button`) para a forma nova.
- [x] **Step 2: Rodar** `npx vitest run src/components/transactions/importar`. Esperado: FALHA.
- [x] **Step 3: Implementar** a forma do teste. Mantenha `disabled={travado}` e a `className` atual do ‹.
- [x] **Step 4: Rodar** `npx vitest run src/components/transactions/importar`, `npx tsc --noEmit`, `npx eslint src/components/transactions/importar` e `npm run ds:audit -- src/components/transactions/importar`. Esperado: PASSA.
- [x] **Step 5: Commit** com `feat(importar): no telefone, o Voltar mora no canto esquerdo do cabeçalho`.
