# Carteira no centro do header do telefone — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No telefone, o seletor de carteira fica no centro do header em todas as telas, sem andar para o lado entre Painel, Transações e Categorias.

**Architecture:** O header (`app-header.tsx`) põe o seletor num bloco `absolute flex justify-center`. No Painel ele entra direto e encolhe ao conteúdo; nas outras telas entra dentro do `TopBarTitle`, cuja célula é um `<span>` de largura cheia, e o embrulho do seletor (`<div className="flex min-w-0 max-w-full">`, em `workspace-switcher.tsx`, só no `appearance="header"`) vira um bloco flex de largura cheia, com o botão encostado à esquerda. Medido a 450px: Painel 123,5–326,5 (centrado), Transações 112–315 (11,5px à esquerda). Abaixo de ~400px o nome trunca, o botão enche o bloco e o erro some — por isso não aparecia a 375px.

**Correção:** `justify-center` no embrulho do `appearance="header"`. Onde ele encolhe (Painel), não muda nada; onde ocupa a largura (dentro do título), centra o botão.

**Tech Stack:** React, Tailwind, Vitest (teste de fonte).

**Spec:** pedido do dono (20/11/2026, nesta conversa) com os prints do Painel e de Transações: "sempre fique no centro do header como um todo e não fique alterando de posição".

## Global Constraints

- Nada em `src/components/ui/` (o `TopBarTitle` fica como está).
- `appearance="header"` só é usado em `src/components/layout/app-header.tsx:131`.

## Review Focus

- Nome longo que trunca: o botão continua encolhendo (`min-w-0`) e o nome corta com "…".
- Painel: posição idêntica à de hoje.

---

### Task 1: Centrar o embrulho do seletor no header

**Files:**
- Modify: `src/components/layout/workspace-switcher.tsx:142`
- Test: `src/components/layout/workspace-switcher-header.test.ts` (novo)

- [ ] **Step 1: Teste que falha** — `workspace-switcher-header.test.ts`, com `lerFonte` e `semComentarios` de `@/test/fonte`:

```ts
it("no header, o embrulho do seletor centra o botão", () => {
  const f = semComentarios(lerFonte("src/components/layout/workspace-switcher.tsx"))
  expect(f).toContain('<div className="flex min-w-0 max-w-full justify-center">{menu}</div>')
})
```

- [ ] **Step 2:** `npx vitest run src/components/layout/workspace-switcher-header.test.ts` → FAIL.
- [ ] **Step 3:** Acrescentar `justify-center` à classe da linha 142, e uma linha no comentário acima dizendo por quê (dentro do `TopBarTitle` o embrulho ocupa a largura).
- [ ] **Step 4:** vitest do arquivo + `npx tsc --noEmit` + `npx eslint src/components/layout/workspace-switcher.tsx` → PASS / limpo.
- [ ] **Step 5: Commit** `fix(header): a carteira fica no centro em todas as telas do telefone`.
- [ ] **Step 6 (controlador):** medir a 450px e 375px no Painel, Transações e Categorias: o centro do botão = metade da largura.
