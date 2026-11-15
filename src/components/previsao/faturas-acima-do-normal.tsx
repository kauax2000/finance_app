"use client"

import Link from "next/link"

import { Alert, AlertAction, AlertActions, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { creditCardInvoicePath } from "@/config/navigation"
import { currencyBRL } from "@/lib/formatters"
import type { faturasAcimaDoNormal } from "@/lib/previsao/fatura-alta"
import { formatTransactionDayMonthPtBr } from "@/lib/transaction-date"

/** Um aviso por cartão cuja fatura aberta passa de 120% da média das 3 últimas fechadas (o que o sino avisa). */
export function FaturasAcimaDoNormal({ faturas }: { faturas: ReturnType<typeof faturasAcimaDoNormal> }) {
    if (faturas.length === 0) return null
    return (
        <div className="grid gap-3">
            {faturas.map((f) => (
                <Alert key={f.cardId} tone="warning">
                    <AlertTitle>
                        Fatura do {f.nome} {f.percentual}% acima do normal
                    </AlertTitle>
                    <AlertDescription>
                        {currencyBRL(f.prevista)} prevista, vence {formatTransactionDayMonthPtBr(f.dueYmd)}; a média das 3
                        últimas é {currencyBRL(f.media)}
                    </AlertDescription>
                    <AlertActions placement="inline">
                        <AlertAction asChild>
                            <Link href={creditCardInvoicePath(f.cardId, f.closeYmd)}>Ver fatura</Link>
                        </AlertAction>
                    </AlertActions>
                </Alert>
            ))}
        </div>
    )
}
