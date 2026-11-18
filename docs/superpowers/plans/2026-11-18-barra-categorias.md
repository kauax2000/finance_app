# Barra de Categorias — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O seletor de mês vira a cápsula `‹ mês ›` com "Voltar a este mês" só fora do mês atual, e a aba Receitas de Categorias ganha o mês e o valor recebido + previsto por categoria.

**Architecture:**
- Uma função pura nova soma as receitas do mês por categoria, pela regra de Previsão: `cobrancasLancadas` e `cobrancasPorLancar`, de `src/lib/previsao/fatura-prevista.ts`.
- O miolo compartilhado do `MonthNav` passa a compor `ButtonGroup`.
- A página liga o mês nas duas abas e passa os valores ao `IncomeCategoryCard`.

**Tech Stack:** Next.js, React, Tailwind v4, Vitest (`@/test/fonte` para testes de fonte).

**Spec:** `docs/superpowers/specs/2026-11-18-barra-categorias-design.md`

## Global Constraints

- Nada muda em `src/components/ui/` nem em `globals.css`.
- "Voltar a este mês" é `Button variant="tertiary"` e só existe quando `budgetMonthYm !== formatYearMonth(new Date())`.
- A cápsula segue a escada da `Toolbar` (`--toolbar-control`: 36 no mouse, 44 no dedo).
- Dinheiro sai de `currencyBRL` / `MoneyDisplay` (`src/lib/formatters.ts`), nunca formatado à mão.
- Texto do cartão de receita:
  - com previsto: `Recebido R$ X · + R$ Y previstos`;
  - sem previsto: `Sem previsões no mês`.
- O mês no cabeçalho do telefone (`useMonthInHeader` / `MonthNavPanel`) não muda de forma.
- Não é mudança de jornada.

## Review Focus

- Receita no cartão de crédito (estorno antigo gravado em categoria de receita) não conta: fica de fora, como em `fluxo.ts` (teste na Tarefa 1).
- Receita recorrente já lançada no dia não é contada duas vezes como prevista (teste na Tarefa 1).
- Receita com data futura dentro do mês conta como prevista, não recebida (teste na Tarefa 1).
- Mês já passado: só o lançado conta, e nada é previsto por assinatura (teste na Tarefa 1).
- A fatura do cartão (`credit-card-invoice-analytics-panel.tsx`, `mobileTriggerFullWidth`): "Voltar a este mês" no telefone continua no rodapé do popover. Conferir na prévia (Tarefa 2).

---

### Task 1: Receitas do mês por categoria

**Files:**
- Create: `src/lib/categoria-receitas-do-mes.ts`
- Test: `src/lib/categoria-receitas-do-mes.test.ts`

**Interfaces:**
- Consumes: `cobrancasLancadas`, `cobrancasPorLancar`, `centavos` de `@/lib/previsao/fatura-prevista`; `transactionLocalYmd`, `compareYmd` de `@/lib/transaction-date`; `periodBoundsFromYearMonth` de `@/lib/budget-month`.
- Produces:
  ```ts
  export type ReceitaDoMes = { recebido: number; previsto: number }
  export function receitasDoMesPorCategoria(args: {
      yearMonth: string            // "2026-11"
      hojeYmd: string              // "2026-11-18"
      transactions: Pick<Transaction, "type" | "amount" | "date" | "category_id" | "subscription_id" | "payment_method">[]
      subscriptions: WorkspaceSubscription[]
  }): Record<string, ReceitaDoMes>   // em reais, arredondado a centavos
  ```

- [ ] **Step 1: Escrever os testes que falham**, em `src/lib/categoria-receitas-do-mes.test.ts`, com `yearMonth: "2026-11"` e `hojeYmd: "2026-11-18"`:
  - `soma o lançado até hoje como recebido`: receita de 1000 em `2026-11-05`, cat `sal` → `{ sal: { recebido: 1000, previsto: 0 } }`.
  - `receita com data futura no mês é prevista`: 200 em `2026-11-25` → `{ recebido: 0, previsto: 200 }`.
  - `ignora despesa, outro mês, sem categoria e cartão de crédito`: despesa de 50; receita em `2026-10-30`; receita com `category_id: null`; receita com `payment_method: "credit_card"` → `{}`.
  - `assinatura de receita ainda não lançada é prevista`: assinatura `kind: "income"`, `category_id: "sal"`, mensal no dia 28, valor 3000, ativa, próxima cobrança `2026-11-28` → `sal.previsto === 3000`.
  - `assinatura já lançada no dia não conta de novo`: a mesma assinatura e uma receita com `subscription_id` dela em `2026-11-28` (futura, então prevista) → `sal.previsto === 3000`, e não 6000.
  - `ignora assinatura de despesa e inativa`: `kind: "expense"`; `is_active: false` → `{}`.
  - `mês passado: nada previsto por assinatura`: `yearMonth: "2026-10"`, com a mesma assinatura → `previsto === 0`.

  Monte a assinatura no formato de `src/lib/previsao/fluxo.test.ts`, que já cria `WorkspaceSubscription` de teste. Reaproveite o construtor de lá, se houver.

