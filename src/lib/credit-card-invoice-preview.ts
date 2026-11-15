import {
    nextCloseAfter,
    shiftRefDateByCycles,
    statementCloseOnOrBefore,
} from "@/lib/credit-card-billing"
import { localYmdFromDate, parseYmdLocal } from "@/lib/transaction-date"

/** O `k` em `[min, max]` cujo fechamento é `closeYmd`; `null` se nenhum ou data inválida. */
export function cycleOffsetForCloseYmd(
    card: { closing_day: number },
    today: Date,
    closeYmd: string,
    bounds: { min: number; max: number }
): number | null {
    if (!parseYmdLocal(closeYmd)) return null
    for (let k = bounds.min; k <= bounds.max; k++) {
        // Mesma conta do `nextClose` do buildCardCycleSnapshot (firstCloseOnOrAfter erra em k < 0).
        const close = nextCloseAfter(
            statementCloseOnOrBefore(
                shiftRefDateByCycles(card, today, k),
                card.closing_day
            ),
            card.closing_day
        )
        if (localYmdFromDate(close) === closeYmd) return k
    }
    return null
}

/** Dias de hoje até `ymd` (negativo = já passou), por data local ao meio-dia. */
function daysUntil(ymd: string, today: Date): number {
    const d = parseYmdLocal(ymd)!
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return Math.round((d.getTime() - t.getTime()) / 86_400_000)
}

export function estadoDaFatura(args: {
    slot: "last_closed" | "earlier"
    paid: boolean
    dueYmd: string | null
    today: Date
}): string {
    if (args.paid) return "Paga"
    if (args.dueYmd && daysUntil(args.dueYmd, args.today) < 0) {
        return "Vencida, não paga"
    }
    return args.slot === "last_closed" ? "Fechada, não paga" : "Anterior, não paga"
}

export function tomDoVencimento(args: {
    paid: boolean
    dueYmd: string
    today: Date
}): "neutral" | "warning" | "destructive" {
    if (args.paid) return "neutral"
    const dias = daysUntil(args.dueYmd, args.today)
    if (dias < 0) return "destructive"
    return dias <= 3 ? "warning" : "neutral"
}

export function verboDoVencimento(dueYmd: string, today: Date): "Vence" | "Venceu" {
    return daysUntil(dueYmd, today) < 0 ? "Venceu" : "Vence"
}
