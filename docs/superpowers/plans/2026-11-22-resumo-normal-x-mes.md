# Resumo: insight em cima e o seu normal × este mês — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A frase vira um cartão de insight em cima, e o cartão "Do que é feito o mês" passa a desenhar o seu normal × este mês em duas barras empilhadas.

**Architecture:** São três partes:
- a frase mais curta (TDD), em `src/lib/composicao-do-mes.ts`;
- a peça de barras comparadas no DS (`src/components/ui/chart.tsx`, registry, docs e teste);
- a tela, em `src/components/categories/detail/do-que-e-feito-o-mes.tsx`.

**Tech Stack:** React 19, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-22-resumo-normal-x-mes-design.md`. Mockup: `docs/design/painel/do-que-e-feito-visual.html` (opção G).

## Global Constraints
- Vale o `AGENTS.md` inteiro: tokens com par escuro, Heroicons pela régua de tamanho, invariante 8 para peça nova ou prop nova do DS, a página de docs na forma fixa (`doc-pages.test.ts`), `npm run ds:docs-map`, o par de identidade sem gap e o dinheiro com `reaisInteiros`/`currencyBRL`.
- Antes de buscar código, rode `graphify query`. Depois de mudar, rode `graphify update .`.
- O banco do dev é produção: no app, só leitura.
- Checks:
  - `npx tsc --noEmit`;
  - `npm run lint`;
  - `npm run test:unit`;
  - `npm run ds:audit -- src/components/categories/detail src/components/ui/chart.tsx`.
- Não faça push. Faça stage só dos seus arquivos (`CLAUDE.md` e `graphify-out/graph.json` são de outra sessão).
- Telas:
  - Renata: `/categories/411e7afa-7f98-485d-ad03-4ef2a6fbb35d?type=expense&month=2026-11`;
  - Carro: `/categories/fdc3a58a-7d80-4cc6-a0ee-a92148f53820?type=expense&month=2026-11`.

## Review Focus
1. Sem média (`normais` null): sem linha do normal e sem selo.
2. Mês sem fixo, ou sem variável: um pedaço só em cada barra, sem pedaço de largura zero com texto.
3. Pedaço estreito (o fixo de R$ 147 no normal da Carro): sem texto estourando.
4. 375px: nada de rolagem horizontal; o texto dentro das barras cai para só o valor.
5. Receita: os tons invertidos no selo e no insight.

---

### Task 1: A frase mais curta e o tom do insight

**Files:** `src/lib/composicao-do-mes.ts`, `src/lib/composicao-do-mes.test.ts`

- [ ] **Testes:**
  - o caso que começa pelo variável **termina sem** ", e o mês ficou …". A Renata vira "O que você controla subiu 67%: R$ 776, R$ 312 acima do seu normal, puxado por Corte e hidratação (novo, R$ 480). As parcelas caíram.", e, sem fixo mudado, termina no fecho do "puxado por …).";
  - `tomDoInsight(c, despesa): "warning" | "success" | "info"`, com os casos do spec.

  Confira que falham.
- [ ] Implemente e rode os testes.
- [ ] Commit: `feat(categoria): a frase do mês sem repetir a faixa`.

### Task 2: A peça de barras comparadas no DS

**Files:** `src/components/ui/chart.tsx` (ou um arquivo irmão, se o padrão do chart pedir), `src/app/designsystem/registry.ts`, a página em `src/app/designsystem/docs/`, um teste `*-versions.test.ts` e o bullet no `AGENTS.md` (seção Gráficos).

- [ ] Escolha entre uma prop nova do `ChartSplit` ou uma peça irmã, conforme o código existente. Deixe a escolha anotada no relatório. A peça recebe as linhas, cada uma com rótulo, segmentos (chave, valor e texto opcional dentro) e `variant` (`solid` | `ghost`), e desenha todas na mesma escala, com o pedaço sem texto quando não cabe.
- [ ] Teste: a escala comum (a maior linha a 100%), o texto escondido quando não cabe, o nome acessível e a ausência de segmento com valor 0.
- [ ] Página de docs na forma fixa, `npm run ds:docs-map`, registry.
- [ ] Commit: `feat(ds): barras comparadas (seu normal × este mês)`.

### Task 3: A tela

**Files:** `src/components/categories/detail/do-que-e-feito-o-mes.tsx` e, se preciso, `src/app/(app)/categories/[categoryId]/page-client.tsx` e o esqueleto.

- [ ] O cartão de insight em cima, no lugar do resumo de hoje: `Item variant="outline"` e `ItemMedia variant="tile" tone`, como no `InsightDaCategoria`.
- [ ] O cartão "Do que é feito o mês", com o selo do total no `apoio` (ou `CardAction`) e a peça da Task 2 com as linhas "seu normal" e `<nome do mês>`. A legenda fica embaixo.
- [ ] As duas listas de baixo não mudam.
- [ ] Navegador, só leitura: Renata e Carro no desktop e a 375px, comparando com o G do mockup.
- [ ] Checks, `graphify update .` e o commit `feat(categoria): o resumo mostra o seu normal × este mês`. Faça o stage também do spec, do plano e do mockup `docs/design/painel/do-que-e-feito-visual.html`.
