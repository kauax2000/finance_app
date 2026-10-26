/**
 * O gasto da categoria no mês do orçamento, pela regra da tela de Categorias
 * (`postedTotal` de `buildCategoryCommitmentsForMonth`, via `expenseYearMonthKey`):
 * a despesa fora do cartão conta pelo dia; a do cartão, pelo mês do fechamento da
 * fatura da compra. O cartão sem `closing_day` conhecido volta ao dia. O estorno
 * no cartão da categoria abate pelo mesmo mês do fechamento, como a compra no
 * mesmo dia; a outra receita não entra.
 * Travado pelos vetores de `src/lib/fixtures/orcamento-mes-vectors.json`.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- `@ts-expect-error` quebraria o `deno check`, onde a linha não tem erro.
// @ts-ignore TS5097: o Deno exige a extensão; o tsc do app chega aqui pelo teste de paridade.
import { type CardTxRow, formatYmd, isoPrefixYmd, sinalNaDespesa, statementCloseYmdForPurchaseYmd } from './credit-card-cycle.ts'

export function gastoDaCategoriaNoMes(
  rows: CardTxRow[],
  categoryId: string,
  ym: string,
  closingDayByCard: Record<string, number>
): number {
  let cents = 0
  for (const t of rows) {
    const sinal = sinalNaDespesa(t)
    if (!sinal || t.category_id !== categoryId) continue
    const day = isoPrefixYmd(t.date)
    if (!day) continue
    const closingDay =
      t.payment_method === 'credit_card' && t.payment_credit_card_id
        ? closingDayByCard[t.payment_credit_card_id]
        : undefined
    const attributed = closingDay == null ? day : statementCloseYmdForPurchaseYmd(day, closingDay)
    if (formatYmd(attributed).slice(0, 7) !== ym) continue
    cents += sinal * Math.round(Number(t.amount || 0) * 100)
  }
  return cents / 100
}

export type PagamentoDaCompra = { payment_method: string | null; payment_credit_card_id: string | null }

/**
 * Os dias que decidem o mês do orçamento da compra (o orçamento que contém o dia).
 * Com o pagamento no corpo há um dia só: o fechamento da compra no cartão dela, ou
 * o próprio dia fora do cartão (e no cartão que a carteira não tem). Sem ele, o
 * dia da compra e o fechamento dela em cada cartão da carteira.
 */
export function diasCandidatos(
  dia: string,
  closingDayByCard: Record<string, number>,
  pagamento?: PagamentoDaCompra
): string[] {
  const compra = isoPrefixYmd(dia)
  if (!compra) return [dia]
  const fechamento = (cd: number) => formatYmd(statementCloseYmdForPurchaseYmd(compra, cd))
  if (pagamento) {
    const cd =
      pagamento.payment_method === 'credit_card' && pagamento.payment_credit_card_id
        ? closingDayByCard[pagamento.payment_credit_card_id]
        : undefined
    return [cd == null ? dia : fechamento(cd)]
  }
  // ponytail: o front antigo de `main` não manda o cartão, então vale todo cartão
  // da carteira (um Pix pode avaliar o mês seguinte). Sai quando o 2.0 for a `main`.
  return [...new Set([dia, ...Object.values(closingDayByCard).map(fechamento)])].sort()
}
