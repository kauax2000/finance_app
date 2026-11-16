# Filtro ao vivo com pausa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A consulta de transações espera 250ms depois da última mudança de filtro ou busca. O campo e a URL continuam respondendo na hora.

**Architecture:** Em `use-transacoes-da-tela.ts`, o `filtros` e o `q` que entram na `queryKey` passam por `useDebouncedValue(…, 250)`, o hook que a paleta já usa. O `keepPreviousData` segura a lista anterior durante a pausa.

**Tech Stack:** React, TanStack Query, vitest (testes de fonte com `lerFonte`/`semComentarios`).

**Spec:** docs/superpowers/specs/2026-11-16-filtro-ao-vivo-com-pausa-design.md

## Global Constraints

- Reusar `useDebouncedValue` de `@/hooks/use-debounced-value`, com 250ms (o mesmo valor da paleta, `app-command-palette.tsx:281`). Não escrever outro debounce.
- Atrasar só `filtros` e `q`. `type`, `sort` e `page` continuam imediatos.
- Nada em `src/components/ui/`. Sem prettier. Nunca `git add graphify-out/graph.json`. Sem push. O commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **Identidade estável:** o valor passado ao `useDebouncedValue` precisa manter a mesma identidade entre renders quando não muda. Se `estado.filtros` for um objeto novo a cada render, o timer reinicia para sempre e a consulta nunca sai. Use um valor estável, como a serialização (`serializeFilters`/string), ou confirme que `estado.filtros` já é memoizado.
- **Outros usos do estado:** contagem, vazio por filtro e "Limpar filtros" devem continuar lendo o estado imediato. Só a chave da consulta é atrasada.
- **Cache da página:** a primeira carga, sem mudança, não pode esperar 250ms a mais por causa de um timer. O valor inicial do hook é o próprio valor, então já sai na hora.

---

### Task 1: Chave da consulta com pausa

**Files:**
- Modify: `src/components/transactions/use-transacoes-da-tela.ts` (~linhas 185–196, `estadoDaChave`)
- Test: `src/components/transactions/use-transacoes-da-tela-pausa.test.ts` (novo, teste de fonte)

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const HOOK = semComentarios(lerFonte("src/components/transactions/use-transacoes-da-tela.ts"), "tudo")

describe("consulta de transações com pausa", () => {
    it("reusa o useDebouncedValue da paleta, com 250ms", () => {
        expect(HOOK).toContain('from "@/hooks/use-debounced-value"')
        expect(HOOK).toMatch(/useDebouncedValue\([^)]*,\s*250\)/)
    })
    it("a chave da consulta lê o valor atrasado", () => {
        expect(HOOK).not.toMatch(/estadoDaChave[^=]*=\s*\{[^}]*filtros:\s*estado\.filtros/)
    })
})
```

- [ ] **Step 2: Rodar** `npx vitest run src/components/transactions/use-transacoes-da-tela-pausa.test.ts`. Esperado: FALHA.

- [ ] **Step 3: Implementar.** Atrasar `filtros` e `q` com `useDebouncedValue(…, 250)` e montar `estadoDaChave` com os valores atrasados. Atenção ao item de identidade estável do Review Focus. Deixar um comentário de uma linha com o porquê ("a consulta espera a pessoa parar de digitar, como a paleta").

- [ ] **Step 4: Rodar** o teste novo, depois `npx vitest run src/components/transactions` e `npx tsc --noEmit`. Esperado: PASSA.

- [ ] **Step 5: Commit**

```bash
git add src/components/transactions/use-transacoes-da-tela.ts src/components/transactions/use-transacoes-da-tela-pausa.test.ts
git commit -m "feat(transacoes): a consulta espera 250ms depois do filtro, como a paleta"
```
