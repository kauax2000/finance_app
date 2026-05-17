/**
 * Pure helpers for subscription-linked transaction summary (Assinaturas detail sheet).
 */

export function formatSubscriptionChargeDatePtBr(
    iso: string | null | undefined
): string {
    if (!iso) return "—"
    const [y, m, d] = iso.split("-").map(Number)
    if (!y || !m || !d) return iso
    return new Date(y, m - 1, d).toLocaleDateString("pt-BR")
}

export function formatSubscriptionTxSummary(
    subscriptionId: string,
    stats: Record<string, { count: number; lastDate: string }>,
    nextChargeYmd?: string | null
): string {
    const st = stats[subscriptionId]
    const next = nextChargeYmd
        ? ` · próxima ${formatSubscriptionChargeDatePtBr(nextChargeYmd.slice(0, 10))}`
        : ""
    if (st && st.count > 0) {
        const nLabel = st.count === 1 ? "cobrança" : "cobranças"
        const last = st.lastDate
            ? ` · última ${formatSubscriptionChargeDatePtBr(st.lastDate.slice(0, 10))}`
            : ""
        return `${st.count} ${nLabel} em transações${last}${next}`
    }
    return `Nenhuma cobrança vinculada em transações ainda.${next}`
}
