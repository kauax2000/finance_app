# A faísca na faixa de cima — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a faísca dos cartões de Categorias fica só na faixa de cima, e embaixo dela o botão fantasma fica sempre legível sobre a área cheia.

**Architecture:** o `ChartSparkline` (`src/components/ui/chart.tsx`, l.~3098) ganha `band`. Os cartões de despesa e de receita o passam.

**Tech Stack:** React 19, Recharts, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-20-faixa-da-faisca-design.md`

## Global Constraints

- **`band?: number`**, de 0 a 1, desligado por padrão.
  - Com `band`, entra `<YAxis hide domain={[lo, hi]} />`, com:
    - `hi = max(valores de y, reference válida)`;
    - `lo = hi − (hi − min(valores de y, reference válida)) / band`.
  - Se `hi === min`, o domínio é `[hi − 1, hi]`, e a linha fica no topo.
  - Vale em `line` e `area`. Em `bars` é ignorado.
- **Sem `band`, nada muda.** Os outros consumidores ficam iguais.
- **Cartões:** `band={0.45}` em `expense-category-card.tsx` e `income-category-card.tsx`.
- **Registro:**
  - um teste em `src/components/ui/chart-versions.test.ts`;
  - uma frase em `src/app/designsystem/docs/chart.tsx`, onde o `ChartSparkline` é descrito;
  - no AGENTS.md, no bullet "`ChartSparkline reference`": "`band` limita a linha à faixa de cima (a fração da altura), e a área cheia fica embaixo (o pé do cartão de categoria, 20/11/2026)".
- **Commits:** só os seus arquivos, com `git commit <caminhos>`. Sem push, sem stash e sem reset. A mensagem termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Série com valores iguais:** a linha não some nem vira NaN.
2. **Série vazia:** nada quebra.
3. **Média fora da série:** a linha tracejada fica dentro da faixa.
4. **Valor negativo ou zero:** o domínio continua coerente.
5. **Telefone:** a linha nunca cruza o botão.

---

### Task 1: `band` no `ChartSparkline` e nos cartões

**Files:**
- Modify: `src/components/ui/chart.tsx`
- Test: `src/components/ui/chart-versions.test.ts`
- Modify: `src/app/designsystem/docs/chart.tsx`
- Modify: `AGENTS.md`
- Modify: `src/components/categories/expense-category-card.tsx` e `income-category-card.tsx`

- [ ] **Step 1: testes.**
  - Se o domínio for extraído para uma função pura exportada (sugestão: `dominioDaFaixa(valores, band, reference)`): com valores `[100, 200]` e `band` 0,5, o resultado é `[0, 200]`; com `[150, 150]`, é `[149, 150]`; e a `reference` 300 com `[100, 200]` e `band` 0,5 dá `[-100, 300]`.
  - Fonte: os dois cartões passam `band={0.45}`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** PASS. Rodar `npx vitest run src/components/ui/chart-versions.test.ts src/components/categories`, `npx tsc --noEmit` e `npm run ds:audit -- src/components/ui/chart.tsx src/components/categories`.
- [ ] **Step 5:** `graphify update .` e commit `feat(chart): a faísca pode ficar na faixa de cima (band)`.
