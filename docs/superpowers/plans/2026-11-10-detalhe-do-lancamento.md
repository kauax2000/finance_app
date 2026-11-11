# Detalhe do lançamento ("isso pesa?") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refazer o painel de detalhe da transação para responder "isso pesa?": topo enxuto, uma manchete, blocos de contexto com link, detalhes num bloco pequeno.

**Architecture:** A lógica pura (normalizar descrição, projeção, histórico, escolha da manchete) mora em `src/lib/detalhe/contexto.ts`, testada sem React. Cada bloco é um componente em `src/components/transactions/detalhe/`, que lê dados por hooks já existentes (`useCategoryDetailBundleQuery`, `useTransactionsRangeQuery`, `useSubscriptionsQuery`) e some se a leitura falhar. O `transaction-detail-sheet.tsx` monta topo, manchete, blocos e detalhes. O `Progress` ganha `marker` (o traço do dia), aprovado pelo dono em 10/11/2026.

**Tech Stack:** Next 16, React 19, TanStack Query, Supabase, Tailwind v4, Vitest (testes de fonte e de função).

**Spec:** `docs/superpowers/specs/2026-11-10-detalhe-do-lancamento-design.md`

## Global Constraints

- Tudo com componentes do design system (`src/components/ui/`); nenhum componente novo declarado em tela; tokens, nunca cor crua (AGENTS.md, invariantes 1 e 2).
- Mudar `src/components/ui/` só no que este plano diz (o `marker` do `Progress`), com página de docs e teste na mesma mudança (invariante 8).
- Ícones Heroicons (`16/solid` até `size-4`).
- Dinheiro: `MoneyDisplay` e `currencyBRL`; datas: helpers de `src/lib/transaction-date.ts`.
- Banco: só leitura. Nenhuma migração, RPC ou índice novo.
- O banco de desenvolvimento é o de produção: nenhum teste grava dado.
- Textos em português; sem hora (o lançamento guarda só o dia).
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; `git add` só dos próprios arquivos; nada de push.
- Mudança de destino de link é mudança de jornada: `docs/JORNADAS.md` + `docs/atlas/template.html` + `python3 docs/atlas/build.py` na mesma tarefa.

## Review Focus

- Lançamento de um mês que passou: a manchete de orçamento usa o passado ("fechou outubro em…"), nunca projeção.
- Descrição com "(1/2)" e acento ("Pão (1/2)" e "pao") contam como o mesmo histórico.
- Categoria sem orçamento: bloco mostra total e o mês anterior até o mesmo dia, e o link "definir orçamento"; nunca barra.
- Despesa sem categoria ou sem cartão: o bloco correspondente não aparece, e o painel não quebra.
- Convidado: sem orçamento, sem fatura, sem manchete de orçamento.

---

### Task 1: `Progress` ganha `marker`

**Files:**
- Modify: `src/components/ui/progress.tsx` (tipo `Base` ~L105; render perto da `cesura` ~L224)
- Modify: `src/app/designsystem/docs/progress.tsx` (um interruptor/nota "Traço do ritmo")
- Modify: `AGENTS.md` (bullet do `Progress`: "`marker` (0–100) é o traço do ritmo: onde o período está")
- Test: `src/components/ui/progress-versions.test.ts` (crie se não existir; use `renderToStaticMarkup` como os outros `*-versions.test.ts`)

**Interfaces:**
- Produces: `<Progress marker?: number>` — percentual 0–100 da trilha; fora disso não desenha.

- [ ] **Step 1: Teste**

```ts
it("marker desenha o traço do ritmo na posição", () => {
  const html = renderToStaticMarkup(<Progress value={82} bands={[85, 100]} marker={33} />)
  expect(html).toContain('data-slot="progress-marker"')
  expect(html).toMatch(/left:\s*33%/)
})
it("marker fora de 0–100 não desenha", () => {
  expect(renderToStaticMarkup(<Progress value={10} marker={140} />)).not.toContain("progress-marker")
})
```

- [ ] **Step 2:** `npx vitest run src/components/ui/progress-versions.test.ts` → FAIL.
- [ ] **Step 3:** Implemente: um `<span data-slot="progress-marker" aria-hidden>` absoluto em `left: N%`, 2px, altura da trilha, na tinta `bg-foreground/60` (traço com alfa é acento — AGENTS "Tokens"), acima da faixa; convive com `bands`, `tone` e a cesura. Documente na página do `Progress` (nota curta + exemplo).
- [ ] **Step 4:** Teste PASS; `npm run ds:audit -- src/components/ui/progress.tsx` sem achados; `npx tsc --noEmit`.
- [ ] **Step 5:** Commit `feat(progress): marker, o traço do ritmo`.

### Task 2: A lógica do contexto

**Files:**
- Create: `src/lib/detalhe/contexto.ts`
- Test: `src/lib/detalhe/contexto.test.ts`

