# "Dias da semana" (C) — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O "Dias da semana" passa a mostrar dois números (dias úteis × fim de semana) e uma fileira de sete células de calor na cor da categoria.

**Architecture:**
- `ChartHeatStrip` nova em `src/components/ui/chart.tsx`, com docs, teste e uma linha no `AGENTS.md`.
- A conta dos dois lados fica numa função pura em `src/lib/categoria-resumo.ts`.
- A tela compõe.

**Tech Stack:** React 19, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-dias-da-semana-design.md`. Mockup: `docs/design/painel/dias-da-semana.html`, opção C.

## Global Constraints
- O `AGENTS.md` vale inteiro: tokens, invariante 8, nenhum componente em `src/app/`, o raio da escala, o `hover:` com par de toque.
- Antes de buscar código, rode `graphify query "<pergunta>"`. Depois de mudar, rode `graphify update .`.
- O banco do dev é produção: no app, só leitura.
- Checks:
  - `npx tsc --noEmit`;
  - `npm run lint`;
  - `npx vitest run src/components/ui src/components/categories src/lib src/app/designsystem`;
  - `npm run ds:audit -- src/components/ui/chart.tsx src/components/categories/detail`.
- Não faça push. Faça stage só dos seus arquivos, um por um.

## Review Focus
1. Mês só com compras em dia útil: "100%" e "0%", com o fim de semana em muted.
2. Dia zerado: célula tracejada, sem cor, ainda com a dica ("Domingo · R$ 0").
3. Só um dia com valor: ele a 100%, os outros tracejados.
4. Receita: a mesma forma, com "entradas" no `aria-label`.
5. Telefone (375px) e cartão estreito (264px): as sete células cabem, sem rolagem horizontal.

---

### Task 1: A fileira de calor e os dois números

**Files:**
- Modify: `src/components/ui/chart.tsx` (`ChartHeatStrip`, exportada)
- Modify: `src/app/designsystem/docs/chart.tsx`
- Modify: `AGENTS.md` ("Gráficos": a peça e a exceção da cor da pessoa)
- Test: `src/components/ui/chart-versions.test.ts`
- Modify: `src/lib/categoria-resumo.ts` (+ o teste dele)
- Modify: `src/components/categories/detail/resumo/graficos-do-resumo.tsx` (o cartão "Dias da semana")

**Interfaces (produz):**
- `ChartHeatStrip`, com as props do spec. A célula tem `aspect-square` e `rounded-row`.
  - O fundo da célula com valor é `color-mix(in oklab, <color> <pct>%, transparent)`, com `pct = max(12, round(v / max * 100))`.
  - Com zero, a célula é `border border-dashed border-border`, sem fundo.
  - A dica usa a placa e o formato da dica enxuta (`variant="single"` do `ChartTooltipContent`) ou, se não couber, o `Tooltip` do DS, com o mesmo conteúdo: o rótulo, o valor e o % do total.
- `diasUteisEFimDeSemana(dias: { dia: number; total: number }[]): { uteis: { total: number; pct: number }; fim: { total: number; pct: number } }`. Os dias 0–4 são úteis e 5–6 são fim de semana (o `dia` de `porDiaDaSemana` começa na segunda). Os `pct` são inteiros e somam 100 (`splitPercents`, ou a mesma regra). Com total zero, os dois são 0.

- [ ] **Step 1: Testes.**
  - Em `categoria-resumo`: `diasUteisEFimDeSemana` com [2080, 170, 330, 250, 60, 172, 0] dá `uteis.total` 2890, `fim.total` 172, e os pct 94 e 6. Teste também o mês todo em dia útil e o mês zerado.
  - Em `chart-versions`: `ChartHeatStrip` exportada; a célula zerada tracejada; o maior dia com o fundo a 100%; o `aria-label` com os dias.

  Confira que falham.
- [ ] **Step 2:** Implemente a lib e a peça. Faça a página de docs (os dias da semana de um gasto) e a linha no `AGENTS.md`.
- [ ] **Step 3: A tela.** Faça o cartão conforme o spec: os dois números em cima e a `ChartHeatStrip` com `color={corDaSerie}` e `labelText` dando o dia por extenso. Saem o `ChartBars` dele, o `CONFIG_DIAS` e o `maiorDe`, se ficarem sem uso.
- [ ] **Step 4: Navegador** (http://localhost:3000, só leitura). A Carro está em `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`. Confira no tema escuro e no claro, e na largura de 375px. Compare com a opção C do mockup.
- [ ] **Step 5:** Os checks passam. Rode `graphify update .`.
- [ ] **Step 6:** Commit `feat(categoria): "Dias da semana" com dias úteis × fim de semana e a fileira de calor`.
