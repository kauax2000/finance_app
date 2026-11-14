# Os cards da receita — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o detalhe de uma receita mostra três cards: Receitas do mês (R5), Saldo do mês (R2) e Receitas nos últimos 6 meses (R3).

**Architecture:** as contas puras moram em `src/lib/detalhe/receitas.ts` (testadas); cada card é um componente em `src/components/transactions/detalhe/`, sobre `BlocoContexto`, montado em `transaction-detail-sheet.tsx` logo depois do `BlocoReceitas`.

**Tech Stack:** Next 16, React 19, TanStack Query, Recharts (via `ChartContainer`), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-14-cards-da-receita-design.md`

## Global Constraints

- Só componentes de `src/components/ui/` e tokens existentes; nada novo em `ui/` nem em `globals.css`.
- Dinheiro: `income`/`expense` (tokens e `MoneyDisplay tone`); nunca `success`/`destructive` para dinheiro.
- Textos exatos: "Esta, R$ X", "faltam R$ X para entrar", "N% do que entrou em <mês>", "Saldo de <mês>", "entrou", "saiu", "sobra", "Ver o mês", "Receitas nos últimos 6 meses", "↑ R$ X sobre <mês>", "↓ R$ X abaixo de <mês>". Valores por `currencyBRL`; mês por `mesPorExtenso`.
- Cada card: `BlocoContextoEsqueleto` carregando; consulta com erro → `null`.
- Nenhuma gravação no banco (o dev usa o banco de produção).
- `npm run ds:audit` limpo nos arquivos tocados; `npx tsc --noEmit`, `npm run lint`, vitest dos arquivos tocados.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; `git add` só dos próprios arquivos (nunca `graphify-out/graph.json`); sem push; sem prettier. Depois: `graphify update .`.

## Review Focus

- Receita única no mês: a fatia é 100% e a legenda diz "100% do que entrou".
- Esperado menor que o total (entrou mais que o prometido): a barra vai até o total, sem "faltam".
- Mês sem nenhuma despesa: "saiu R$ 0,00" e "sobra" igual ao que entrou.
- Sobra negativa: em `expense`, com o sinal.
- Mês anterior sem receita: sem selo no card dos 6 meses.

---

### Task 1: as contas puras

**Files:**
- Create: `src/lib/detalhe/receitas.ts`
- Create: `src/lib/detalhe/receitas.test.ts`

**Interfaces — Produces:**
- `legendaDaReceita(args: { valor: number; total: number; esperado: number; mesCorrente: boolean; mes: string }): string` — o texto depois de "Esta, R$ X · ".
- `maximoDaBarra(total: number, esperado: number): number` — `Math.max(total, esperado)`.
- `receitasPorMes(txs: Pick<Transaction,"type"|"amount"|"date"|"payment_method">[], meses: string[]): Array<{ ym: string; total: number }>` — soma receitas por mês calendário (`transactionLocalYmd`), sem o estorno no cartão (`ehEstornoNoCartao`), uma entrada por mês pedido, na ordem.
- `seloContraOAnterior(atual: number, anterior: number, mesAnterior: string): { texto: string; sobe: boolean } | null` — `null` com `anterior <= 0` ou diferença 0.

- [ ] **Step 1: testes** (`receitas.test.ts`):
  - `legendaDaReceita({ valor: 8000, total: 8450, esperado: 9000, mesCorrente: true, mes: "novembro" })` → `"faltam R$ 550,00 para entrar"`.
  - `legendaDaReceita({ valor: 8000, total: 8450, esperado: 0, mesCorrente: false, mes: "novembro" })` → `"95% do que entrou em novembro"`.
  - `legendaDaReceita({ valor: 8000, total: 8000, esperado: 0, mesCorrente: true, mes: "novembro" })` → `"100% do que entrou em novembro"`.
  - `legendaDaReceita({ valor: 8000, total: 9500, esperado: 9000, mesCorrente: true, mes: "novembro" })` → `"84% do que entrou em novembro"`.
  - `maximoDaBarra(8450, 9000)` → 9000; `maximoDaBarra(9500, 9000)` → 9500.
  - `receitasPorMes` com uma receita em 2026-11-05 (8000), uma em 2026-10-05 (8000), um estorno `payment_method: "credit_card"` em 2026-11-08 e uma despesa → `[{ym:"2026-10",total:8000},{ym:"2026-11",total:8000}]` para `["2026-10","2026-11"]`.
  - `seloContraOAnterior(8450, 8000, "outubro")` → `{ texto: "↑ R$ 450,00 sobre outubro", sobe: true }`; `seloContraOAnterior(7000, 8000, "outubro")` → `{ texto: "↓ R$ 1.000,00 abaixo de outubro", sobe: false }`; `seloContraOAnterior(8000, 0, "outubro")` → `null`.
- [ ] **Step 2:** `npx vitest run src/lib/detalhe/receitas.test.ts` → FAIL.
- [ ] **Step 3:** implementar (porcentagem `Math.round(valor/total*100)`; `currencyBRL` para valores; `roundCents` nas somas).
- [ ] **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat(receitas): as contas dos cards da receita`.

