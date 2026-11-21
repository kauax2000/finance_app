# Categoria enxuta e "Para onde vai o dinheiro" no Painel — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O detalhe da categoria fica com a faixa, os últimos 6 meses, um insight e a lista. Os cartões de análise passam ao Painel, numa seção com filtro de categoria.

**Architecture:**
- **Task 1:** move os cartões para `src/components/analise-do-mes/`, sem mudar o comportamento.
- **Task 2:** cria a seção do Painel.
- **Task 3:** enxuga a categoria e faz a ponte.

**Tech Stack:** Next.js (leia `node_modules/next/dist/docs/` antes de mexer em rota, `searchParams` ou `router`), React 19, TanStack Query, Recharts via `@/components/ui/chart`, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-categoria-enxuta-e-painel-design.md`. Mockup: `docs/design/painel/c-evoluida-e-painel.html`.

## Global Constraints
- Vale o `AGENTS.md` inteiro: tokens, design system, nenhum componente declarado em `src/app/`, Heroicons, a seção "Jornadas do app" e as tabelas de par de ações.
- Antes de buscar código, rode `graphify query "<pergunta>"`; depois de mudar, `graphify update .`.
- O banco do dev é produção: no app, só leitura.
- Os checks:
  - `npx tsc --noEmit`;
  - `npm run lint`;
  - `npx vitest run`;
  - `npm run ds:audit -- src/components/analise-do-mes src/components/dashboard src/components/categories/detail "src/app/(app)/dashboard" "src/app/(app)/categories"`.
- Não faça push. Faça stage só dos seus arquivos, um por um. `CLAUDE.md`, `graphify-out/graph.json` e as specs da aurora são de outra sessão.
- Dev em http://localhost:3000. A Carro: `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`. O Painel: `/dashboard`.

## Review Focus
1. Uma `?categoria=` inválida ou de receita cai em "Todas", sem quebrar.
2. Um mês sem despesa, ou a categoria escolhida sem gasto: o vazio da seção, nunca cartões zerados.
3. Convidado: nem a seção no Painel nem o link na categoria.
4. O corte de mês do crédito, pelo fechamento da fatura: o total da seção com "Todas" bate com a despesa do mês que o Painel já mostra.
5. A categoria sem insight com ação não mostra cartão de insight. A sugestão de limite continua abrindo o diálogo "Definir limite".

---

### Task 1: Os cartões de análise viram peças reutilizáveis

**Files:**
- Create: `src/components/analise-do-mes/` com um arquivo por cartão:
  - `ritmo-do-mes.tsx`;
  - `tamanho-das-compras.tsx`;
  - `como-foi-pago.tsx`;
  - `dias-da-semana.tsx`;
  - `destaques-do-mes.tsx`, com o conteúdo de `cartoes-do-gasto.tsx`.
  
  Os ajudantes que eles dividem (o `CartaoDoGrafico`, os rótulos, `diferencaDaForma` e os mapas de cor e ícone) vão para um `compartilhado.tsx`, ou ficam onde já moram em `lib/`.
- Modify: `src/components/categories/detail/resumo/graficos-do-resumo.tsx` e `resumo-da-categoria.tsx`, que passam a importar das peças novas.
- Move: os testes que já cobrem esses cartões, se houver.

**Interfaces (produz):** cada cartão é um componente que recebe dados prontos e o tipo (`despesa`), sem `categoryId` nem query. As props saem do que `GraficosDoResumo` já passa a cada pedaço hoje:
- **Ritmo:** `ritmo`, `aberto`, `yearMonth`, `corDaSerie`, `despesa` e o nome do que se mede (`oQue`);
- **Tamanho:** `concentracao`, `corDaSerie` e `despesa`;
- **Pago:** `porPagamento`, `porPagamentoAnterior`, `cartoes`, `aberto`, `yearMonth` e `despesa`;
- **Dias:** `diasDaSemana`, `corDaSerie` e `despesa`;
- **Destaques:** as props de `CartoesDoGasto`.

**Cada cartão é a própria `Card`.** Quem chama monta a grade.

- [ ] **Step 1:** Mova sem mudar o comportamento. Os testes existentes passam sem edição, a não ser o caminho do import.
- [ ] **Step 2:** Os rodapés de enchimento ("N compras no mês", "\<Dia\> foi o dia mais caro") saem, e o `mt-auto` do pé também. A contagem de `compras` por dia em `porDiaDaSemana` fica, porque a dica dela pode usar.
- [ ] **Step 3:** Checks e commit: `refactor(analise): os cartões de análise do mês viram peças de analise-do-mes`.

### Task 2: "Para onde vai o dinheiro" no Painel

**Files:**
- Create: `src/components/dashboard/use-analise-do-mes.ts` (+ teste da parte pura). Ele monta, a partir das transações do Painel, de `calendarYm`, do `creditCardClosingLookup` e da categoria escolhida (ou nenhuma), os mesmos dados que a página da categoria monta hoje. A referência é o `analise` em `src/app/(app)/categories/[categoryId]/page-client.tsx`, por volta da linha 465: `ritmoDoMes`, `divisaoPorPagamento` (do mês e do anterior), `porDiaDaSemana`, `concentracaoDasCompras`, `compraTipica`, `maisFrequente`, `diaDeMaisGasto` e `maioresLancamentos`.
- Create: `src/components/dashboard/dashboard-para-onde-vai.tsx`, com a seção, o filtro e a grade.
- Modify: `src/app/(app)/dashboard/page-client.tsx`, para pôr a seção onde o spec manda.
- Modify: `src/components/dashboard/dashboard-page-skeleton.tsx`.

**Interfaces:**
- A função pura é `analiseDoMes({ txs, txsAnterior, tipo: "expense", yearMonth, hojeYmd, lookup, cartoes, categoriaId: string | null, previsto })`, e devolve as props dos cartões da Task 1. Com `categoriaId`, ela filtra por `category_id`.
- O filtro usa o `Combobox` do DS, com as categorias de despesa do Painel e "Todas as categorias" no topo. Ele lê e escreve `?categoria=` com `useSearchParams` e `router.replace`. Ao abrir com `#para-onde-vai`, a seção rola à vista.