**Interfaces:**
- Produces:
  - `normalizarDescricao(s: string): string` — tira " (k/n)" do fim, acentos, caixa e espaços duplos.
  - `projecaoDoMes(gastoAteHoje: number, hoje: Date): number` — `gasto / diaDoMes * diasNoMes`, em centavos.
  - `historicoDe(alvo: { id: string; description: string | null; amount: number; date: string }, despesas90: Array<same shape>): Historico | null` — `Historico = { vezes: number; total: number; media: number; barras: { valor: number; atual: boolean }[] }`; conta o alvo; `null` com menos de 3 vezes; `media` é das **outras** vezes; `barras` são as últimas 8 em ordem de data, a do alvo com `atual: true`.
  - `escolherManchete(e: EntradaDaManchete): Manchete | null`, com
    `EntradaDaManchete = { mesCorrente: boolean; hoje: Date; categoria?: { nome: string; mes: string /* "novembro" */; gasto: number; orcamento: number | null }; historico?: { nome: string; valor: number; media: number } | null; parcela?: { ultimaNoMes: string /* "dezembro" */; ultimaEhEsteOuProximo: boolean; valorParcela: number } | null }`
    e `Manchete = { tom: "warning" | "info" | "success"; texto: string }`.

- [ ] **Step 1: Testes** (valores do spec, texto exato)

```ts
expect(normalizarDescricao("Pão  (1/2)")).toBe("pao")
expect(projecaoDoMes(400, new Date(2026, 10, 10))).toBe(1200)
// orçamento estourado
expect(escolherManchete({ mesCorrente: true, hoje: new Date(2026,10,10), categoria: { nome: "Mercado", mes: "novembro", gasto: 1120, orcamento: 1000 } }))
  .toEqual({ tom: "warning", texto: "Mercado passou do orçamento de novembro em R$ 120,00." })
// projeção acima, a partir do dia 5
expect(escolherManchete({ mesCorrente: true, hoje: new Date(2026,10,10), categoria: { nome: "Mercado", mes: "novembro", gasto: 400, orcamento: 1000 } })?.texto)
  .toBe("No ritmo de agora, Mercado fecha novembro em R$ 1.200,00, R$ 200,00 acima do orçamento.")
// antes do dia 5, sem projeção
expect(escolherManchete({ mesCorrente: true, hoje: new Date(2026,10,4), categoria: { nome: "Mercado", mes: "novembro", gasto: 300, orcamento: 1000 } })).toBeNull()
// mês passado
expect(escolherManchete({ mesCorrente: false, hoje: new Date(2026,10,10), categoria: { nome: "Mercado", mes: "outubro", gasto: 1240, orcamento: 1000 } })?.texto)
  .toBe("Mercado fechou outubro em R$ 1.240,00, 24% acima do orçamento.")
// preço fora do normal (>= 30%)
expect(escolherManchete({ mesCorrente: true, hoje: new Date(2026,10,10), historico: { nome: "Uber", valor: 43.97, media: 28.8 } }))
  .toEqual({ tom: "info", texto: "Este Uber custou 53% mais que a sua média (R$ 28,80)." })
// fim das parcelas
expect(escolherManchete({ mesCorrente: true, hoje: new Date(2026,10,10), parcela: { ultimaNoMes: "dezembro", ultimaEhEsteOuProximo: true, valorParcela: 253.5 } }))
  .toEqual({ tom: "success", texto: "Última parcela em dezembro. Depois, R$ 253,50 a mais por mês." })
// prioridade: orçamento vence histórico
// historicoDe: 3+ vezes, média das outras, 8 barras, normalização
```

(Use `currencyBRL` e confira o espaço inseparável com regex `\s` se o `toBe` falhar por ele.)

- [ ] **Step 2:** FAIL. **Step 3:** implemente. **Step 4:** PASS. **Step 5:** Commit `feat(detalhe): a lógica do contexto e da manchete`.

### Task 3: Os blocos de contexto

**Files:**
- Create: `src/components/transactions/detalhe/bloco-categoria.tsx`, `bloco-fatura.tsx`, `bloco-historico.tsx`, `bloco-receitas.tsx`, `bloco-parcelada.tsx`, `bloco-contexto.tsx` (a casca comum: sobrancelha + link + corpo, sobre `Card`/`CardToolbar` do DS; esqueleto `Skeleton`/`CardSkeleton`)
- Test: `src/components/transactions/detalhe/blocos.test.ts` (fonte: cada bloco usa a casca, `Progress` com `bands={BUDGET_BANDS}` e `marker`, links pelos helpers, `null` em erro)

