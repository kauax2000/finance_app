"use client"

import { invokeEdgeJson } from "@/lib/edge-invoke"

/** Fire-and-forget member expense alerts after a manual expense insert. */
export function scheduleNotifyTransactionCreated(transactionId: string): void {
    const id = transactionId.trim()
    if (!id) return
    void invokeEdgeJson("notify-transaction-created", {
        body: { transaction_id: id },
    }).catch(() => {
        /* non-blocking */
    })
}
