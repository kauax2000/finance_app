# "Últimos meses" (B) e "Mês a mês" (A) — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o gráfico "Últimos 12 meses" pela área com número e marcas (B) e acrescentar o gráfico de barras "Mês a mês" tocável (A) na seção "Como o mês andou" do detalhe da categoria.

**Architecture:** Quatro capacidades novas no `src/components/ui/chart.tsx` (design system, com docs e teste). A tela (`graficos-do-resumo.tsx`) compõe os dois cartões. A página leva o toque na barra para `?month=`.

**Tech Stack:** Next.js (leia `node_modules/next/dist/docs/` antes de mexer em rota/navegação), React 19, Recharts via `@/components/ui/chart`, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-ultimos-meses-e-mes-a-mes-design.md`. Mockup: `.superpowers/brainstorm/75919-1795230631/content/doze-meses-opcoes.html` (opções B e A).

## Global Constraints
- `AGENTS.md` vale inteiro. Em especial:
  - tokens apenas, Heroicons apenas, nenhum componente declarado em `src/app/`;
  - componente mudado entra com docs (`src/app/designsystem/docs/chart.tsx`) e teste (`chart-versions.test.ts`), conforme a invariante 8;
  - a cor da série da categoria é `tileVividColor(tileColorFor(cor) ?? padrão)`, que já está em `graficos-do-resumo.tsx`.
- Antes de buscar código, `graphify query "<pergunta>"`; depois de mudar, `graphify update .`.
- O banco do dev é produção: só leitura no app.
- Checks: `npx tsc --noEmit`, `npm run lint`, `npx vitest run src/components/ui src/components/categories src/lib`, `npm run ds:audit -- src/components/categories/detail src/components/ui/chart.tsx`.
- Não faça push.

## Review Focus
1. Categoria com um só mês de dados: sem marca de "maior", sem barra tracejada (a série começa no primeiro mês da janela ou é o único mês).
2. Sem média (`media` null ou 0): sem selo, sem linha de média, sem rótulo.
3. Receita: o selo inverte as cores (acima da média é bom, verde), como a faixa do mês faz.
4. Toque na barra do mês já aberto não navega; teclado (setas + Enter) também navega.
5. Rótulos não saem do SVG: o "maior" perto da borda direita ou do topo encosta para dentro.

---

### Task 1: O que o gráfico ganha no design system

**Files:**
- Modify: `src/components/ui/chart.tsx`
- Modify: `src/app/designsystem/docs/chart.tsx` (demonstração de cada peça nova, na forma fixa da página)
- Test: `src/components/ui/chart-versions.test.ts`

**Interfaces:**
- Produces:
  - `ChartReferenceLine` aceita `label?: string`. Com ele, o texto é escrito sobre a linha, à esquerda (x = início da área + 4, alinhado ao centro da linha), em `fill-muted-foreground text-2xs`, com um retângulo atrás em `--chart-surface` para não cruzar a curva. Sem `label`, nada muda.
  - `ChartReferenceDot({ x, y, label, tone?: "series" | "neutral", color? })`, um `ReferenceDot` do Recharts:
    - o ponto é de raio 4, vazado: preenchido com `--chart-surface` e traço de 2 na `color` (padrão `var(--color-muted-foreground)`);
    - o rótulo fica 10px acima, centrado e em `fill-muted-foreground text-2xs`;
    - perto da borda (menos de 60px da direita), o rótulo vira `textAnchor="end"`;
    - exporte-o junto das outras peças.
  - `ChartBars valueLabels` passa a aceitar `boolean | "selected"`. Com `"selected"`, só a barra de `selected` leva o valor na ponta.
  - `ChartBars partial?: string[]`: as barras cujo `x` está na lista são desenhadas só com contorno tracejado (`stroke` na cor da série, `strokeDasharray="4 3"`, `fill` transparente). Elas continuam no tooltip e no foco.

- [ ] **Step 1:** Escreva em `chart-versions.test.ts` os testes que conferem, pela fonte (o padrão do arquivo), que cada capacidade existe e tem a forma descrita: `label` na `ChartReferenceLine`, `ChartReferenceDot` exportado, `valueLabels` aceitando `"selected"`, e `partial` com `strokeDasharray`. Se o arquivo já renderiza gráficos em teste, prefira render. Confira que falham.
- [ ] **Step 2:** Implemente em `chart.tsx`.
- [ ] **Step 3:** Docs: na página do `Chart`, um exemplo vivo de cada peça, com conteúdo de produto realista: a linha da média com rótulo, o ponto do maior mês, barras com o valor só no mês aberto e o primeiro mês tracejado. Atualize a seção "Gráficos" do `AGENTS.md` com uma linha para as quatro peças.
- [ ] **Step 4:** Os checks passam.
- [ ] **Step 5:** Commit `feat(ds): rótulo na linha de referência, ponto anotado e barras parciais no gráfico`.

### Task 2: Os dois cartões na tela

**Files:**
- Modify: `src/components/categories/detail/resumo/graficos-do-resumo.tsx`
- Modify: `src/app/(app)/categories/[categoryId]/page-client.tsx` (passar `onAbrirMes(ym)` para `ResumoDaCategoria` → `GraficosDoResumo`)
- Modify: `src/components/categories/detail/resumo/resumo-da-categoria.tsx` (repassar a prop)
- Modify: `docs/JORNADAS.md` §9 e `docs/atlas/template.html` (a nova ponte: tocar num mês do "Mês a mês" abre o detalhe naquele mês); rode `python3 docs/atlas/build.py`. **Não** republique o Atlas (a sessão principal faz).

**Interfaces:**
- Consumes: Task 1. `vereditoDaMedia`, `reaisInteiros` e `nomeDoMes` estão em `src/components/categories/detail/regua-do-mes-contas.ts`; leia o arquivo para as assinaturas.
- `GraficosDoResumo` ganha `onAbrirMes: (yearMonth: string) => void`. A página monta a URL do mesmo jeito que a navegação de mês da tela já faz. Procure o `MonthNav`/`useMonthInHeader` e reuse a função que troca `?month=`; não escreva outra.

- [ ] **Step 1: O cartão B**, no lugar do "Últimos 12 meses".
  - Cabeçalho, composto com peças do DS (`CardHeader`, `Caption`, `MoneyDisplay` no tamanho grande, `Badge` soft no tom do veredito):
    - a legenda é o nome do mês (`nomeDoMes(yearMonth)`);
    - o valor é o `total` do último ponto da série;
    - o selo diz "+N% vs média" ou "−N% vs média", ou "na média" dentro de ±2%;
    - o tom é `warning` acima e `success` abaixo na despesa, invertido na receita, e neutro "na média". Use o veredito da `vereditoDaMedia` se a assinatura servir;
    - o título "Últimos meses" vai à direita, como `CardAction` em cinza.
  - Gráfico: o `ChartArea` de hoje, com `ChartReferenceLine y={media} label={`média ${reaisInteiros(media)}`}` e `ChartReferenceDot` no maior mês, com o rótulo `"<mês curto> · <reaisInteiros> (maior)"`, só com 2 meses ou mais e quando o maior não é o mês aberto.
  - O eixo X mostra todos os meses da série: confira por que o primeiro some hoje (provável `interval`/`minTickGap` do eixo) e resolva com a prop do DS. Se não houver, acrescente no `chart.tsx` com teste.
- [ ] **Step 2: O cartão A**, numa linha própria na largura toda, depois da linha dos três cartões pequenos.
  - O título é "Mês a mês". O apoio à direita é "toque num mês para abrir"; "desde <mês curto>" vai ao lado do título como `Caption`.
  - `ChartBars`:
    - os mesmos meses da série do B, com `selected` = mês aberto, `selectedColor` = cor da série, `valueLabels="selected"` e `yAxis={false}`;
    - `partial = [primeiro mês]` quando a série cortada começa depois do primeiro mês da janela de 12;
    - a linha de média com `label`;
    - `onSelect={(x) => x && x !== mesAberto && onAbrirMes(ymDoRotulo(x))}`. Guarde o `yearMonth` em cada ponto para não converter rótulo em data.
  - Altura `h-44`.
- [ ] **Step 3: A navegação.** `page-client` passa `onAbrirMes`. Confira no navegador (dev em http://localhost:3000, rota `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`) que tocar em "out" abre `month=2026-10` e que a tela troca de mês. Só leitura.
- [ ] **Step 4: Jornadas.** Faça o §9 do `JORNADAS.md` e o template do Atlas, e rode o `build.py`.
- [ ] **Step 5:** Checks; `graphify update .`; commit `feat(categoria): "Últimos meses" com número e marcas, e o "Mês a mês" tocável`.

### Depois das tarefas (sessão principal)
Passada visual lado a lado com o mockup (1440 e 375, dois temas), correções, e republicar o Atlas.
