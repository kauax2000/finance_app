# Barra de Categorias no telefone (cápsula [⇅ | +]) — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** no telefone, o ordenar e o nova categoria da barra de Categorias viram uma cápsula de vidro só, [⇅ | +], como a [🔍 | 📅] do cabeçalho.

**Architecture:** o trabalho fica em `src/components/categories/categories-toolbar.tsx` e `src/components/categories/categorias-do-mes.tsx` (`OrdemDasCategorias compacta`), e a página `src/app/(app)/categories/page-client.tsx` liga as peças. A cápsula reusa o `TopBarActionGroup` + `TopBarAction plate` (`src/components/ui/top-bar.tsx`), sem mexer em `ui/`.

**Tech Stack:** React 19, Radix DropdownMenu, Tailwind v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-20-barra-categorias-telefone-design.md`

## Global Constraints

- **Só abaixo de `md`,** quando a página já passa `compacta={isMobile}`. O desktop não muda.
- **A cápsula:** `TopBarActionGroup`, com dois filhos `TopBarAction plate`:
  - o primeiro é o gatilho do menu de ordem (`DropdownMenuTrigger asChild`), com o `aria-label` de hoje ("Ordenar categorias: …") e o ícone `BarsArrowDownIcon`;
  - o segundo abre a nova categoria, com `label="Nova categoria"` e o ícone `PlusIcon`.
  - Veja como o `app-header.tsx` monta a [lupa | filtro] e copie o padrão: a ordem dos filhos e o ícone no tamanho que a `TopBarAction` dá.
- **Convidado** (sem `onNewCategory`): só o primeiro filho, que vira o círculo.
- **Some do telefone:** o `ToolbarButton` de Nova categoria que existe hoje (`collapse`) e o botão `floating` solto do ⇅.
- **Ícones:** só Heroicons, no conjunto que o auditor (regra G) pedir.
- **Commits:** só os seus arquivos, com `git commit <caminhos>`. Outras sessões têm arquivos não commitados nesta árvore. Sem push, sem stash e sem reset. A mensagem termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **O menu de ordem abre a partir da cápsula,** alinhado ao ⇅, e tocar de novo na ordem escolhida inverte o sentido.
2. **O + abre o diálogo** de nova categoria.
3. **Convidado:** um círculo só, sem buraco.
4. **A 375px a linha cabe:** abas e cápsula sem quebrar.
5. **Desktop:** nada muda.

---

### Task 1: a cápsula no telefone

**Files:**
- Modify: `src/components/categories/categories-toolbar.tsx`
- Modify: `src/components/categories/categorias-do-mes.tsx`, se o gatilho compacto precisar virar `TopBarAction`
- Modify: `src/app/(app)/categories/page-client.tsx`, só se a ligação mudar
- Test: `src/components/categories/categorias-do-mes.test.ts` e/ou um teste de fonte do toolbar

- [ ] **Step 1: testes de fonte.**
  - O ramo do telefone usa `<TopBarActionGroup` com `TopBarAction` e `plate`.
  - O + tem `label="Nova categoria"`.
  - Sem `onNewCategory`, só o ⇅ é renderizado.
  - O `ToolbarButton` de Nova categoria não aparece mais no ramo do telefone.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** PASS. Rodar `npx vitest run src/components/categories "src/app/(app)/categories"`, `npx tsc --noEmit`, `npm run lint` e `npm run ds:audit -- src/components/categories`.
- [ ] **Step 5:** `graphify update .` e commit `feat(categorias): no telefone, ordenar e nova categoria numa cápsula`.
