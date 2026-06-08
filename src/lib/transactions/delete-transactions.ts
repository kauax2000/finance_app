export type TransactionDeleteRow = {
    id: string
    installment_plan_id?: string | null
}

export type PartitionedTransactionDeletes = {
    planIds: string[]
    plainTransactionIds: string[]
}

/** Split delete targets into whole-plan cascades vs plain transaction deletes. */
export function partitionTransactionDeletes(
    rows: TransactionDeleteRow[]
): PartitionedTransactionDeletes {
    const planIds = new Set<string>()
    const plainTransactionIds: string[] = []

    for (const row of rows) {
        const planId = row.installment_plan_id?.trim()
        if (planId) {
            planIds.add(planId)
            continue
        }
        plainTransactionIds.push(row.id)
    }

    return {
        planIds: [...planIds],
        plainTransactionIds,
    }
}

export const INSTALLMENT_DELETE_WARNING =
    "Esta compra parcelada inteira será cancelada: todas as parcelas já lançadas e as projeções no painel serão removidas."

export function hasInstallmentDeleteImpact(
    rows: Pick<TransactionDeleteRow, "installment_plan_id">[]
): boolean {
    return rows.some((row) => Boolean(row.installment_plan_id))
}