**Interfaces:**
- Consumes: Task 1 (`marker`), Task 2 (`historicoDe`, `normalizarDescricao`, `projecaoDoMes`).
- Produces: cada bloco recebe `{ transaction: Transaction }` e expõe, por um callback opcional `onManchete?(dados)`, o que a manchete precisa (o painel junta). Dados:
  - **Categoria** (despesa com categoria; mês da data do lançamento): `useCategoryDetailBundleQuery` (orçamento, gasto do mês, `prevMonthCategoryTotal` — para "até o mesmo dia" filtre `txs` do mês anterior em JS se o bundle não trouxer). Com orçamento: "R$ 820 de R$ 1.000", "faltam R$ 180 · 20 dias", `Progress bands={BUDGET_BANDS} marker={dia/diasNoMes*100}` (marker só no mês corrente). Sem orçamento: total + "outubro até dia 10: R$ 240" + link "definir orçamento" (`categoryDetailPath(id, { month })`). Link "ver os N": `/transactions?f=` com `serializeFilters([categoria is id, periodo is [inicio, fim]])`.
  - **Fatura** (despesa no crédito com cartão): janela por `invoiceWindowForPurchaseDate`; transações do cartão na janela via `useTransactionsRangeQuery`; total = `sumCreditCardExpensesInWindow − sumCreditCardRefundsInWindow`; estado pelo slot (`creditCardInvoiceBadgeForRow`, e "paga" pelas chaves de fatura paga); "R$ X em parcelas" quando houver; link `creditCardDetailPath(cardId)`. Título "Fatura de <mês do vencimento>".
  - **Histórico**: `useTransactionsRangeQuery` dos últimos 90 dias até a data do lançamento, despesas, `historicoDe`; barras pequenas com o componente de gráfico do DS (rode `npm run ds:catalog` e use `ChartBarList` ou barras do `Chart`; a do alvo em destaque); "14 vezes · R$ 406" e "média R$ 29"; link `/transactions?f=` com `descricao contains <descrição sem (k/n)>`.
  - **Parcelada**: o resumo do plano já calculado no painel (`summarizeInstallmentPlan`): "R$ 507 em 2×", "falta R$ 253,50", `Progress segments={n}`, "1 de 2 · próxima 9/dez"; substitui o `InstallmentPurchaseSection` no painel (o `ImpactoDaParcela` fica). Link "ver parcelas": `?plan=` de Transações.
  - **Receitas** (receita): total de receitas do mês (`useTransactionsRangeQuery` do mês), "de R$ X esperados" com as assinaturas de receita ativas (`useSubscriptionsQuery`, tipo receita) só no mês corrente; link `/transactions?type=income&f=periodo…`.
  - Convidado (`useWorkspace().papel === "guest"`): Categoria sem orçamento nem link de orçamento; Fatura não monta.

- [ ] **Step 1:** Testes de fonte. **Step 2:** FAIL. **Step 3:** implemente. **Step 4:** PASS + `npm run ds:audit -- src/components/transactions/detalhe` sem achados + `npx tsc --noEmit`. **Step 5:** Commit `feat(detalhe): os blocos de contexto`.

### Task 4: O painel novo

**Files:**
- Modify: `src/components/transactions/transaction-detail-sheet.tsx` (corpo ~L330–470)
- Modify: `src/components/transactions/transaction-detail-sheet.test.ts`
- Modify: `docs/JORNADAS.md` (linha "Detalhe" e o diagrama G5b: os links novos do detalhe), `docs/atlas/template.html`, rode `python3 docs/atlas/build.py`

**Interfaces:**
- Consumes: Tasks 2 e 3.

Ordem do corpo (spec "A forma"):
1. Topo: `ColorTile` da categoria; `MoneyDisplay size="xl" signed` (tom receita); título = descrição sem " (k/n)" (mesma regra de `transacoes-tabela.tsx`), com o chip `k/n` quando parcela; linha `Muted` "Seg, 10 de nov · Cartão Teste •• 1111" (dia curto + forma; Pix/TED/… pelo rótulo).
2. Manchete: `Alert` no tom (`warning`/`info`/`success`) com `escolherManchete`, alimentada pelos `onManchete` dos blocos; nada sem manchete.
3. Blocos: Categoria (despesa), Fatura (crédito), Histórico, Parcelada (parcela), Receitas (receita).
4. Detalhes: categoria (ladrilho + nome) e "quem" — "Kauã lançou e pagou" quando autor = pagador; "Renata pagou · Kauã lançou" quando não; recorrência, assinatura e projeto como hoje.
5. `AConferirNoDetalhe`, `PartesDaDespesa`, `AnexosDoLancamento` como hoje.
6. Nota no fim: "Lançado pelo app" (`rotuloDaOrigem`), `Caption`.
Saem: a linha Data, "Lançado por" e "Entrou por" da lista, e a linha de autor do topo.

- [ ] **Step 1:** Ajuste os testes de fonte do painel: sem `DescriptionTerm>Data`, sem `Entrou por`, com `escolherManchete`, com os cinco blocos, nota de origem.
- [ ] **Step 2:** FAIL. **Step 3:** implemente + docs. **Step 4:** `npx vitest run src/components/transactions src/lib` PASS; `npx tsc --noEmit`; `npm run lint`; `npm run ds:audit -- src/components/transactions/transaction-detail-sheet.tsx`. **Step 5:** Commit `feat(detalhe): o painel responde "isso pesa?"` (inclui JORNADAS e atlas).

O controlador republica o Atlas (https://claude.ai/artifact/1N43LFYP1YSVsWaRMaNTRL) e confere no navegador, na carteira "Teste · Detalhe": Queijo (manchete de ritmo + barra com traço), Uber de 10/11 (manchete de preço + histórico), Zara 1/2 (fim das parcelas), Salário (receitas).
