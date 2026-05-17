import type { TransactionInstallmentPlanRef } from "@/lib/supabase"

export type InstallmentPlanSliceInput = {
    id: string
    amount: number
    date: string
    installment_sequence: number | null
    created_at: string
}

export type InstallmentScheduleRow = {
    slot: number
    transactionId: string | null
    date: string | null
    /** Valor previsto desta parcela (contrato do plano). */
    parcelAmount: number
    status: "posted" | "pending"
    /**
     * Quando existir fatura do cartão marcada como paga para esta cobrança,
     * exibir "Paga"; caso contrário parcela já no extrato permanece "Lançada".
     * Hoje sempre false até integrar com a funcionalidade de faturas.
     */
    invoicePaid: boolean
}

function expectedAmountForSlot(
    plan: Pick<
        TransactionInstallmentPlanRef,
        | "total_installments"
        | "installment_amount"
        | "final_installment_amount"
    >,
    k: number
): number {
    const n = plan.total_installments
    if (n < 2) {
        return Number(plan.final_installment_amount)
    }
    return k < n
        ? Number(plan.installment_amount)
        : Number(plan.final_installment_amount)
}

function firstEmptySlot(
    occupied: (InstallmentPlanSliceInput | null)[],
    n: number
): number | null {
    for (let k = 1; k <= n; k++) {
        if (occupied[k] == null) return k
    }
    return null
}

/**
 * Builds one row per installment slot 1..N: maps posted transactions by
 * `installment_sequence` when valid, then fills remaining slots in chronological order.
 */
export function buildInstallmentScheduleRows(
    plan: Pick<
        TransactionInstallmentPlanRef,
        | "total_installments"
        | "installment_amount"
        | "final_installment_amount"
    >,
    slices: InstallmentPlanSliceInput[]
): InstallmentScheduleRow[] {
    const n = Math.max(0, Math.floor(plan.total_installments))
    if (n < 1) return []

    const occupied: (InstallmentPlanSliceInput | null)[] = new Array(
        n + 1
    ).fill(null)
    const pending: InstallmentPlanSliceInput[] = []

    const sortedForSequence = [...slices].sort((a, b) => {
        const sa = a.installment_sequence
        const sb = b.installment_sequence
        if (sa != null && sb != null && sa !== sb) return sa - sb
        if (sa != null && sb == null) return -1
        if (sa == null && sb != null) return 1
        const da = a.date.localeCompare(b.date)
        if (da !== 0) return da
        return a.created_at.localeCompare(b.created_at)
    })

    for (const s of sortedForSequence) {
        const seq = s.installment_sequence
        if (
            seq != null &&
            Number.isFinite(seq) &&
            seq >= 1 &&
            seq <= n &&
            occupied[seq] == null
        ) {
            occupied[seq] = s
        } else {
            pending.push(s)
        }
    }

    pending.sort((a, b) => {
        const da = a.date.localeCompare(b.date)
        if (da !== 0) return da
        return a.created_at.localeCompare(b.created_at)
    })

    for (const s of pending) {
        const k = firstEmptySlot(occupied, n)
        if (k != null) {
            occupied[k] = s
        }
    }

    const rows: InstallmentScheduleRow[] = []
    for (let k = 1; k <= n; k++) {
        const expected = expectedAmountForSlot(plan, k)
        const slice = occupied[k]
        if (slice) {
            rows.push({
                slot: k,
                transactionId: slice.id,
                date: slice.date,
                parcelAmount: expected,
                status: "posted",
                invoicePaid: false,
            })
        } else {
            rows.push({
                slot: k,
                transactionId: null,
                date: null,
                parcelAmount: expected,
                status: "pending",
                invoicePaid: false,
            })
        }
    }
    return rows
}
