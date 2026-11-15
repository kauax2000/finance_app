/**
 * A fatura acima do normal no cliente, a mesma regra do aviso `cc_invoice_trending_high` do cron
 * (`supabase/functions/credit-card-calendar-alerts/index.ts`): a fatura aberta, com as parcelas que
 * ainda caem nela, contra as 3 últimas fechadas. `avaliarTendencia` é o par de
 * `supabase/functions/_shared/fatura-tendencia.ts`, travado pelos vetores `tendencia` de
 * `src/lib/fixtures/fatura-tendencia-vectors.json`.
 */
import {
    buildCardMonthlyInvoiceSnapshot,
    nextCloseAfter,
    previousStatementCloseBefore,
    statementCloseOnOrBefore,
} from "@/lib/credit-card-billing"
import { bancoTotalDoCiclo } from "@/lib/fatura/total-com-banco"
import { localYmdFromDate } from "@/lib/transaction-date"
import { faturaPrevista, hojeDate } from "./fatura-prevista"
import type { DadosDaPrevisao } from "./tipos"

/**
 * Dispara só com 3 fechadas e a aberta acima de 120% da média delas (120% exatos não). A conta é em
 * centavos inteiros; `percentual` é o quanto a aberta passa da média, arredondado.
 */
export function avaliarTendencia(
    abertaPrevista: number,
    ultimasFechadas: number[],
): { dispara: boolean; media: number; acima: number; percentual: number } {
    const n = ultimasFechadas.length
    const abertaC = Math.round(abertaPrevista * 100)
    const somaC = ultimasFechadas.reduce((s, v) => s + Math.round(v * 100), 0)
    const mediaC = n > 0 ? Math.round(somaC / n) : 0
    const percentual = somaC > 0 ? Math.round(((abertaC * n - somaC) * 100) / somaC) : 0
    return {
        // aberta > 1,2 × soma/n  ⇔  aberta × n × 5 > soma × 6
        dispara: n >= 3 && somaC > 0 && abertaC * n * 5 > somaC * 6,
        media: mediaC / 100,
        acima: (abertaC - mediaC) / 100,
        percentual,
    }
}

export function faturasAcimaDoNormal(dados: DadosDaPrevisao): Array<{
    cardId: string
    nome: string
    closeYmd: string
    dueYmd: string
    prevista: number
    media: number
    percentual: number
}> {
    const hoje = hojeDate(dados.hojeYmd)
    const out: ReturnType<typeof faturasAcimaDoNormal> = []
    for (const card of dados.cartoes) {
        if (!card.is_active) continue
        const dia = Number(card.closing_day)
        if (!dia || dia < 1 || dia > 31) continue
        // Como o cron: fechou hoje já é fechada, e a aberta é a do próximo fechamento.
        const ultima = statementCloseOnOrBefore(hoje, dia)
        const aberta = faturaPrevista(card, localYmdFromDate(nextCloseAfter(ultima, dia)).slice(0, 7), dados)

        const fechadas: number[] = []
        for (let close = ultima, i = 0; i < 3; i++, close = previousStatementCloseBefore(close, dia)) {
            const closeYmd = localYmdFromDate(close)
            const banco = bancoTotalDoCiclo(dados.totaisDoBanco, card.id, closeYmd)
            fechadas.push(
                banco ??
                    buildCardMonthlyInvoiceSnapshot(card, dados.transacoes, closeYmd.slice(0, 7), hoje).postedTotal,
            )
        }
        // A fatura sem movimento (o cartão novo) e a negativa (só estorno) não contam: baixariam a média.
        const t = avaliarTendencia(
            aberta.total,
            fechadas.filter((v) => v > 0),
        )
        if (!t.dispara) continue
        out.push({
            cardId: card.id,
            nome: card.name,
            closeYmd: aberta.closeYmd,
            dueYmd: aberta.dueYmd,
            prevista: aberta.total,
            media: t.media,
            percentual: t.percentual,
        })
    }
    return out
}
