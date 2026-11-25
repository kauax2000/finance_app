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

/**
 * As linhas da exclusão a partir das que a tela tem em mãos. Faltou uma: `undefined`, para o
 * `deleteTransactionsByIds` ler `installment_plan_id` no banco (sem ele, a parcela sairia sozinha).
 */
export function linhasConhecidas(
    ids: string[],
    conhecidas: ReadonlyArray<TransactionDeleteRow>
): TransactionDeleteRow[] | undefined {
    const byId = new Map(conhecidas.map((t) => [t.id, t]))
    const rows: TransactionDeleteRow[] = []
    for (const id of ids) {
        const t = byId.get(id)
        if (!t) return undefined
        rows.push({ id, installment_plan_id: t.installment_plan_id ?? null })
    }
    return rows
}
