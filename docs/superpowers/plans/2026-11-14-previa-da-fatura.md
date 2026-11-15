# A prévia da fatura fechada e anterior — plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a prévia (`HoverCard`) do chip "Fechada"/"Anterior" vira a F3: cabeçalho sem selo repetido, uma linha de status com ponto, Fechou/Venceu com o relativo, e "Ver fatura de <mês>" abrindo a página do cartão naquele ciclo.

**Architecture:** as contas puras moram em `src/lib/credit-card-invoice-preview.ts` (testadas); a página do cartão lê `?fatura=YYYY-MM-DD` e converte em `cycleOffset`; o `CreditInvoiceChip` de `transactions-table.tsx` é redesenhado. A jornada muda: `JORNADAS.md` e o Atlas na mesma série.

**Tech Stack:** Next 16 (App Router, `useSearchParams`), React 19, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-14-previa-da-fatura-design.md`

## Global Constraints

- Só componentes de `src/components/ui/` e tokens existentes; nada novo em `ui/` nem em `globals.css`.
- Textos exatos: "Paga", "Fechada, não paga", "Vencida, não paga", "Anterior, não paga", "Fechou", "Vence", "Venceu", "Ver fatura de <mês>" (mês por extenso, minúsculo, o mês do fechamento — o mesmo que a página do cartão usa, `formatYearMonth(snapshot.nextClose)`).
- O relativo das datas vem de `formatRelativeDayPtBr` (`src/lib/transaction-date.ts`: "hoje", "amanhã", "há 4 dias", "em 3 dias").
- A "Aberta" (`slot === "open"`) continua com a prévia de hoje, menos o selo repetido do cabeçalho.
- URL: `/credit-cards/<id>?fatura=YYYY-MM-DD` (data de fechamento). Inválida ou fora de `cycleOffsetBoundsForCard`: o ciclo de hoje. Trocar de ciclo na página não reescreve a URL.
- Nenhuma gravação no banco (o dev usa o banco de produção).
- `npm run ds:audit` limpo nos arquivos tocados; `npx tsc --noEmit`, `npm run lint`, vitest dos arquivos tocados.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; `git add` só dos próprios arquivos (nunca `graphify-out/graph.json`); sem push; sem prettier. Depois: `graphify update .`.

## Review Focus

- Fechamento no fim do mês com `closing_day` 31 em fevereiro: o offset encontrado bate com o `nextClose` do `buildCardCycleSnapshot`.
- `?fatura=` com lixo (`abc`, `2026-13-40`) ou antes da compra mais antiga: abre no ciclo de hoje, sem erro.
- Trocar de cartão na mesma aba (o `cardId` muda) com `?fatura=` na URL: não herda o offset do cartão anterior errado.
- Fatura paga e vencida: status "Paga", relativo do vencimento neutro.
- Vencimento hoje sem pagamento: "Vence hoje" em `warning`, não `destructive`.

---

### Task 1: as contas puras

**Files:**
- Create: `src/lib/credit-card-invoice-preview.ts`
- Create: `src/lib/credit-card-invoice-preview.test.ts`
- Modify: `src/config/navigation.ts` (junto de `creditCardDetailPath`)

**Interfaces — Produces:**
- `creditCardInvoicePath(id: string, closeYmd: string): string` em `navigation.ts` → `` `${creditCardDetailPath(id)}?fatura=${closeYmd}` ``.
- `cycleOffsetForCloseYmd(card: { closing_day: number }, today: Date, closeYmd: string, bounds: { min: number; max: number }): number | null` — o `k` em `[bounds.min, bounds.max]` cujo fechamento é `closeYmd`; `null` se nenhum ou se `closeYmd` não é uma data válida. O fechamento do offset `k` é `localYmdFromDate(firstCloseOnOrAfter(shiftRefDateByCycles(card, today, k), card.closing_day))`; o teste confere essa igualdade contra `buildCardCycleSnapshot(...).nextClose` para k = -2, 0 e 1.
- `estadoDaFatura(args: { slot: "last_closed" | "earlier"; paid: boolean; dueYmd: string | null; today: Date }): string` — "Paga" se `paid`; senão "Vencida, não paga" se `dueYmd` < hoje; senão "Fechada, não paga" (`last_closed`) ou "Anterior, não paga" (`earlier`).
- `tomDoVencimento(args: { paid: boolean; dueYmd: string; today: Date }): "neutral" | "warning" | "destructive"` — `paid` → neutral; dias até o vencimento < 0 → destructive; 0 a 3 → warning; senão neutral.
- `verboDoVencimento(dueYmd: string, today: Date): "Vence" | "Venceu"` — "Venceu" só com `dueYmd` < hoje.

- [ ] **Step 1: testes** (`credit-card-invoice-preview.test.ts`), com `today = new Date(2026, 10, 14, 12)`:
  - `creditCardInvoicePath("abc", "2026-10-26")` → `"/credit-cards/abc?fatura=2026-10-26"`.
  - `cycleOffsetForCloseYmd({ closing_day: 26 }, today, "2026-10-26", { min: -12, max: 2 })` → `-1`; `"2026-11-26"` → `0`; `"2026-09-26"` → `-2`; `"2026-10-25"` → `null`; `"abc"` → `null`; `"2025-01-26"` com `min: -3` → `null`.
  - `closing_day: 31`: o fechamento de fevereiro de 2026 encontrado pelo offset é o mesmo `nextClose` do `buildCardCycleSnapshot` naquele offset.
  - `estadoDaFatura({ slot: "last_closed", paid: false, dueYmd: "2026-11-10", today })` → `"Vencida, não paga"`; com `dueYmd: "2026-11-20"` → `"Fechada, não paga"`; `slot: "earlier"`, `dueYmd: "2026-11-20"` → `"Anterior, não paga"`; `paid: true` → `"Paga"`.
  - `tomDoVencimento`: `"2026-11-10"` não paga → destructive; `"2026-11-14"` → warning; `"2026-11-17"` → warning; `"2026-11-18"` → neutral; `"2026-11-10"` paga → neutral.
  - `verboDoVencimento("2026-11-14", today)` → `"Vence"`; `"2026-11-13"` → `"Venceu"`.
- [ ] **Step 2:** `npx vitest run src/lib/credit-card-invoice-preview.test.ts` → FAIL.
- [ ] **Step 3:** implementar (dias por data local ao meio-dia, como o resto de `credit-card-billing.ts`; `parseYmdLocal` para a entrada).
- [ ] **Step 4:** PASS; `tsc`, `lint`.
- [ ] **Step 5: Commit** `feat(fatura): as contas da prévia e o caminho para uma fatura`.

### Task 2: a página do cartão abre em `?fatura=`

**Files:**
- Modify: `src/app/(app)/credit-cards/[cardId]/page-client.tsx` (o `cycleOffset`, linhas ~143 e ~459-483)
- Test: `src/app/(app)/credit-cards/[cardId]/fatura-param.test.ts` (leitura de fonte, com `lerFonte`/`semComentarios` de `src/test/fonte.ts`)

**Interfaces — Consumes:** `cycleOffsetForCloseYmd` (Task 1).

- [ ] **Step 1: teste:** a fonte usa `useSearchParams`, lê `"fatura"` e chama `cycleOffsetForCloseYmd`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** ler `fatura` por `useSearchParams()`; quando `card` e os `cycleOffsetBounds` estão prontos, aplicar **uma vez por `cardId`** o offset de `cycleOffsetForCloseYmd(card, todayAnchor, fatura, bounds)` (se não `null`). Dados que chegam depois (os limites mudam) não reaplicam nem desfazem a escolha da pessoa. O reset para 0 ao trocar `cardId` continua. Conferir que a rota já está sob o `AdiarMontagem` do `page.tsx` (o `useSearchParams` não pede outro `Suspense`).
- [ ] **Step 4:** testes, `tsc`, `lint`.
- [ ] **Step 5: Commit** `feat(cartoes): ?fatura= abre a página do cartão naquele ciclo`.

### Task 3: a prévia F3

**Files:**
- Modify: `src/components/transactions/transactions-table.tsx` (`InvoiceBadge`, `creditCardInvoiceBadgeForRow`, `CreditInvoiceChip`, linhas ~81-246)
- Test: `src/components/ui/hover-card-versions.test.ts` (as asserções do `CreditInvoiceChip`, linhas ~66-75, continuam valendo; somar as novas)

**Interfaces — Consumes:** `creditCardInvoicePath`, `estadoDaFatura`, `tomDoVencimento`, `verboDoVencimento` (Task 1).
**Produces:** `InvoiceBadge` troca `note: string | null` por `paid: boolean` (ninguém fora do chip lê `note`; `bloco-fatura.tsx` e `transacoes-tabela.tsx` leem `tone`/`label`/`chipClass`, que não mudam).

- [ ] **Step 1: teste** em `hover-card-versions.test.ts`: o trecho de `function CreditInvoiceChip` usa `estadoDaFatura`, `formatRelativeDayPtBr`, `creditCardInvoicePath` e contém `"Ver fatura de "`; não contém `<Badge` nem `badge.note`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** redesenhar conforme a spec:
  - Cabeçalho: `HoverCardTitle` com o nome do cartão, `HoverCardDescription` "Fatura de <mês>" (fechamento); sem `endAdornment`.
  - Corpo (slots fechados): a linha de status — ponto na cor do `tone` (o `BadgeDot` do `Badge`, ou o ponto que o catálogo indicar; sem cor crua) + `estadoDaFatura(...)`; o `DescriptionList` com **Fechou** `formatYmdPtBr(closeYmd)` · `formatRelativeDayPtBr(closeYmd)` e `verboDoVencimento` `formatYmdPtBr(dueYmd)` · relativo, o relativo do vencimento pintado por `tomDoVencimento` (`text-warning` / `text-destructive`, ou o equivalente de token).
  - Slot `open`: corpo de hoje (Fecha/Vence), sem `note`.
  - Rodapé: `HoverCardLink asChild` + `Link` para `creditCardInvoicePath(cardId, closeYmd)` com "Ver fatura de <mês>"; sem `closeYmd`, `creditCardDetailPath(cardId)` e "Ver cartão" continua só nesse caso. Apagar o comentário que explica o "Ver cartão".
  - `stopRowEvent` no conteúdo continua.
- [ ] **Step 4:** testes (`hover-card-versions`, `blocos.test.ts`), `tsc`, `lint`, `ds:audit` do arquivo → limpos.
- [ ] **Step 5: Commit** `feat(transacoes): a prévia da fatura diz o estado, quando e leva à fatura`.

### Task 4: a jornada

**Files:**
- Modify: `docs/JORNADAS.md` (seção 6 e a ponte da lista de transações para o detalhe do cartão)
- Modify: `docs/atlas/template.html` (jornada 06, apêndice de rotas `/credit-cards/[cardId]`, data da capa)
- Generate: `docs/atlas/atlas-jornadas.html` (`python3 docs/atlas/build.py`)

- [ ] **Step 1:** no fluxograma da seção 6, a entrada `"?fatura=YYYY-MM-DD"` no `detail` (vinda do chip da fatura em Transações) e o seletor de ciclo começando nela; na tabela de regras, a linha do parâmetro (inválido ou fora do intervalo → ciclo de hoje). `%%{init}%%` no bloco, nenhum id reservado.
- [ ] **Step 2:** o mesmo no `template.html`; data da capa 14/11/2026.
- [ ] **Step 3:** `python3 docs/atlas/build.py` sem erro.
- [ ] **Step 4: Commit** `docs(jornadas): ?fatura= no detalhe do cartão`. (A republicação do Atlas é do controlador.)
