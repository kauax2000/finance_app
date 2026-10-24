/**
 * O gasto da categoria no mês do orçamento, pela regra da tela de Categorias
 * (`postedTotal` de `buildCategoryCommitmentsForMonth`, via `expenseYearMonthKey`):
 * a despesa fora do cartão conta pelo dia; a do cartão, pelo mês do fechamento da
 * fatura da compra. O cartão sem `closing_day` conhecido volta ao dia. A receita
 * (o estorno no cartão inclusive) não entra: a tela também não a abate.
 * Travado pelos vetores de `src/lib/fixtures/orcamento-mes-vectors.json`.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- `@ts-expect-error` quebraria o `deno check`, onde a linha não tem erro.
// @ts-ignore TS5097: o Deno exige a extensão; o tsc do app chega aqui pelo teste de paridade.
import { type CardTxRow, formatYmd, isoPrefixYmd, statementCloseYmdForPurchaseYmd } from './credit-card-cycle.ts'

export function gastoDaCategoriaNoMes(
  rows: CardTxRow[],
  categoryId: string,
  ym: string,
  closingDayByCard: Record<string, number>
): number {
  let cents = 0
  for (const t of rows) {
    if (t.type !== 'expense' || t.category_id !== categoryId) continue
    const day = isoPrefixYmd(t.date)
    if (!day) continue
    const closingDay =
      t.payment_method === 'credit_card' && t.payment_credit_card_id
        ? closingDayByCard[t.payment_credit_card_id]
        : undefined
    const attributed = closingDay == null ? day : statementCloseYmdForPurchaseYmd(day, closingDay)
    if (formatYmd(attributed).slice(0, 7) !== ym) continue
    cents += Math.round(Number(t.amount || 0) * 100)
  }
  return cents / 100
}
