# "Como foi pago" — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o cartão "Como foi pago" do resumo da categoria pela rosca C2 com a legenda C3.

**Architecture:**
- O `ChartDonut` do design system ganha duas capacidades.
- A lib conta as compras e compara cada forma com o mês anterior.
- A tela compõe o caso de várias formas e o de uma forma só.

**Tech Stack:** React 19, Recharts 3.8 via `@/components/ui/chart`, Tailwind v4, vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-como-foi-pago-design.md`

## Global Constraints
- `AGENTS.md` vale inteiro:
  - tokens apenas, Heroicons apenas;
  - nenhum componente declarado em `src/app/`;
  - componente mudado entra com a página de docs, o `chart-versions.test.ts` e a linha em "Gráficos" do `AGENTS.md`.
- Antes de buscar código, `graphify query "<pergunta>"`; depois de mudar, `graphify update .`.
- O banco do dev é produção: no app só leitura.
- Checks: `npx tsc --noEmit`, `npm run lint`, `npx vitest run src/components/ui src/components/categories src/lib`, `npm run ds:audit -- src/components/categories/detail src/components/ui/chart.tsx`.
- Não faça push.

## Review Focus
1. Receita: o tom da diferença inverte (receber mais é `success`).
2. Forma sem mês anterior: "novo", sem número.
3. Diferença zero (arredondada): "igual", neutro, sem sinal.
4. Forma "Sem forma" ou pagamento que não é cartão no caso de uma forma: o ícone certo no miolo, nunca uma ficha de bandeira vazia.
5. O `ChartDonut` sem as props novas fica idêntico ao de hoje (Painel, fatura).

---

### Task 1: `ChartDonut` — detalhe na legenda e forma arredondada

**Files:** `src/components/ui/chart.tsx`, `src/app/designsystem/docs/chart.tsx`, `src/components/ui/chart-versions.test.ts`, `AGENTS.md` (seção Gráficos).

**Interfaces — Produces:**
- `legendDetail?: (index: number) => React.ReactNode`, só com `legend="list"`:
  - a linha ganha, embaixo do nome, o nó dado em `text-muted-foreground`;
  - a coluna do valor sai (o % fica);
  - o nome e o detalhe formam um par de identidade, sem `gap`.
- `rounded?: boolean`:
  - `paddingAngle` 3, `cornerRadius` 4 e sem o traço de superfície (`strokeWidth` 0);
  - com uma fatia só, `paddingAngle` 0, senão o anel abre.

- [ ] Testes em `chart-versions.test.ts` (padrão do arquivo, pela fonte ou render): `legendDetail` renderiza o nó e esconde o valor; `rounded` passa `cornerRadius` e zera o traço; sem as props nada muda. Confira que falham.
- [ ] Implemente.
- [ ] Docs: exemplo vivo na página do Chart (forma de pagamento: "Bradesco Visa Infinity", "Pix", "Dinheiro" com a diferença); linha no `AGENTS.md`.
- [ ] Checks; commit `feat(ds): detalhe na legenda e forma arredondada na rosca`.

### Task 2: A tela

**Files:**
- `src/lib/categoria-detalhe.ts` (+ teste);
- `src/app/(app)/categories/[categoryId]/page-client.tsx`;
- `src/components/categories/detail/resumo/graficos-do-resumo.tsx`.

**Interfaces:**
- `Fatia` ganha `compras: number`: lançamentos com `peso === 1` naquela chave. `dividir` conta, e as outras divisões ganham o campo de graça.
- `divisaoPorPagamento` passa a devolver também `forma` (`payment_method` ou `"credit_card"`) e `cardId` (o `payment_credit_card_id`, ou null), para o miolo achar a bandeira.
- `diferencaPorForma(atual: Fatia[], anterior: Fatia[]): Record<string, number | null>`: chave → `atual − anterior` em reais, ou `null` quando a chave não existe no anterior.
- A página calcula `porPagamentoAnterior` com os lançamentos do mês anterior, filtrados como o `txs` do mês é filtrado: ache onde `txs` nasce e reuse o mesmo filtro com `shiftYearMonth(yearMonth, -1)`. Ela passa `porPagamentoAnterior` e os cartões (para a bandeira) ao `GraficosDoResumo`.

- [ ] Testes da lib: `compras` conta; `diferencaPorForma` com aumento, queda, `null` para forma nova.
- [ ] O cartão, como diz a spec:
  - várias formas: `ChartDonut rounded legend="list"` em `size-30`, `center={<ChartDonutCenter amount={total} label="no mês" />}` e `legendDetail` com `R$ valor · ±diferença` (`reaisInteiros` / `currencyBRL`, como o resto do arquivo), ou "novo", ou "igual";
  - uma forma: `ChartDonut rounded legend={false}` com o miolo da bandeira (`CreditCardBrandChip` com a bandeira do cartão; outra forma: o ícone Heroicons que o app já usa para ela, procure `paymentMethodIcon` ou equivalente), e o texto ao lado;
  - o título sem `apoio`.
- [ ] Confira no navegador (http://localhost:3000/categories/411e7afa-7f98-485d-ad03-4ef2a6fbb35d?type=expense&month=2026-11 é uma forma; ache uma categoria com duas ou mais formas em outro mês). Só leitura.
- [ ] Checks; `graphify update .`; commit `feat(categoria): "Como foi pago" com a rosca arredondada, compras e a diferença contra o mês anterior`.
