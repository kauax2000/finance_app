# Modos do Valor em chips no telefone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Na gaveta do telefone, os 5 modos do filtro de Valor (até, a partir de, entre, igual a, por volta de) viram chips de escolha que quebram de linha, no lugar do trilho de abas apertado.

**Architecture:** No `EditorDeDinheiro` (`src/components/ui/filter-bar.tsx`, cerca da linha 1977), quando `naGaveta` for verdadeiro, o `ToggleGroup variant="floating"` dá lugar a um `RadioGroup variant="chip"` (`src/components/ui/radio-group.tsx`), com os mesmos valores (`OPERADORES.money`) e os mesmos rótulos (`rotuloOperador`). O desktop (popover) continua com o `ToggleGroup`.

**Tech Stack:** React, Radix RadioGroup (pela peça do DS), vitest.

**Spec (design curto, aprovado pelo dono em 16/11/2026):**
- **Por quê:** no telefone, 5 modos num trilho de ~360px ficam apertados, com uns 4px entre os rótulos.
- **Abordagens:** A, chips em duas linhas (escolhida); B, uma linha "Condição" que abre um `Select`; C, abas com "⋯ Mais"; D, uma lista de rádio estilo iOS. B, C e D foram recusadas por custarem um toque a mais, esconderem modos ou baterem no teclado.
- **Decisões minhas:** só no telefone (`naGaveta`); a escolha é um `RadioGroup` (escolha única é rádio, não `aria-pressed`); o valor obrigatório não desmarca (sem `deselectable`).

## Global Constraints

- Reusar o `RadioGroup` e o `RadioGroupItem` com `variant="chip"`. Nada de chip escrito à mão nem de `Toggle` com `aria-pressed`.
- O desktop não muda: fora da gaveta, o `ToggleGroup` continua igual.
- O nome acessível do grupo continua "Modo".
- Sem prettier. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **Troca de modo:** tocar num chip chama `onModo(op)` com o operador certo. Os campos de valor e a frase mudam como hoje.
- **Altura do toque:** no dedo, cada chip precisa alcançar o alvo de 44px. Confira o que a peça `chip` já entrega.
- **Duas fileiras de chips:** os chips de valor redondos (`Toggle variant="chip"`, R$ 50…) ficam abaixo do campo. Os de modo ficam acima e não podem se confundir com eles; a escolha marcada precisa ficar clara.

---

### Task 1: RadioGroup chip no editor de Valor da gaveta

**Files:**
- Modify: `src/components/ui/filter-bar.tsx` (`EditorDeDinheiro`, o bloco do `ToggleGroup`, ~linhas 1974–1991)
- Test: `src/components/ui/filter-bar-gaveta.test.ts`

- [ ] **Step 1: Teste que falha**

```ts
it("na gaveta os modos do Valor são chips de rádio que quebram linha; no desktop, o trilho", () => {
  const src = semComentarios(lerFonte("src/components/ui/filter-bar.tsx"), "tudo")
  expect(src).toMatch(/naGaveta\s*\?\s*\(\s*<RadioGroup[\s\S]{0,200}variant="chip"[\s\S]{0,200}aria-label="Modo"/)
  expect(src).toMatch(/<ToggleGroup[\s\S]{0,120}variant="floating"[\s\S]{0,200}aria-label="Modo"/)
})
```

Se o `EditorDeDinheiro` não tiver acesso a `naGaveta`, leia com `useIsMobile()`, como os outros editores fazem. Ajuste a regex à forma final, mantendo o que ela confere.

- [ ] **Step 2: Rodar** `npx vitest run src/components/ui/filter-bar-gaveta.test.ts`. Esperado: FALHA.
- [ ] **Step 3: Implementar** o ramo do telefone: `<RadioGroup variant="chip" value={operador} onValueChange={(op) => onModo(op as FilterOperator)} aria-label="Modo">` com um `RadioGroupItem value={op}` por modo, rotulado por `rotuloOperador(op)`. Siga a API real da peça (leia `radio-group.tsx` e a página `/designsystem/radio` antes).
- [ ] **Step 4: Rodar** `npx vitest run src/components/ui/filter-bar` e `npx tsc --noEmit`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(filter-bar): na gaveta os modos do Valor são chips que quebram linha`.
