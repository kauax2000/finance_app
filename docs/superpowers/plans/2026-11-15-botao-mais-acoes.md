# Transações no telefone: o ⋯ com a pele das abas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o ⋯ ao lado das abas de Transações no telefone veste `Button variant="floating"`.

**Architecture:** `MenuMaisAcoes` recebe `variant` e o repassa ao gatilho; só a barra do telefone pede `floating`.

**Tech Stack:** Next 16, React 19, Vitest (testes de fonte).

**Spec:** `docs/superpowers/specs/2026-11-15-botao-mais-acoes-design.md`

## Global Constraints

- Não tocar em `src/components/ui/` nem em `src/app/globals.css`; nada de `className` para tirar a sombra do `floating`.
- O ⋯ do cabeçalho do desktop (`src/app/(app)/transactions/page-client.tsx`) não muda.
- Sem prettier. `git add` só dos arquivos da tarefa (nunca `graphify-out/graph.json`). Commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push. Comentários em português.

## Review Focus

- O desktop continua terciário: o padrão da prop é `"tertiary"` e o `page-client.tsx` não passa `variant`.

---

### Task 1: `MenuMaisAcoes variant`

**Files:**
- Modify: `src/components/transactions/transacoes-toolbar.tsx` (`MenuMaisAcoes` e o uso dentro de `TransacoesToolbar`)
- Test: `src/app/(app)/transactions/page-client.test.ts`

**Interfaces:**
- Produces: `MenuMaisAcoes({ onImportar?, onExportar?, exportando?, variant? }: { …; variant?: "tertiary" | "floating" })`, padrão `"tertiary"`.

- [ ] **Step 1: Write the failing test**

No `it` do convidado (que já lê `transacoes-toolbar.tsx` como `barra`) ou num `it` novo, `"no telefone o ⋯ veste a pele das abas (floating); no desktop segue terciário"`:

```ts
const barra = fonte("src/components/transactions/transacoes-toolbar.tsx")
expect(barra).toMatch(/variant = "tertiary"/)
expect(barra).toMatch(/<Button type="button" variant=\{variant\} size="icon-md" aria-label="Mais ações">/)
expect(barra).toMatch(/<MenuMaisAcoes[^>]*variant="floating"/)
expect(f).not.toMatch(/<MenuMaisAcoes[^>]*variant=/)
```

(`f` é a fonte de `page-client.tsx`, já lida no arquivo.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run "src/app/(app)/transactions/page-client.test.ts"`
Expected: o `it` novo FAIL.

- [ ] **Step 3: Implement**

Somar a prop `variant` (com o padrão `"tertiary"` na desestruturação) e repassá-la ao `Button`; na `TransacoesToolbar`, `<MenuMaisAcoes … variant="floating" />`. Comentário de uma linha: no telefone o ⋯ veste a pele das abas ao lado.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run "src/app/(app)/transactions/page-client.test.ts" && npx tsc --noEmit && npx eslint src/components/transactions/transacoes-toolbar.tsx && npm run ds:audit -- src/components/transactions/transacoes-toolbar.tsx`
Expected: PASS, sem erro, auditor sem violação nova.

- [ ] **Step 5: Commit**

```bash
git add src/components/transactions/transacoes-toolbar.tsx "src/app/(app)/transactions/page-client.test.ts"
git commit -m "feat(transacoes): no telefone o ⋯ veste a pele das abas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2 (controlador): conferir a 375px e no desktop; `graphify update .`.
