# Contagem do filtro no botão Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No cabeçalho do telefone, a contagem de filtros ligados vira a bolha de contagem do `TopBarAction` (a mesma do sino das notificações), no canto do botão, e não o `Badge` dentro do ícone.

**Architecture:** O `TopBarAction` já desenha a bolha (`count`, `countLabel`, `data-slot="top-bar-action-count"`, `tagChipUnreadCount`, `ring-background`, a mola de entrada e saída). O `app-header` passa `count={filtro.count}` e `countLabel` ao botão do filtro e apaga o `Badge`. Como o `TopBarAction` soma a contagem ao nome ("Filtros, 2 ativos"), a tela de transações publica o `label` sem o número.

**Tech Stack:** Next 16, React, Tailwind v4, vitest (testes de fonte com `lerFonte`/`semComentarios` de `src/test/fonte.ts`).

**Spec:** pedido do dono em 16/11/2026: "use o mesmo alinhamento das notificações… coloque ele no botão e adicione o mesmo estilo do indicador das notificações". Sem doc de spec.

## Global Constraints

- Nenhuma mudança em `src/components/ui/` (a bolha já existe no `TopBarAction`).
- Nome acessível do botão com filtro: `"Filtros, 1 ativo"` / `"Filtros, N ativos"`; sem filtro: `"Filtros"`.
- Sem filtro com contagem (`count` 0/undefined) e `active` verdadeiro: continua o `ToolbarFilterIndicator` (o ponto), como hoje.
- Commit com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; nunca `git add graphify-out/graph.json`; sem push.

## Review Focus

- A bolha no segundo botão do `TopBarActionGroup` (lupa | filtro) não pode ser cortada pelo vidro do grupo (`overflow`/`clip-path` do voo) — conferir na prévia a 375px.
- Nome acessível não pode repetir o número ("Filtros: 1 ativo, 1").
- Contagem acima de 99 mostra "99+" (já é da bolha).

---

### Task 1: Bolha de contagem no botão do filtro

**Files:**
- Modify: `src/components/layout/app-header.tsx` (o `botaoDoFiltro`, ~linhas 150–180)
- Modify: `src/components/transactions/transacoes-toolbar.tsx:42` (o `label` publicado)
- Test: `src/components/layout/app-header-filtro-contagem.test.ts` (novo, teste de fonte)

**Interfaces:**
- Consumes: `TopBarAction` props `count?: number`, `countLabel?: string` (`src/components/ui/top-bar.tsx`); `PageChromeFilter.count?: number`.
- Produces: nada novo.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const HEADER = semComentarios(lerFonte("src/components/layout/app-header.tsx"), "tudo")
const TOOLBAR = semComentarios(lerFonte("src/components/transactions/transacoes-toolbar.tsx"), "tudo")

describe("contagem do filtro no cabeçalho", () => {
    it("usa a bolha do TopBarAction, como o sino", () => {
        expect(HEADER).toMatch(/count=\{filtro\.count\}/)
        expect(HEADER).toMatch(/countLabel=/)
        expect(HEADER).not.toMatch(/<Badge[^>]*>\s*\{filtro\.count\}/)
    })
    it("o nome publicado não repete o número", () => {
        expect(TOOLBAR).not.toContain("Filtros: ")
    })
})
```

- [ ] **Step 2: Run** `npx vitest run src/components/layout/app-header-filtro-contagem.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**
  - `app-header.tsx`: no `TopBarAction` do filtro, `count={filtro.count}` e `countLabel={filtro.count === 1 ? "1 ativo" : \`${filtro.count} ativos\`}`; o ramo do `Badge` sai, fica só `filtro.active && !filtro.count ? <ToolbarFilterIndicator … /> : null`. Remover o import de `Badge` se ficar sem uso. Apagar o comentário da contagem que fala do `--primary-accent`.
  - `transacoes-toolbar.tsx`: `label: "Filtros"` (a contagem já vai em `count: n`).

- [ ] **Step 4: Run** o teste novo, `npx vitest run src/components/layout src/components/transactions` e `npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/app-header.tsx src/components/transactions/transacoes-toolbar.tsx src/components/layout/app-header-filtro-contagem.test.ts
git commit -m "fix(cabecalho): contagem do filtro na bolha do TopBarAction, como o sino"
```
