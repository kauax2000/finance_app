# A dica do "Ritmo do mês" (B) — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A dica de várias séries ganha:
- o respiro da dica enxuta;
- a amostra de traço;
- o rodapé "diferença";
- o previsto.

O Ritmo do mês usa tudo isso.

**Architecture:**
- O design system muda em `src/components/ui/chart.tsx`, com a página de docs e o teste.
- A tela só liga o prop novo.

**Tech Stack:** React 19, Recharts 3.8 via `@/components/ui/chart`, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-dica-do-ritmo-design.md`. Mockup: `docs/design/painel/dica-do-ritmo.html`, opção B.

## Global Constraints
- O `AGENTS.md` vale inteiro:
  - só tokens e Heroicons;
  - um componente mudado entra com docs (`src/app/designsystem/docs/chart.tsx`), teste (`src/components/ui/chart-versions.test.ts`) e uma linha na seção "Gráficos" do `AGENTS.md`.
- Antes de buscar código, rode `graphify query "<pergunta>"`. Depois de mudar, rode `graphify update .`.
- O banco do dev é produção: no app, só leitura.
- Os checks:
  - `npx tsc --noEmit`;
  - `npm run lint`;
  - `npx vitest run src/components/ui src/components/categories src/components/previsao src/lib`;
  - `npm run ds:audit -- src/components/ui/chart.tsx src/components/categories/detail`.
- Não faça push.
- Não faça stage de arquivos que você não mudou: há mudanças de outra sessão no working tree (`globals.css`, `theme-toggle`, `aurora-do-tema`, `CLAUDE.md`, `graph.json`).

## Review Focus
1. Dia 0 ("início do mês"), com as duas séries em zero: sem rodapé de diferença.
2. Mês fechado, sem `ghost`: as duas linhas e a diferença, sem "previsto".
3. Ponto depois de hoje, sem `ghost` naquele ponto: só a linha do anterior, sem diferença.
4. Receita (`better: "higher"`): a mais é `success`.
5. `ChartLine` com uma série só: continua a dica enxuta, sem mudança.

---

### Task 1: A dica de várias séries no design system

**Files:**
- Modify: `src/components/ui/chart.tsx` (`ChartTooltipContent` e `ChartLine`)
- Modify: `src/app/designsystem/docs/chart.tsx`
- Modify: `AGENTS.md` (seção "Gráficos", uma linha)
- Test: `src/components/ui/chart-versions.test.ts`

**Interfaces (produz):**
- `ChartTooltipContent` ganha três props:
  - `indicator` aceita também `"stroke"`: um traço de 14px por 2,5px, na cor da série, `dashed` (`4 3`) quando `config[key].dashed`;
  - `difference?: { better?: "lower" | "higher"; label?: string }` (o rótulo padrão é `"diferença"`);
  - `ghost?: { dataKey: string; label?: string }` (o rótulo padrão é `"previsto"`).
- `ChartLine` ganha `tooltipDifference?: { better?: "lower" | "higher"; label?: string }`:
  - passa `indicator="stroke"` à dica quando há duas séries ou mais;
  - repassa `ghost` à dica;
  - prende a dica no topo (`position={{ y: 0 }}`) quando `tooltipDifference` existe.
  - O `ghost` do `ChartLine` ganha `label?: string`.

- [ ] **Step 1: O teste.** Em `chart-versions.test.ts`, no padrão do arquivo (render, se ele renderiza a dica; senão, pela fonte), escreva testes que conferem:
  - a dica padrão com `px-3.5 py-2.5`;
  - a amostra `stroke` tracejada para a série `dashed`;
  - o rodapé com `data-slot="chart-tooltip-difference"`, com o valor `+R$ 1.150,30` para 2098.6 contra 948.3 e a classe `text-warning-muted-foreground` com `better: "lower"`;
  - o rodapé ausente quando os dois valores são zero;
  - com a primeira série `null` e o `ghost` 2150, a linha "previsto" com 2150 e a diferença contra a segunda.

  Confira que os testes falham.
- [ ] **Step 2: A dica, em `ChartTooltipContent`.**
  - **Respiro.** A placa padrão passa de `gap-1.5 px-2.5 py-1.5` a `gap-2 px-3.5 py-2.5`. Entre as linhas, `gap-2`.
  - **Cabeçalho.** Com `difference`, o rótulo fica `text-muted-foreground`, como no `single`.
  - **Valores.** A primeira linha fica `text-foreground`; as outras, `text-muted-foreground`.
  - **Rodapé.**
    - Use `border-t border-border/60 pt-2`, o mesmo fio da linha `total`.
    - O valor vem de `currencyBRL(v, { signed: true })` (veja `src/lib/formatters.ts`), com `−` tipográfico como em `textoDaVariacao`.
    - O tom vem de `tomDaReferencia(v, better)`.
    - Com diferença zero, escreva "igual", sem tom.
    - Sem os dois números, não há rodapé.
  - **Previsto.** O payload já vem filtrado ao `config`. Quando o valor da primeira série é `null`/`undefined` e `item.payload[ghost.dataKey]` é número, troque:
    - o valor pelo do `ghost`;
    - o nome pelo `ghost.label`;
    - a amostra por um traço pontilhado (`2 3`);
    - o valor a 75% (`opacity-75`).
- [ ] **Step 3: O `ChartLine` liga as peças** como em Interfaces. Com uma série só, nada muda.
- [ ] **Step 4: Docs.** Na página do `Chart`, um exemplo vivo de linha com duas séries (novembro cheia, outubro tracejada, o previsto), com `tooltipDifference`. Na seção "Gráficos" do `AGENTS.md`, uma linha com:
  - o respiro;
  - o traço;
  - a diferença;
  - o previsto;
  - o topo.
- [ ] **Step 5:** Os checks passam.
- [ ] **Step 6:** Commit `feat(ds): dica de várias séries com traço, diferença e previsto, no respiro da enxuta`.

### Task 2: O Ritmo do mês liga a diferença

**Files:**
- Modify: `src/components/categories/detail/resumo/graficos-do-resumo.tsx` (o `<ChartLine>` do Ritmo, por volta da linha 310)

**Interfaces (consome):** `tooltipDifference` e `ghost.label`, da Task 1.

- [ ] **Step 1:** Passe ao `ChartLine` do Ritmo:
  - `tooltipDifference={{ better: despesa ? "lower" : "higher" }}`;
  - `ghost` com `label: "previsto"`;
  - `tooltipLabel` com `d === 0 ? "início do mês" : \`${d} de ${mesAtual}\``.
  
  `mesAtual` já é o mês por extenso em minúscula, e o componente põe a inicial maiúscula.
- [ ] **Step 2:** Os checks passam. Rode `graphify update .`.
- [ ] **Step 3:** Commit `feat(categoria): a dica do Ritmo do mês com a diferença e o previsto`.

### Depois (sessão principal)
- Passe o cursor no dia 17 e no dia 26 da categoria da imagem.
- Compare com o mockup B, no tema escuro e no claro.
