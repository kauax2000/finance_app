# A faísca vira o fundo dos cartões de Categorias — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** nos cartões de despesa e de receita, a barra e a frase sobem para logo depois do valor, e a faísca dos 6 meses vai para o pé do cartão, de borda a borda, sem perder nenhuma informação.

**Architecture:** só muda a ordem e a sangria dentro do `CardContent` de `expense-category-card.tsx` e de `income-category-card.tsx`, e do `CategoryCardSkeleton`. Nada em `src/components/ui/`.

**Tech Stack:** React 19, Tailwind v4, Recharts (via `ChartSparkline`), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-19-faisca-de-fundo-design.md`

## Global Constraints

- **Ordem no `CardContent`:**
  1. o bloco do valor (valor, variação e a linha lançado/recebido + previsto);
  2. o bloco da barra (`Progress` e a frase da situação);
  3. a faísca.
- **Faísca no pé:** é o último filho e sangra com `-mx-(--card-px) -mb-(--card-py)`. Fica em `h-16`, sem `mt-auto` no bloco da barra. Quem empurra a faísca para o pé é um `mt-auto` nela, para manter a altura igual dos cartões numa linha. Mantém `variant="area"`, `reference={media}`, a cor da categoria, `label` e `description`.
- **Se o `ChartSparkline` deixar recuo nas bordas,** zere-o por props ou classes na chamada. Se só der mexendo em `src/components/ui/chart.tsx`, pare e reporte NEEDS_CONTEXT.
- **Esqueleto:** o `ChartSkeleton` também vai para o pé, sangrando, em `h-16`, e o osso da barra sobe.
- **Nada sai:** previsto, marcador de ritmo, bandas do limite, frase, ⋯, `CardLink`, menu de contexto.
- **Commits:** só os seus arquivos, com `git commit <caminhos>`. Outras sessões têm arquivos não commitados nesta árvore. Sem push, sem stash e sem reset. A mensagem termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Cartões de uma mesma linha com conteúdo diferente** (com e sem previsto): todos com a mesma altura, e a faísca encostada no pé.
2. **A faísca encosta nas laterais e na base,** dentro do raio do cartão, sem um vão.
3. **O toque longo e o clique no cartão** continuam funcionando sobre a área da faísca.
4. **Receita:** a mesma forma que a despesa.
5. **Sem histórico** (série vazia): o pé não fica com um buraco esquisito.

---

### Task 1: a nova ordem nos dois cartões e no esqueleto

**Files:**
- Modify: `src/components/categories/expense-category-card.tsx` (o `CardContent` e o `CategoryCardSkeleton`)
- Modify: `src/components/categories/income-category-card.tsx` (o `CardContent`)
- Test: o teste dos cartões que já exista (procure `expense-category-card` em `*.test.ts`). Se não houver, `src/components/categories/category-card-layout.test.ts`.

- [ ] **Step 1: testes de fonte**, nos dois cartões e no esqueleto:
  - o índice de `<Progress` vem antes do índice de `<ChartSparkline` (ou de `<ChartSkeleton`, no esqueleto);
  - a faísca leva `-mx-(--card-px)` e `-mb-(--card-py)`;
  - a faísca leva `h-16`.
- [ ] **Step 2:** `npx vitest run <o teste>`. Esperado: FAIL.
- [ ] **Step 3:** implementar segundo as Global Constraints.
- [ ] **Step 4:** PASS. Rodar `npx tsc --noEmit`, `npm run lint` e `npm run ds:audit -- src/components/categories`.
- [ ] **Step 5:** `graphify update .` e commit `feat(categorias): a faísca vira o fundo do cartão, e a barra sobe`.
