import { parseYearMonth } from "@/lib/budget-month"
import type { Comparacao, TipoDaCategoria } from "@/lib/categoria-detalhe"
import { currencyBRL, percentBR } from "@/lib/formatters"
import { formatMonthLongPtBr } from "@/lib/transaction-date"

/** "outubro": o mês por extenso, minúsculo. */
export const nomeDoMes = (ym: string) => {
    const { y, m } = parseYearMonth(ym)
    return formatMonthLongPtBr(new Date(y, m - 1, 1))
}

/** Reais sem centavos: a referência da frase ("R$ 3.734"), não o valor da manchete. */
export const reaisInteiros = (v: number) => currencyBRL(v, { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const porcento = (v: number) => percentBR(v, { maximumFractionDigits: 0 })

/** A escala da régua sem limite: cabe o mês, a média e o anterior, com 15% de folga. */
export function escalaDaRegua({ lancado, media, anterior }: { lancado: number; media: number | null; anterior: number }) {
    const max = Math.max(lancado, media ?? 0, anterior, 0) * 1.15 || 1
    const marcador = media != null && media > 0 ? (media / max) * 100 : null
    return { max: Math.max(max, 1), marcador }
}

/** "5% acima da sua média" / "8% abaixo…" / "na sua média" (|Δ| < 2%); sem média, nada. */
export function vereditoDaMedia(lancado: number, media: number | null): string | null {
    if (media == null || media <= 0) return null
    const delta = (lancado - media) / media
    if (Math.abs(delta) < 0.02) return "na sua média"
    return `${porcento(Math.abs(delta))} ${delta > 0 ? "acima" : "abaixo"} da sua média`
}

/** "↓ 18%" + "que no mesmo dia de outubro (R$ 3.734)"; `bom` é gastar menos ou receber mais. */
export function fraseDaComparacao({ tipo, comparacao }: { tipo: TipoDaCategoria; comparacao: Comparacao }) {
    const { variacao, mesmoPonto, mesAnterior, anterior } = comparacao
    if (variacao === null) return null
    const mes = nomeDoMes(mesAnterior)
    return {
        seta: variacao < 0 ? ("↓" as const) : ("↑" as const),
        percentual: porcento(Math.abs(variacao)),
        bom: tipo === "expense" ? variacao <= 0 : variacao >= 0,
        resto: `${mesmoPonto ? `que no mesmo dia de ${mes}` : `que em ${mes}`} (${reaisInteiros(anterior)})`,
    }
}
