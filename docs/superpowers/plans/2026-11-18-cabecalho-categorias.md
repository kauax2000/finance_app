# Cabeçalho de Categorias — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Categorias abre no desktop com o `PageHeader collapse` ("Categorias" + Nova categoria), no padrão de Transações e Membros.

**Architecture:** A página decide desktop/telefone com `useIsMobile()`, como Transações. No desktop o título e a ação moram no `PageHeader`, e a `CategoriesToolbar` recebe `onNewCategory={undefined}`. No telefone nada muda. O esqueleto ganha o osso do cabeçalho só no desktop.

**Tech Stack:** Next.js (app router), React, Tailwind v4, Vitest (testes de fonte com `@/test/fonte`).

**Spec:** `docs/superpowers/specs/2026-11-18-cabecalho-categorias-design.md`

## Global Constraints

- Nada em `src/components/ui/` nem em `globals.css` muda.
- O título é `<PageHeaderTitle asChild><p aria-hidden="true">Categorias</p></PageHeaderTitle>`: o `<h1>` é o da barra do topo.
- Nova categoria: `Button variant="primary"` com `PlusIcon` (`@heroicons/react/16/solid`), texto `Nova categoria`, só com `podeEscrever`.
- Telefone: sem `PageHeader`, a barra segue com o `+` recolhido.
- Não é mudança de jornada: o botão abre o mesmo `openDialog()`.

## Review Focus

- Convidado (`podeEscrever` falso) no desktop: nem o cabeçalho nem a barra mostram Nova categoria.
- Telefone: a barra continua com o `+` (o `onNewCategory` só some no desktop).
- Receitas no desktop: o cabeçalho continua, e a barra fica só com o segmento (sem mês).
- Carregando no desktop: o esqueleto tem o osso do cabeçalho, sem pulo quando a tela chega.
- Rolar no desktop: o título sobe para a barra (`collapse`).

---

### Task 1: Cabeçalho da página e do esqueleto

**Files:**
- Modify: `src/app/(app)/categories/page-client.tsx` (imports; o `return` principal perto da linha 665)
- Modify: `src/components/categories/categories-page-grid-skeleton.tsx:177-188`
- Create: `src/app/(app)/categories/page-client.test.ts`

**Interfaces:**
- Consumes: `PageHeader`, `PageHeaderTitleRow`, `PageHeaderTitle`, `PageHeaderActions`, `PageHeaderSkeleton` de `@/components/ui/page-header`; `useIsMobile` de `@/hooks/use-mobile`; `podeEscrever` e `openDialog` já existentes na página.
- Produces: nada para outras tarefas.

- [ ] **Step 1: Escrever o teste de fonte que falha**

`src/app/(app)/categories/page-client.test.ts`, no estilo de `src/app/(app)/transactions/page-client.test.ts` (`lerFonte` + `semComentarios(…, "tudo")`):

```ts
describe("o cabeçalho de Categorias", () => {
    const f = semComentarios(lerFonte("src/app/(app)/categories/page-client.tsx"), "tudo")
    const esq = semComentarios(lerFonte("src/components/categories/categories-page-grid-skeleton.tsx"), "tudo")

    it("abre com PageHeader collapse e o título escondido do leitor, só fora do telefone", () => {
        expect(f).toMatch(/isMobile \? null : \(\s*<PageHeader collapse>/)
        expect(f).toMatch(/<PageHeaderTitle asChild>\s*<p aria-hidden="true">Categorias<\/p>/)
    })

    it("Nova categoria mora no cabeçalho, primária, só para quem escreve", () => {
        expect(f).toMatch(/podeEscrever \? \(\s*<PageHeaderActions>[\s\S]*?variant="primary"[\s\S]*?Nova categoria/)
    })

    it("a barra só cria categoria no telefone", () => {
        expect(f).toMatch(/onNewCategory=\{podeEscrever && isMobile \? \(\) => openDialog\(\) : undefined\}/)
    })

    it("o esqueleto tem o osso do cabeçalho, escondido no telefone", () => {
        expect(esq).toContain('<PageHeaderSkeleton description={false} actions={1} className="max-md:hidden" />')
    })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run "src/app/(app)/categories/page-client.test.ts"`
Expected: FAIL nos 4 casos.

- [ ] **Step 3: Implementar**

- Na página: `const isMobile = useIsMobile()` junto dos outros hooks, antes de qualquer `return`. Logo antes de `<CategoriesToolbar`, entra `{isMobile ? null : (<PageHeader collapse>…</PageHeader>)}`, com `PageHeaderActions` envolto em `podeEscrever ? (…) : null`. O botão é `<Button type="button" variant="primary" onClick={() => openDialog()}><PlusIcon aria-hidden />Nova categoria</Button>`.
- Na barra, `onNewCategory={podeEscrever && isMobile ? () => openDialog() : undefined}`.
- Troque o `space-y-3` do invólucro por `flex flex-col gap-4`, como Transações. Faça o mesmo no `SkeletonGroup` do esqueleto, onde entra `<PageHeaderSkeleton description={false} actions={1} className="max-md:hidden" />` antes do `CategoriesToolbarSkeleton`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run "src/app/(app)/categories/page-client.test.ts"`
Expected: PASS (4).

- [ ] **Step 5: Conferir o resto**

Run: `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- "src/app/(app)/categories/page-client.tsx"`
Expected: sem erro novo.

- [ ] **Step 6: Ver na prévia**

Abrir `/categories` em desktop (1280) e em 375. Desktop: título + Nova categoria na linha de cima, a barra com Despesas | Receitas e o mês; rolando, o título sobe para a barra. Telefone: igual a antes.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(app)/categories/page-client.tsx" "src/app/(app)/categories/page-client.test.ts" src/components/categories/categories-page-grid-skeleton.tsx docs/superpowers/specs/2026-11-18-cabecalho-categorias-design.md docs/superpowers/plans/2026-11-18-cabecalho-categorias.md
git commit -m "feat(categorias): no desktop, PageHeader com o título e Nova categoria; a barra fica com o tipo e o mês"
```
