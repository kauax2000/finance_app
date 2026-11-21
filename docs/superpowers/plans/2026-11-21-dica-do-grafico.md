# Dica do gráfico com uma série — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A dica enxuta (rótulo, valor grande, comparação) nos gráficos de uma série, e a comparação com a média e o mês anterior nos gráficos do resumo da categoria.

**Architecture:** Tudo no `ChartTooltipContent` e nas formas de `src/components/ui/chart.tsx` (design system, com docs e teste); a tela só passa as props novas.

**Tech Stack:** React 19, Recharts via `@/components/ui/chart`, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-dica-do-grafico-design.md`. Mockup: `.superpowers/brainstorm/75919-1795230631/content/dica-do-grafico.html` (opção A).

## Global Constraints
- `AGENTS.md` inteiro. Em especial:
  - tokens apenas;
  - a placa da dica continua `menuPanelSurfaceClassName`;
  - "Nenhuma tela monta tooltip à mão";
  - mudança de componente entra com docs (`src/app/designsystem/docs/chart.tsx`) e teste (`chart-versions.test.ts`), e com a linha na seção "Gráficos" do AGENTS.
- `graphify query` antes de buscar; `graphify update .` depois.
- O banco é produção: só leitura no app. Sem push.
- Checks: `npx tsc --noEmit`, `npm run lint`, `npx vitest run src/components/ui src/components/categories src/lib`, `npm run ds:audit -- src/components/ui/chart.tsx src/components/categories/detail`.

## Review Focus
1. Gráficos de duas séries ou mais (o Ritmo do mês, a área empilhada da documentação) seguem iguais.
2. Rosca e barras com `share` ou `formatter` seguem iguais.
3. Sem `delta` nem `tooltipReference`, a dica enxuta não desenha a linha de comparação vazia.
4. A referência zero ou ausente não escreve "Infinity%".
5. A receita pinta o tom ao contrário: acima da média é `success`.

---

### Task 1: A dica enxuta e a comparação

**Files:** `src/components/ui/chart.tsx`, `src/components/ui/chart-versions.test.ts`, `src/app/designsystem/docs/chart.tsx`, `AGENTS.md`, `src/components/categories/detail/resumo/graficos-do-resumo.tsx`

**Interfaces:**
- `ChartTooltipContent`:
  - ganha `variant?: "default" | "single"`;
  - ganha `reference?: { value: number; label: string; better?: "lower" | "higher" }`;
  - ganha `labelText?: (label: unknown) => string`, aplicado ao cabeçalho e ao rótulo do anterior no `delta`.
- `ChartArea`, `ChartLine` e `ChartBars`:
  - ganham `tooltipReference?` (o mesmo tipo de `reference`) e `tooltipLabel?: (x: unknown) => string`;
  - com uma série só (e sem `share`), passam `variant="single"`;
  - área e linha de uma série prendem a dica ao topo (`position={{ y: 0 }}` no `ChartTooltip`);
  - o `delta` que já existe continua passando.

- [ ] **Step 1:** Testes no `chart-versions.test.ts`, no padrão de fonte do arquivo (ou por render, se houver). Eles conferem:
  - a forma `single` não desenha o marcador nem o nome;
  - o valor sai em `text-base`;
  - a linha de comparação junta as partes com " · " e some sem partes;
  - o tom vem de `better`;
  - as formas passam `variant="single"` só com uma série.
- [ ] **Step 2:** Implemente. O percentual é `formatChartValue(|variação|, "percent")` com o sinal escrito (+/−), como o `ChartTooltipDelta` já faz. Com referência zero, a parte da referência não aparece. Reaproveite o `ChartTooltipDelta` em vez de duplicar a conta.
- [ ] **Step 3:** Docs: na página do `Chart`, a dica enxuta com a referência e o anterior, num gráfico de exemplo. Uma linha no AGENTS ("Gráficos").
- [ ] **Step 4:** Tela (`graficos-do-resumo.tsx`). Em "Últimos meses" e "Mês a mês":
  - `delta={{ data: meses, x: "mes" }}`;
  - `tooltipReference={comMedia ? { value: media, label: "média", better: despesa ? "lower" : "higher" } : undefined}`;
  - `tooltipLabel` que leva o rótulo curto ao mês por extenso: use o `yearMonth` guardado em cada ponto e `mesPorExtenso`; na dica o mês vai com maiúscula ("Setembro"), e no "vs" vai minúsculo ("agosto").
- [ ] **Step 5:** Confira no navegador (dev em http://localhost:3000, `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`, 1440 escuro). Passe o cursor em setembro de "Últimos meses": "Setembro", "R$ 3.524,51", "+21% vs média · +10% vs agosto". No Ritmo do mês, a dica segue com as duas séries. Só leitura.
- [ ] **Step 6:** Checks; `graphify update .`; commit `feat(ds): dica enxuta nos gráficos de uma série, com a comparação`.
