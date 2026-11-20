# Ícone da notificação na 1ª linha do título — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Na linha de notificação, o centro do ladrilho (32) coincide com o centro da 1ª linha do título, com título de 1 ou 2 linhas; hora, ponto e ações ficam na altura do ladrilho.

**Architecture:** Só classes em `src/components/layout/notification-row.tsx`. A fileira do título (`<div className="flex min-h-6 items-center gap-2">`) passa a medir 32 e alinhar pelo topo; o título recebe um recuo de cima que centra a 1ª linha nos 32; as ações ficam numa caixa de 32 centrada; o deslocamento de 2px que o `ItemMedia` ganha com descrição é anulado nesta linha.

**Tech Stack:** React, Tailwind v4, Vitest (teste de fonte).

**Spec:** `docs/superpowers/specs/2026-11-20-icone-da-notificacao-na-primeira-linha-design.md`

## Global Constraints

- Nada em `src/components/ui/` nem `globals.css`.
- Valores arbitrários em `calc()` escrevem o `-` binário como `_-_` (regra do AGENTS.md).
- Medido hoje (desktop): ícone top 13 / altura 32, título de 1 linha com linha de 19,25px.

## Review Focus

- No toque (`pointer-coarse`) o ⋯ fica à vista: a fileira continua com 32 e o ⋯ centrado no ícone.
- No cursor, o ✓ e o excluir (`ACOES_NO_LUGAR`, `absolute ... top-1/2 -translate-y-1/2`) continuam centrados na caixa das ações.
- Título longo (2 linhas): a 2ª linha desce normal, sem espaço extra entre as linhas.

---

### Task 1: Alinhar ícone e 1ª linha do título

**Files:**
- Modify: `src/components/layout/notification-row.tsx` (o `ItemMedia` ~L100; a fileira do título ~L104; o `ItemTitle` ~L105; o `ItemActions` ~L133)
- Test: `src/components/layout/notifications-panel.test.ts`

- [ ] **Step 1: Teste que falha** — em `notifications-panel.test.ts`, um `it("o ícone e a 1ª linha do título dividem o centro (20/11/2026)")` lendo a fonte de `notification-row.tsx` (com `lerFonte`/`semComentarios`, como os vizinhos) e conferindo:

```ts
expect(f).toContain('<div className="flex min-h-8 items-start gap-2">')
expect(f).toContain("pt-[calc((--spacing(8)_-_1lh)/2)]")
expect(f).toContain('<ItemActions className="relative h-8 shrink-0 gap-1">')
expect(f).toContain("group-has-data-[slot=item-description]/item:translate-y-0")
expect(f).not.toContain("flex min-h-6 items-center gap-2")
```

- [ ] **Step 2:** `npx vitest run src/components/layout/notifications-panel.test.ts` → FAIL nesse teste.
- [ ] **Step 3: Implementar** exatamente as classes acima: a fileira `flex min-h-8 items-start gap-2`; no `ItemTitle`, somar `pt-[calc((--spacing(8)_-_1lh)/2)]` à lista do `cn(...)`; o `ItemActions` com `relative h-8 shrink-0 gap-1`; no `ItemMedia`, `className="group-has-data-[slot=item-description]/item:translate-y-0"`. Atualizar o comentário do `items-start` (L88) para dizer que o ícone centra na 1ª linha do título.
- [ ] **Step 4:** o vitest do arquivo + `npx tsc --noEmit` + `npx eslint src/components/layout/notification-row.tsx` → PASS / limpo; `npm run ds:audit -- src/components/layout/notification-row.tsx` sem violação nova.
- [ ] **Step 5: Commit** `fix(notificacoes): o ícone centra na 1ª linha do título`.
- [ ] **Step 6 (controlador):** medir no painel aberto, a 375px e no desktop: centro do ícone − centro da 1ª linha do título ≤ 1px, com título de 1 e de 2 linhas.