- [ ] **Step 2: Rodar e ver falhar**

  Run: `npx vitest run src/lib/categoria-receitas-do-mes.test.ts`
  Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar `receitasDoMesPorCategoria`** com a regra de `fluxoDoMes` (`src/lib/previsao/fluxo.ts:40-64`), separando por `category_id`:
  - as receitas fora do cartão com data no mês: até `hojeYmd` contam como `recebido`, depois disso como `previsto`;
  - as assinaturas `kind === "income"` ativas, fora do cartão, entram como `previsto` por `cobrancasPorLancar(sub, inicio, fim, cobrancasLancadas(transactions))`, só quando `hojeYmd <= fim`;
  - a soma é feita em centavos (`centavos`) e devolvida em reais.

  Se `cobrancasLancadas` exigir `Transaction[]`, alargue o tipo do parâmetro dela para `Pick<Transaction, "subscription_id" | "date">[]` e não use cast.

- [ ] **Step 4: Rodar e ver passar**

  Run: `npx vitest run src/lib/categoria-receitas-do-mes.test.ts src/lib/previsao`
  Expected: PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add src/lib/categoria-receitas-do-mes.ts src/lib/categoria-receitas-do-mes.test.ts src/lib/previsao/fatura-prevista.ts
  git commit -m "feat(categorias): receitas do mês por categoria, recebido e previsto, pela regra de Previsão"
  ```

### Task 2: O seletor de mês compacto

**Files:**
- Modify: `src/components/categories/categories-toolbar.tsx`: `MonthNavArrowControls` (linhas ~49-215) e as constantes de tamanho no topo
- Test: `src/components/categories/month-nav.test.ts` (novo, teste de fonte)

**Interfaces:**
- Consumes: `ButtonGroup` de `@/components/ui/button-group`.
- Produces: a mesma API pública de `MonthNav` e `CategoriesToolbar`, sem nenhuma prop nova.

- [ ] **Step 1: Escrever o teste de fonte que falha** (`lerFonte` + `semComentarios(…, "tudo")` sobre `categories-toolbar.tsx`):
  - `a cápsula é um ButtonGroup com ‹, o mês e ›`: a fonte importa `ButtonGroup` de `@/components/ui/button-group`, e o trecho entre `<ButtonGroup` e `</ButtonGroup>` contém `aria-label="Mês anterior"`, `PopoverTrigger` e `aria-label="Próximo mês"`, nessa ordem.
  - `"Voltar a este mês" só fora do mês atual`: a fonte contém `Voltar a este mês`, e não contém mais `>Este mês<` como rótulo de botão solto. O botão é condicionado por `formatYearMonth(new Date())`.
  - `o botão volta como terciário`: o botão de "Voltar a este mês" tem `variant="tertiary"`.

- [ ] **Step 2: Rodar e ver falhar**

  Run: `npx vitest run src/components/categories/month-nav.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Implementar**
  - Em `MonthNavArrowControls`: o "Voltar a este mês" (`tertiary`, `text-muted-foreground`) só quando `budgetMonthYm !== formatYearMonth(new Date())`, à esquerda.
  - Em seguida, um `ButtonGroup` com o botão ‹, o `Popover` cujo gatilho é o `Button outline` do mês (ícone de calendário + rótulo), e o botão ›. Os três são `variant="outline"` (a emenda é do grupo).
  - As constantes `monthNav*ClassName` que só dimensionavam peças soltas saem, se ficarem sem uso.
  - O ramo `esteMesInsidePopoverOnNarrow` mantém o atalho no rodapé do popover no telefone, com o rótulo "Voltar a este mês".

- [ ] **Step 4: Rodar e ver passar**

  Run: `npx vitest run src/components/categories && npx tsc --noEmit`
  Expected: PASS.

