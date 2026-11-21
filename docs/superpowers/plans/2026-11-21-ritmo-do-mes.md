# "Ritmo do mês" — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O "Ritmo do mês" com o selo da diferença, o véu entre as linhas, o previsto até o fim do mês, o fio do hoje e os rótulos nas pontas.

**Architecture:** Duas tarefas:
- **Task 1:** o que o gráfico ganha no design system (`chart.tsx`, com docs e teste).
- **Task 2:** a conta (`categoria-resumo.ts`, com teste) e a tela (`graficos-do-resumo.tsx`).

**Tech Stack:** React 19, Recharts via `@/components/ui/chart`, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-ritmo-do-mes-design.md`. Mockup: `.superpowers/brainstorm/42393-1795272288/content/ritmo-junto.html`.

## Global Constraints
- `AGENTS.md` inteiro: tokens apenas, nenhum componente em `src/app/`, invariante 8 (docs + teste + linha em "Gráficos").
- A cor da categoria é `tileVividColor(...)`, como já está na tela. O véu usa `--success`/`--warning`, nunca verde ou vermelho cru.
- `graphify query` antes de buscar; `graphify update .` depois. O banco é produção: só leitura. Sem push.
- Checks: `npx tsc --noEmit`, `npm run lint`, `npx vitest run src/components/ui src/components/categories src/lib`, `npm run ds:audit -- src/components/ui/chart.tsx src/components/categories/detail`.

## Review Focus
1. **Mês fechado:** sem fio do hoje, sem previsto, e o canto diz "fechou em".
2. **Mês sem o anterior** (categoria nova, outubro zerado): o selo e o véu não aparecem, e o rótulo do anterior também não.
3. **Receita:** o tom se inverte.
4. **Rótulos perto da borda direita:** não saem do SVG nem se cruzam.
5. **Dica:** não mostra "faixa" nem "previsto" como séries.

---

### Task 1: O que o ChartLine ganha

**Files:** `src/components/ui/chart.tsx`, `src/components/ui/chart-versions.test.ts`, `src/app/designsystem/docs/chart.tsx`, `AGENTS.md`

**Interfaces (Produces):**
- **`ChartLine band?: { dataKey: string; color: string }`:** uma `Area` de intervalo, cujo `dataKey` aponta para pares `[baixo, alto]` (ou `null`) em cada ponto. É desenhada atrás das linhas, com `fill={color}`, `fillOpacity={0.14}`, sem traço, sem ponto e fora da dica e da legenda.
- **`ChartLine ghost?: { dataKey: string; color: string }`:** uma linha tracejada (`3 4`) a 60% de opacidade na cor dada, fora da dica e da legenda. É o previsto. Pontos `null` não desenham.
- **`ChartLine xTicks?: (string | number)[]`** (e o mesmo na `ChartArea` e nas `ChartBars`, se for trivial): os valores do eixo X que aparecem. Repasse para o `XAxis` como `ticks`, com `interval={0}`.
- **`ChartReferenceDot labelPosition?: "top" | "bottom"`** (o padrão é "top") e **`labelAlign?: "middle" | "end"`** (o padrão é o automático de hoje, que vira "end" perto da borda). Com "bottom", o rótulo fica 16px abaixo do centro. **`hollow?: boolean`**: o padrão é `true`, como hoje; com `false`, o ponto é cheio na `color` e tem o anel da superfície.
- **`ChartAnnotation labelPosition?: "top" | "bottom"`:** com "bottom", o rótulo vai ao pé da área de desenho.
- **A dica de duas séries ou mais** ignora as chaves que não estão no `config` (as auxiliares).

- [ ] **Step 1:** Testes (no padrão do arquivo) para cada prop: `band` gera uma `Area` com `fillOpacity={0.14}` e sem ponto; `ghost` usa `strokeDasharray="3 4"` e `strokeOpacity`; `xTicks` chega ao `ticks` do eixo; `labelPosition` e `hollow` no ponto; `labelPosition` na anotação; e a dica filtra as chaves fora do `config`.
- [ ] **Step 2:** Implemente.
- [ ] **Step 3:** Na página do `Chart`, um exemplo de ritmo com as cinco peças e dados realistas. Uma linha no AGENTS ("Gráficos").
- [ ] **Step 4:** Checks.
- [ ] **Step 5:** Commit `feat(ds): faixa entre séries, linha prevista, ticks e posições de rótulo no gráfico de linha`.

### Task 2: A conta e a tela

**Files:** `src/lib/categoria-resumo.ts`, `src/lib/categoria-resumo.test.ts`, `src/components/categories/detail/resumo/graficos-do-resumo.tsx`, `src/components/categories/detail/resumo/resumo-da-categoria.tsx`, `src/app/(app)/categories/[categoryId]/page-client.tsx` (passar o `previsto` do mês)

**Interfaces:**
- Consumes: Task 1.
- `ritmoDoMes` ganha o argumento opcional `previsto?: number` (o restante previsto do mês, `mes.previsto` na página). Cada ponto ganha:
  - `faixa: [number, number] | null`: `[min(atual, anterior), max(atual, anterior)]` nos dias até hoje, e `null` depois;
  - `projecao: number | null`: só com o mês aberto. No dia de hoje vale `atual(hoje)`; nos dias seguintes, a reta até `atual(hoje) + previsto` no último dia; antes de hoje, `null`. Mês fechado: `null` em todos os dias.
- Produces `resumoDoRitmo(ritmo, { aberto })` (no mesmo arquivo): `{ hoje: number; diferenca: number | null; fechamento: number; anteriorFinal: number | null }`.
  - `diferenca` = `atual(hoje) − anterior(hoje)`, `null` quando o anterior é 0 em todos os dias;
  - `fechamento` = `projecao` do último dia com o mês aberto, ou `atual` do último dia com o mês fechado;
  - `anteriorFinal` = `anterior` do último dia.

- [ ] **Step 1:** Testes no `categoria-resumo.test.ts`:
  - a `faixa` só existe até hoje;
  - a `projecao` sai de `atual(hoje)` e chega a `atual(hoje) + previsto` no último dia;
  - com o mês fechado, nenhuma `projecao`;
  - `resumoDoRitmo` com os números da Carro (hoje 21; atual 3.062,54; anterior no dia 21 de 3.734,16, o mesmo número que o topo da página mostra) dá `diferenca ≈ −671,62`;
  - com o anterior todo zero, `diferenca` é null.
- [ ] **Step 2:** Implemente.
- [ ] **Step 3: Tela.**
  - **Cabeçalho:** o `CardTitle` "Ritmo do mês" com o `Badge` do selo, e o `CardAction` com o canto ("deve fechar em R$ X" ou "fechou em R$ X", em reais inteiros com `reaisInteiros`).
  - **Selo:**
    - texto: "R$ 672 a menos que outubro" ou "a mais", com `reaisInteiros(|diferenca|)`, o nome do mês anterior em minúsculo e a faixa de ±2% (de `anterior(hoje)`) dizendo "igual a outubro";
    - tom: `success` / `warning` / `neutral`, invertido na receita.
  - **Gráfico:** `ChartLine` com:
    - `band={{ dataKey: "faixa", color: <var(--success) ou var(--warning) pelo tom; sem cor no neutro> }}`;
    - `ghost={{ dataKey: "projecao", color: corDaSerie }}` (só com o mês aberto);
    - `xTicks={[1, 8, 15, 22, último]}`, `legend={false}` e `grid={false}`;
    - `ChartAnnotation x={hoje} label={`hoje, dia ${hoje}`} labelPosition="bottom"` (só aberto);
    - `ChartReferenceDot` cheio (`hollow={false}`) no ponto de hoje, com "<mês> · R$ X", `labelPosition="bottom"` e `labelAlign="end"`;
    - `ChartReferenceDot` neutro no último dia do anterior, com "<mês anterior> · R$ X", `labelPosition="top"`. Só quando há anterior;
    - `ChartReferenceDot` vazado na cor da categoria no último dia da projeção, com "previsto · R$ X", `labelPosition="bottom"`. Só aberto.

    Tire o `marker="last"` se ele duplicar o ponto de hoje.
  - `page-client` passa `previsto: mes.previsto` ao `ritmoDoMes`.
- [ ] **Step 4:** Confira no navegador: `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11` (aberto) e `&month=2026-10` (fechado), a 1440 escuro e a 375. Só leitura.
- [ ] **Step 5:** Checks; commit `feat(categoria): Ritmo do mês com a diferença, o previsto e os rótulos nas pontas`.