- [ ] **Step 1: Testes de `analiseDoMes`.**
  - Com "Todas", o total da concentração é igual à soma das despesas do mês pelo corte do crédito.
  - Com uma categoria, só as dela entram.
  - Uma categoria inexistente funciona como "Todas", e quem garante isso é o componente: teste a função de leitura do parâmetro.
  - Sem despesa, a função devolve um sinal de vazio.

  Confira que falham.
- [ ] **Step 2:** Implemente o hook e a seção conforme o spec (a ordem e a grade, a cor neutra ou da categoria, o vazio, o convidado fora e o esqueleto).
- [ ] **Step 3: Navegador**, só leitura. Confira `/dashboard`, depois `/dashboard?categoria=fdc3a58a-7d80-4cc6-a0ee-a92148f53820#para-onde-vai`, e a troca do filtro. Faça nos dois temas e a 375px.
- [ ] **Step 4:** Checks, `graphify update .` e commit `feat(painel): "Para onde vai o dinheiro", com o filtro de categoria`.

### Task 3: A categoria enxuta e a ponte para o Painel

**Files:**
- Modify: `src/app/(app)/categories/[categoryId]/page-client.tsx`:
  - saem as abas;
  - a ordem do spec: faixa, "Últimos 6 meses", insight, lista e link;
  - o `analise` é enxugado ao que sobra.
- Modify ou delete: `src/components/categories/detail/resumo/*`. A pasta fica só com o que a tela ainda usa: o cartão "Últimos 6 meses" e o cartão de insight. O resto ou já mudou na Task 1, ou sai.
- Modify: o esqueleto da página (`loading.tsx` ou `CategoryDetailSkeleton`).
- Modify: `docs/JORNADAS.md` (G9, G4, o mapa geral e a tabela de regras), `docs/atlas/template.html` (a jornada 9, a 4, a data da capa e as contagens) e rode `python3 docs/atlas/build.py`. **Não republique** o Atlas.

**Interfaces:** consome os cartões da Task 1. A linha do limite no "Últimos 6 meses" é a `ChartReferenceLine` com `label`, como a média.

- [ ] **Step 1:** Monte a tela nova e tire as abas. O "Ver em Transações" e o vazio da lista continuam.
- [ ] **Step 2:** O insight: o primeiro com `acao`, num cartão. A sugestão de limite abre o diálogo de hoje, e "Ver na Previsão" leva a `/previsao`. O convidado vê sem botão.
- [ ] **Step 3:** O link "Ver a análise de \<nome\> no Painel ›" vai para `/dashboard?categoria=<id>#para-onde-vai`, só na despesa e só para o adulto. Confira no navegador que ele abre o Painel filtrado.
- [ ] **Step 4:** Jornadas e Atlas, como em Files.
- [ ] **Step 5:** Checks, `graphify update .` e commit `feat(categoria): o detalhe enxuto, com a lista na tela e a análise no Painel`.

### Depois (sessão principal)
- Passada visual lado a lado com o mockup.
- Republicar o Atlas.
