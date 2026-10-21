import { roundCents } from "@/lib/money-brl"
import type { CreditCardStatementTotal } from "@/lib/supabase"

/**
 * Numa fatura fechada, o total que o banco cobrou vale sobre o que o app
 * calculou. A diferença (banco − calculado) diz quanto falta lançar, ou sobra.
 */
export function totalComBanco(
    calculado: number,
    bancoTotal: number | null,
): { total: number; diferenca: number | null } {
    if (bancoTotal == null) return { total: calculado, diferenca: null }
    return { total: bancoTotal, diferenca: roundCents(bancoTotal - calculado) }
}

/** A mesma forma da chave de pagamento de fatura do painel: `cartão:fechamento`. */
export function statementTotalKey(cardId: string, closeYmd: string): string {
    return `${cardId}:${closeYmd}`
}

/** O total do banco do cartão naquele fechamento (YYYY-MM-DD), ou `null`. */
export function bancoTotalDoCiclo(
    totais: CreditCardStatementTotal[] | undefined,
    cardId: string,
    closeYmd: string,
): number | null {
    const achado = totais?.find(
        (t) => statementTotalKey(t.credit_card_id, t.statement_close_date) === statementTotalKey(cardId, closeYmd),
    )
    return achado ? Number(achado.bank_total) : null
}