### Task 2: o card R5 (Receitas do mês)

**Files:**
- Modify: `src/components/transactions/detalhe/bloco-receitas.tsx`
- Test: `src/components/transactions/detalhe/blocos.test.ts` (leitura de fonte, como os outros blocos)

**Interfaces — Consumes:** `legendaDaReceita`, `maximoDaBarra` (Task 1); `BarraNaCor`, `PontoNaCor` de `./bloco-contexto` (veja como `bloco-categoria.tsx` os usa); `Progress` com `highlight`.

- [ ] **Step 1: teste** em `blocos.test.ts`: a fonte do `bloco-receitas.tsx` usa `legendaDaReceita`, `maximoDaBarra`, `<Progress` com `highlight=` e contém `"Esta, "`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** redesenhar o retorno conforme a spec, card 1: linha do total (`MoneyDisplay size="lg" tone="income"` e, com `mesCorrente && esperado > 0`, `Muted` "de R$ X"); a barra numa cor de receita (`BarraNaCor` com a cor de `--income`, ou o meio que o `Progress` já oferece para cor própria — sem literal), `value={total}`, `max={maximoDaBarra(total, esperado)}`, `highlight` cobrindo o valor desta receita (a fatia começa onde as receitas anteriores a esta, na ordem de data, terminam; se a ordem não for confiável, do fim: `{ from: total - valor, to: total }`); a legenda `Caption` com o ponto + "Esta, " + valor + " · " + `legendaDaReceita(...)`. Total 0 → sem barra. Manchete e link inalterados.
- [ ] **Step 4:** testes, `tsc`, `lint`, `ds:audit` do arquivo → limpos.
- [ ] **Step 5: Commit** `feat(receitas): o card do mês mostra a fatia desta receita e o que falta entrar`.

### Task 3: o card R2 (Saldo do mês)

**Files:**
- Create: `src/components/transactions/detalhe/bloco-saldo-do-mes.tsx`
- Modify: `src/components/transactions/transaction-detail-sheet.tsx` (montar logo depois do `BlocoReceitas`, com a mesma `key` por `chaveDosBlocos`)
- Test: `blocos.test.ts`

**Interfaces — Produces:** `BlocoSaldoDoMes({ transaction }: { transaction: Transaction })`, só para `type === "income"`.

- [ ] **Step 1: teste:** a fonte usa `aggregateIncomeExpenseForMonth`, contém `"Saldo de "`, `"entrou"`, `"saiu"`, `"sobra"`, `"Ver o mês"`; o sheet monta `<BlocoSaldoDoMes`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** as contas como o Painel: ler `src/components/dashboard/use-dashboard-data.ts` para o intervalo de transações e o `CreditCardClosingLookup` (`buildCreditCardClosingLookup`) que ele passa a `aggregateIncomeExpenseForMonth`, e reproduzir com as mesmas consultas (`useTransactionsRangeQuery` e a dos cartões). Três colunas (`DescriptionList` com `columns={3}` e `term="eyebrow"`, ou o que o catálogo indicar): entrou `MoneyDisplay tone="income"`, saiu `tone="expense"`, sobra neutra (negativa em `expense`). Link "Ver o mês": `hrefDaLista([{ field: "periodo", operator: "is", values: [period_start, period_end] }])` sem tipo.
- [ ] **Step 4:** testes, `tsc`, `lint`, `ds:audit` → limpos.
- [ ] **Step 5: Commit** `feat(receitas): o card do saldo do mês no detalhe da receita`.

### Task 4: o card R3 (Receitas nos últimos 6 meses)

**Files:**
- Create: `src/components/transactions/detalhe/bloco-receitas-no-tempo.tsx`
- Modify: `src/components/transactions/transaction-detail-sheet.tsx` (depois do `BlocoSaldoDoMes`)
- Test: `blocos.test.ts`

**Interfaces — Consumes:** `receitasPorMes`, `seloContraOAnterior` (Task 1); o desenho das barras de `bloco-historico.tsx` (`ChartContainer`, `BarChart`, `Bar`, `Cell`).

- [ ] **Step 1: teste:** a fonte usa `receitasPorMes`, `seloContraOAnterior`, `ChartContainer`, contém `"Receitas nos últimos 6 meses"`; o sheet monta `<BlocoReceitasNoTempo`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** consulta de 6 meses (`useTransactionsRangeQuery` do 1º dia de `shiftYearMonth(ym,-5)` ao fim de `ym`); `receitasPorMes`; menos de 2 meses com receita → `null`. Barras como no histórico, o mês da receita em `--income` e os outros no neutro do histórico; eixo com o primeiro mês e o da receita em negrito (abreviados, como o histórico faz com as datas). Selo `Badge variant="soft" size="sm"` no `canto`, tom `success` se `sobe`, `warning` senão.
- [ ] **Step 4:** testes, `tsc`, `lint`, `ds:audit` → limpos.
- [ ] **Step 5: Commit** `feat(receitas): o card das receitas nos últimos 6 meses`.
