# Transações: linha de filtros fora do telefone — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** abaixo de 768px, esconder a linha do `FilterBar` na tela de Transações, mantendo-a montada para o botão de filtro do cabeçalho continuar abrindo a gaveta.

**Architecture:** `max-md:hidden` no invólucro `raizDosFiltros` de `transacoes-toolbar.tsx` e no invólucro do `FilterBarSkeleton` no esqueleto. Nenhum componente de `src/components/ui/` muda.

**Tech Stack:** Next 16, React 19, Tailwind v4, Vitest (testes de fonte).

**Spec:** `docs/superpowers/specs/2026-11-15-transacoes-filtro-mobile-design.md`

## Global Constraints

- Não tocar em `src/components/ui/` nem em `src/app/globals.css` (invariante 6).
- O corte é `max-md:` (48rem, o mesmo de `useIsMobile`); o desktop não muda.
- O `FilterBar` continua montado no telefone: o `onOpen` do `usePageChromeFilter` clica em `[data-slot=filter-bar-add]` dentro de `raizDosFiltros`.
- Sem prettier. `git add` só dos arquivos da tarefa (nunca `graphify-out/graph.json`). Commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push.
- Depois do código: `graphify update .`.

## Review Focus

- Filtro ativo no telefone: a linha continua escondida (opção A); o ponto de ativo é do cabeçalho — coberto pelo teste (nenhum `n > 0` condiciona a classe).
- Gaveta aberta pelo atalho com o gatilho escondido: o `Popover mobile="sheet"` não ancora no gatilho — conferido no navegador pelo controlador (não dá para testar por fonte).
- Janela entre 768px e a quebra `@max-3xl` da linha: a linha aparece (desktop) — o teste exige `max-md:`, não `@max-3xl`.

---

### Task 1: esconder a linha e o osso no telefone

**Files:**
- Modify: `src/components/transactions/transacoes-toolbar.tsx:73` (o `div ref={raizDosFiltros}`)
- Modify: `src/components/transactions/transactions-page-skeleton.tsx:46` (o `div` em volta do `FilterBarSkeleton`)
- Test: `src/app/(app)/transactions/page-client.test.ts`

**Interfaces:**
- Consumes: nada novo.
- Produces: nada novo.

- [ ] **Step 1: Write the failing tests**

No `describe` que já lê `transacoes-toolbar.tsx` (ou num `it` novo no mesmo arquivo), `it("no telefone a linha de filtros some, montada para o atalho do cabeçalho", …)`:

```ts
const barra = fonte("src/components/transactions/transacoes-toolbar.tsx")
expect(barra).toMatch(/<div ref=\{raizDosFiltros\} className="[^"]*\bmax-md:hidden\b[^"]*">\s*<FilterBar\b/)
expect(barra).toContain('querySelector<HTMLButtonElement>("[data-slot=filter-bar-add]")?.click()')
```

No `describe("o esqueleto da página (spec §6.5)")`, `it("o osso da linha de filtros some no telefone", …)`:

```ts
expect(esqueleto).toMatch(/<div className="[^"]*\bmax-md:hidden\b[^"]*">\s*<FilterBarSkeleton\b/)
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run "src/app/(app)/transactions/page-client.test.ts"`
Expected: os dois testes novos FAIL; os outros PASS.

- [ ] **Step 3: Implement**

Somar `max-md:hidden` à `className` dos dois invólucros (mantendo as classes atuais). Atualizar o comentário acima do `return` da barra e o docstring do esqueleto para dizer que no telefone a linha de filtros fica escondida e o filtro abre pelo botão do cabeçalho.

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run "src/app/(app)/transactions/page-client.test.ts" && npx tsc --noEmit && npx eslint src/components/transactions/transacoes-toolbar.tsx src/components/transactions/transactions-page-skeleton.tsx && npm run ds:audit -- src/components/transactions/transacoes-toolbar.tsx src/components/transactions/transactions-page-skeleton.tsx`
Expected: tudo PASS, auditor sem violação nova.

- [ ] **Step 5: Commit**

```bash
git add src/components/transactions/transacoes-toolbar.tsx src/components/transactions/transactions-page-skeleton.tsx "src/app/(app)/transactions/page-client.test.ts"
git commit -m "feat(transacoes): a linha de filtros sai do telefone

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2 (controlador): conferir, documentar a jornada, republicar o Atlas

- [ ] A 375px em `/transactions`: a linha não aparece; o botão de filtro do cabeçalho abre "Filtrar por…"; aplicar um filtro acende o ponto e filtra; a 1280px a linha segue igual.
- [ ] `docs/JORNADAS.md`, linha "Filtros da lista": trocar "No telefone, o botão de filtro do cabeçalho abre o \"+ Filtro\" da barra" por "No telefone a barra fica escondida (montada) e o filtro abre só pelo botão do cabeçalho, que mostra o ponto de ativo".
- [ ] `docs/atlas/template.html`, "Lista": a mesma troca, e a data da capa; `python3 docs/atlas/build.py`; republicar `docs/atlas/atlas-jornadas.html` em https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL.
- [ ] `graphify update .`; commit dos docs.
