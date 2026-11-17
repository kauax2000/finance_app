# Filtro do ⋯ indicado na conferência Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No telefone, com uma pendência do ⋯ ligada ("Sem categoria", "Já existem" ou "Sugeridas"), a aba Todos continua acesa. A legenda e um ponto no ⋯ dizem que há filtro.

**Architecture:**
- `conferir-importacao.tsx` (C): `FiltrosDaConferencia`, `PendenciasNoMenu` e a legenda "Toque numa linha…" (~1075).
- `importar-extrato-dialog.tsx` (D): o gatilho ⋯ no `DialogHeaderRow`.

O estado continua um só, `imp.filtro`.

**Tech Stack:** React, Tailwind v4, vitest (testes de fonte).

**Spec (dono, 16/11/2026, opção A "Legenda + ponto"):**
1. **Aba acesa.** No telefone, com o `imp.filtro` numa pendência (filtro com `so_com_linhas`), o `Tabs` recebe `value="todos"` e a aba Todos fica acesa. Tocar em Saídas ou Entradas troca o filtro e desliga a pendência, como hoje.
2. **Legenda.** A linha "Toque numa linha para trocar a categoria" (só telefone) vira, com uma pendência ligada, `Só sem categoria (28) · Mostrar todos`. "Mostrar todos" é um `Button variant="link"` com `type="button"` que faz `imp.setFiltro("todos")`. A frase de cada pendência vem de um campo novo em `FILTROS`, `so`, com estes valores literais: `"Só sem categoria"`, `"Só as que já existem"` e `"Só as sugeridas"`. A contagem sai de `numberBR(imp.contagens[f.valor])`, entre parênteses. Sem pendência, a legenda é a de hoje.
3. **Ponto no ⋯.** Com uma pendência ligada, o gatilho ⋯ de D mostra o `BadgeDot` do design system (`badge.tsx`) no canto de cima à direita. Use o tom que o app usa para "não lido" ou "atenção"; leia a API do `BadgeDot` e escolha por ela, sem `pulse`. O nome acessível do gatilho vira `"Mais ações, filtro ligado"`. O ponto é `aria-hidden`.

## Global Constraints

- Só no telefone (`celular` / `comMenu`). O desktop não muda: lá as pendências continuam abas.
- Só peças do design system. Nada novo em `src/components/ui/`. Classes de posição (`relative`, `absolute top-… right-…`) na tela valem; não recrie a bolha das notificações à mão.
- Sem prettier. Nunca `git add graphify-out/graph.json` nem `CLAUDE.md`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Comentários em português.
- Sem navegador no subagente: o banco é de produção.

## Review Focus

- **A pendência zera com ela ligada** (a pessoa categoriza a última): a legenda mostra `(0)` e o "Mostrar todos" continua funcionando.
- **Tocar em Todos com a pendência ligada:** o `onValueChange` do Radix não dispara, porque o valor já é "todos". A saída é o "Mostrar todos" ou o ⋯; isso é aceito.
- **O menu ainda marca a pendência** (`checked={imp.filtro === f.valor}`) com a aba Todos acesa.

---

### Task 1: Aba Todos acesa, legenda e ponto no ⋯

**Files:**
- Modify: `src/components/transactions/importar/conferir-importacao.tsx`
- Modify: `src/components/transactions/importar/importar-extrato-dialog.tsx`
- Test: `src/components/transactions/importar/importar-extrato-dialog.test.ts`

- [ ] **Step 1: Teste de fonte que falha** (`semComentarios`), num `describe("no telefone, o filtro do ⋯ aparece sem apagar a aba Todos")`:
  - `conferir` contém `so: "Só sem categoria"`, `so: "Só as que já existem"` e `so: "Só as sugeridas"`;
  - `conferir` contém `Mostrar todos` dentro de um `<Button` com `variant="link"` e `onClick={() => imp.setFiltro("todos")}`;
  - `conferir` publica a pendência ligada num helper exportado `export function pendenciaLigada(` (devolve o item de `FILTROS` ou `undefined`), usado nas abas (o valor do `Tabs` no telefone vira `"todos"`) e na legenda;
  - `dialogo` usa `pendenciaLigada(imp)` e `<BadgeDot` perto do gatilho `aria-label`, e contém `"Mais ações, filtro ligado"`.
- [ ] **Step 2: Rodar** `npx vitest run src/components/transactions/importar`. Esperado: FALHA.
- [ ] **Step 3: Implementar** como na Spec.
- [ ] **Step 4: Rodar** `npx vitest run src/components/transactions/importar`, `npx tsc --noEmit`, `npx eslint src/components/transactions/importar` e `npm run ds:audit -- src/components/transactions/importar`. Esperado: PASSA.
- [ ] **Step 5: Commit** com `feat(importar): no telefone, o filtro do ⋯ deixa Todos aceso e aparece na legenda e num ponto no ⋯`. Depois, rode `graphify update .`.
