"use client"

import { invokeEdgeJson } from "@/lib/edge-invoke"

/** Fire-and-forget edge evaluation after a workspace transaction touches a card. */
export function scheduleEvaluateCreditCardAlerts(args: {
    workspaceId: string
    type: string
    paymentMethod: string | null | undefined
    paymentCreditCardId: string | null | undefined
    categoryId: string | null | undefined
    dateIso: string
}): void {
    if (args.type !== "expense") return
    if (args.paymentMethod !== "credit_card" || !args.paymentCreditCardId) return
    void invokeEdgeJson("evaluate-credit-card-alerts", {
        body: {
            workspace_id: args.workspaceId,
            payment_credit_card_id: args.paymentCreditCardId,
            category_id: args.categoryId ?? null,
            occurred_at: args.dateIso,
        },
    }).catch(() => {
        /* non-blocking */
    })
}