- [ ] **Step 5: Ver na prévia (1280 e 375)**
  - **Categorias, Painel, detalhe de uma categoria e a fatura de um cartão:** a cápsula sem "Voltar a este mês" no mês atual.
  - **Avançar um mês:** o "Voltar a este mês" aparece e, ao clicar, volta.
  - **No telefone:** o cabeçalho segue igual.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/categories/categories-toolbar.tsx src/components/categories/month-nav.test.ts
  git commit -m "feat(mes): o seletor de mês vira a cápsula ‹ mês ›, com Voltar a este mês só fora do mês atual"
  ```

### Task 3: Receitas com mês e valor na tela

**Files:**
- Modify: `src/app/(app)/categories/page-client.tsx`:
  - `useMonthInHeader` (~168);
  - `fetchBudgetsAndSpend` (~224-340);
  - `showMonthControls` (~700);
  - o mapa de `IncomeCategoryCard` (~742).
- Modify: `src/components/categories/income-category-card.tsx`
- Modify: `src/components/categories/categories-page-grid-skeleton.tsx` (`IncomeCategoryCardSkeleton`, ~135)
- Test: `src/components/categories/income-category-card.test.ts` (novo, no estilo de `expense-category-card.test.ts`) e `src/app/(app)/categories/page-client.test.ts`

**Interfaces:**
- Consumes: `receitasDoMesPorCategoria`, `ReceitaDoMes` (Tarefa 1).
- Produces: `IncomeCategoryCard` ganha a prop `month?: ReceitaDoMes`. Sem ela, o cartão fica como hoje: só o nome.

- [ ] **Step 1: Escrever os testes que falham**
  - `income-category-card.test.ts`: renderiza o cartão com `month={{ recebido: 1000, previsto: 200 }}` e espera o texto `R$ 1.200,00`, `Recebido`, `R$ 1.000,00` e `R$ 200,00 previstos`. Com `{ recebido: 500, previsto: 0 }`, espera `R$ 500,00` e `Sem previsões no mês`.
    - Se `expense-category-card.test.ts` for teste de fonte e não de render, siga o mesmo estilo e confira as strings na fonte.
  - Em `page-client.test.ts`:
    - `o mês vale nas duas abas`: a fonte não contém mais `enabled: filterType === "expense"` nem `showMonthControls={filterType === "expense"}`;
    - `a receita recebe o mês`: a fonte contém `receitasDoMesPorCategoria(` e `month={`.

- [ ] **Step 2: Rodar e ver falhar**

  Run: `npx vitest run src/components/categories/income-category-card.test.ts "src/app/(app)/categories/page-client.test.ts"`
  Expected: FAIL.

- [ ] **Step 3: Implementar**
  - **Página:**
    - o estado `incomeByCategoryId: Record<string, ReceitaDoMes>` é preenchido em `fetchBudgetsAndSpend` com `receitasDoMesPorCategoria({ yearMonth: budgetMonthYm, hojeYmd: localYmdFromDate(new Date()), transactions: monthTx, subscriptions: subs })`, e zerado no ramo de erro;
    - `useMonthInHeader` sem o `enabled`, e `showMonthControls` sempre `true`;
    - `month={incomeByCategoryId[category.id] ?? { recebido: 0, previsto: 0 }}` no `IncomeCategoryCard`.
  - **Cartão:**
    - abaixo do cabeçalho, o valor grande (`recebido + previsto`), com a mesma classe e o mesmo "Ver categoria ›" do `ExpenseCategoryCard` (`expense-category-card.tsx:255-268`);
    - a linha `Recebido R$ X · + R$ Y previstos` ou `Sem previsões no mês`, com as mesmas classes da despesa (`:270-286`);
    - sem barra.
  - **Esqueleto:** `IncomeCategoryCardSkeleton` ganha o osso do valor e o da linha, como o de despesa.

- [ ] **Step 4: Rodar e ver passar e conferir o resto**

  Run: `npx tsc --noEmit && npm run lint && npm run test:unit && npm run ds:audit -- src/components/categories "src/app/(app)/categories/page-client.tsx"`
  Expected: sem erro novo.

- [ ] **Step 5: Ver na prévia** em `/categories`:
  - **Receitas a 1280:** a barra com o mesmo seletor, e cartões com valor e linha. Trocar de aba não muda a forma da barra.
  - **Receitas a 375:** o calendário do cabeçalho troca o mês das receitas.

- [ ] **Step 6: Commit**

  ```bash
  git add "src/app/(app)/categories/page-client.tsx" "src/app/(app)/categories/page-client.test.ts" src/components/categories/income-category-card.tsx src/components/categories/income-category-card.test.ts src/components/categories/categories-page-grid-skeleton.tsx docs/superpowers/specs/2026-11-18-barra-categorias-design.md docs/superpowers/plans/2026-11-18-barra-categorias.md
  git commit -m "feat(categorias): Receitas com o mês na barra e recebido + previsto em cada cartão"
  ```
