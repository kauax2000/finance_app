/**
 * O gasto do mês pela data da compra (o "ritmo"): diferente de `fluxoDoMes`, que é caixa, a compra
 * no cartão conta no dia em que foi feita, e o estorno no cartão a abate. A soma é em centavos.
 */
import { compareYmd, transactionLocalYmd } from "@/lib/transaction-date"
import { centavos } from "./fatura-prevista"
import type { DadosDaPrevisao, Seguro } from "./tipos"

/** Um ponto por dia, do dia 1 até hoje (o mês de hoje) ou até o último dia (mês passado); mês futuro, nenhum. */
export function gastoAcumuladoDoMes(dados: DadosDaPrevisao, ym: string): Array<{ dia: number; acumulado: number }> {
    const mesDeHoje = dados.hojeYmd.slice(0, 7)
    if (compareYmd(ym, mesDeHoje) > 0) return []
    const [y, m] = ym.split("-").map(Number)
    const ultimo = ym === mesDeHoje ? Number(dados.hojeYmd.slice(8, 10)) : new Date(y, m, 0).getDate()

    const porDia = new Array<number>(ultimo + 1).fill(0)
    for (const t of dados.transacoes) {
        const estorno = t.type === "income" && t.payment_method === "credit_card"
        if (t.type !== "expense" && !estorno) continue
        const ymd = transactionLocalYmd(t.date)
        if (!ymd || ymd.slice(0, 7) !== ym) continue
        const dia = Number(ymd.slice(8, 10))
        if (dia > ultimo) continue
        porDia[dia] += estorno ? -centavos(t.amount) : centavos(t.amount)
    }

    let acumulado = 0
    return Array.from({ length: ultimo }, (_, i) => {
        acumulado += porDia[i + 1]
        return { dia: i + 1, acumulado: acumulado / 100 }
    })
}

/** A meta do ritmo: o que entra no mês menos a reserva. Pode ser zero ou negativa. */
export function metaDoRitmo(seguro: Seguro): number {
    return (centavos(seguro.entra) - centavos(seguro.reserva)) / 100
}
